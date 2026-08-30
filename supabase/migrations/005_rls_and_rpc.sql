-- ============================================================
-- Migration 005 — RLS fixes + atomic payment RPC
-- ============================================================

-- M-1: Strengthen public_member_insert to only allow valid gym_id values
DROP POLICY IF EXISTS "public_member_insert" ON member;
CREATE POLICY "public_member_insert" ON member
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND gym_id IN (SELECT id FROM gym)
  );

-- C-3 / C-2: Atomic payment creation that bypasses no_payment_update
-- This function runs as the definer (postgres) so it can update payment.subscription_id
-- even though the RESTRICTIVE no_payment_update policy blocks normal UPDATE.
-- The Next.js route calls this via supabase.rpc() for the subscription path.
CREATE OR REPLACE FUNCTION create_payment_with_plan(
  p_gym_id          UUID,
  p_member_id       UUID,
  p_recorded_by     UUID,
  p_amount          NUMERIC,
  p_payment_date    DATE,
  p_payment_method  TEXT,
  p_period_start    DATE,
  p_notes           TEXT,
  p_plan_id         UUID
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

  -- Close any current subscription for this member
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
    period_start, period_end, notes
  ) VALUES (
    p_gym_id, p_member_id, v_sub_id, p_recorded_by,
    'payment', p_amount, p_payment_date, p_payment_method,
    v_sub_start, v_sub_end, p_notes
  )
  RETURNING id INTO v_payment_id;

  -- Activate member
  UPDATE member SET status = 'active' WHERE id = p_member_id;

  RETURN json_build_object(
    'id',              v_payment_id,
    'subscription_id', v_sub_id,
    'type',            'payment',
    'amount',          p_amount,
    'payment_date',    p_payment_date,
    'gym_id',          p_gym_id,
    'member_id',       p_member_id,
    'recorded_by',     p_recorded_by
  );
END;
$$;

-- Grant execute to authenticated users (staff)
GRANT EXECUTE ON FUNCTION create_payment_with_plan TO authenticated;
