-- ============================================================
-- Migration 007 — Payment reference (transaction / UPI ref)
--
-- Renewal needs to record a transaction reference for UPI, card and bank
-- transfers. Everything else the renewal flow needs already exists:
-- create_payment_with_plan() closes the current subscription, opens the new
-- one, records the payment and activates the member in a single transaction,
-- and member_subscription rows are never overwritten, so renewal history is
-- already preserved.
-- ============================================================

ALTER TABLE payment ADD COLUMN IF NOT EXISTS reference TEXT;

-- Recreate create_payment_with_plan with p_reference appended.
-- CREATE OR REPLACE cannot add a parameter, it would register an overload and
-- make every existing 9-argument call ambiguous, so the old signature is
-- dropped first. p_reference defaults to NULL, so callers that do not pass it
-- (the ordinary "Record Payment" path) are unaffected.
DROP FUNCTION IF EXISTS create_payment_with_plan(
  UUID, UUID, UUID, NUMERIC, DATE, TEXT, DATE, TEXT, UUID
);

CREATE OR REPLACE FUNCTION create_payment_with_plan(
  p_gym_id          UUID,
  p_member_id       UUID,
  p_recorded_by     UUID,
  p_amount          NUMERIC,
  p_payment_date    DATE,
  p_payment_method  TEXT,
  p_period_start    DATE,
  p_notes           TEXT,
  p_plan_id         UUID,
  p_reference       TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id  UUID;
  v_sub_id      UUID;
  v_duration    INTEGER;
  v_sub_start   DATE;
  v_sub_end     DATE;
BEGIN
  -- C-4: Validate member belongs to this gym
  IF NOT EXISTS (
    SELECT 1 FROM member WHERE id = p_member_id AND gym_id = p_gym_id
  ) THEN
    RAISE EXCEPTION 'Member not found in gym';
  END IF;

  -- Validate plan belongs to this gym
  SELECT duration_days INTO v_duration
  FROM membership_plan
  WHERE id = p_plan_id AND gym_id = p_gym_id AND is_active = TRUE;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  -- Close any current subscription for this member. The row is kept, only
  -- is_current is cleared, so the member's full history survives the renewal.
  UPDATE member_subscription
  SET is_current = FALSE
  WHERE member_id = p_member_id AND is_current = TRUE;

  -- Calculate subscription dates
  v_sub_start := COALESCE(p_period_start, p_payment_date);
  v_sub_end   := v_sub_start + (v_duration || ' days')::INTERVAL;

  -- Insert new subscription
  INSERT INTO member_subscription (gym_id, member_id, plan_id, start_date, end_date, is_current)
  VALUES (p_gym_id, p_member_id, p_plan_id, v_sub_start, v_sub_end, TRUE)
  RETURNING id INTO v_sub_id;

  -- Insert payment with subscription_id already set (avoids UPDATE + RESTRICTIVE policy)
  INSERT INTO payment (
    gym_id, member_id, subscription_id, recorded_by,
    type, amount, payment_date, payment_method,
    period_start, period_end, notes, reference
  ) VALUES (
    p_gym_id, p_member_id, v_sub_id, p_recorded_by,
    'payment', p_amount, p_payment_date, p_payment_method,
    v_sub_start, v_sub_end, p_notes, NULLIF(TRIM(p_reference), '')
  )
  RETURNING id INTO v_payment_id;

  -- Activate member — this is what flips a renewed member from expired to active
  UPDATE member SET status = 'active' WHERE id = p_member_id;

  RETURN json_build_object(
    'id',              v_payment_id,
    'subscription_id', v_sub_id,
    'type',            'payment',
    'amount',          p_amount,
    'payment_date',    p_payment_date,
    'period_start',    v_sub_start,
    'period_end',      v_sub_end,
    'gym_id',          p_gym_id,
    'member_id',       p_member_id,
    'recorded_by',     p_recorded_by
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_payment_with_plan TO authenticated;
