-- ============================================================
-- COMBINED SCHEMA — paste once into a NEW project's SQL editor.
--
-- Migrations 001, 002, 004, 005, 006, 007, 008 in order.
--
-- 003_clear_seed_data.sql is DELIBERATELY EXCLUDED. It runs
--   DELETE FROM payment; DELETE FROM member_subscription; DELETE FROM member;
-- which is harmless on an empty project but would destroy everything if this
-- file were ever re-run after the data import. It was a one-off cleanup, not
-- schema, so it has no place here.
--
-- Safe to run on an EMPTY project only. Expect "Success. No rows returned".
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- Body Temple Gym — Initial Schema
-- ============================================================

-- Gym (single gym in v1, gym_id on all tables for future multi-tenant)
CREATE TABLE gym (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff users — id mirrors auth.users.id so Supabase Auth handles passwords
CREATE TABLE staff_user (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id      UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membership plans
CREATE TABLE membership_plan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members
CREATE TABLE member (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                    UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  full_name                 TEXT NOT NULL,
  phone                     TEXT,
  email                     TEXT,
  date_of_birth             DATE,
  join_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url                 TEXT,
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,
  notes                     TEXT,
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'active', 'inactive')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_updated_at
  BEFORE UPDATE ON member
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Member subscriptions — one row per plan assignment period
CREATE TABLE member_subscription (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES membership_plan(id),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- Index: fast lookup of current subscription for a member
CREATE INDEX idx_member_subscription_member ON member_subscription(member_id, is_current);

-- Payments — covers both payment entries and adjustment entries.
-- Adjustments must reference the original via related_payment_id and include a reason.
-- Original entries are NEVER deleted or edited — use an adjustment entry to correct.
CREATE TABLE payment (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id               UUID NOT NULL REFERENCES gym(id) ON DELETE CASCADE,
  member_id            UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  subscription_id      UUID REFERENCES member_subscription(id),
  recorded_by          UUID NOT NULL REFERENCES staff_user(id),

  type                 TEXT NOT NULL DEFAULT 'payment'
                         CHECK (type IN ('payment', 'adjustment')),
  amount               NUMERIC(10,2) NOT NULL,
  payment_date         DATE NOT NULL,
  payment_method       TEXT NOT NULL
                         CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'other')),
  period_start         DATE,
  period_end           DATE,
  notes                TEXT,

  -- Adjustment fields (only used when type = 'adjustment')
  related_payment_id   UUID REFERENCES payment(id),
  reason               TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Adjustments must always have a reason and reference the original
  CONSTRAINT adjustment_requires_reason
    CHECK (type != 'adjustment' OR (reason IS NOT NULL AND related_payment_id IS NOT NULL)),
  -- Original payments must not self-reference
  CONSTRAINT payment_no_self_reference
    CHECK (id != related_payment_id)
);

CREATE INDEX idx_payment_member ON payment(member_id, payment_date DESC);
CREATE INDEX idx_payment_gym_date ON payment(gym_id, payment_date DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE gym               ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_user        ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plan   ENABLE ROW LEVEL SECURITY;
ALTER TABLE member            ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment           ENABLE ROW LEVEL SECURITY;

-- Staff can read/write their own gym's data
CREATE POLICY "staff_gym_access" ON gym
  FOR ALL USING (
    id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

CREATE POLICY "staff_user_access" ON staff_user
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

CREATE POLICY "staff_plan_access" ON membership_plan
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

-- Members: staff can access their gym's members; public join route can insert pending members
CREATE POLICY "staff_member_access" ON member
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

CREATE POLICY "public_member_insert" ON member
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "staff_subscription_access" ON member_subscription
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

CREATE POLICY "staff_payment_access" ON payment
  FOR ALL USING (
    gym_id IN (SELECT gym_id FROM staff_user WHERE id = auth.uid())
  );

-- Prevent deletion of payment records (enforce audit trail at DB level)
CREATE POLICY "no_payment_delete" ON payment
  AS RESTRICTIVE FOR DELETE USING (FALSE);

-- Prevent updates to payment records (use adjustment entries instead)
CREATE POLICY "no_payment_update" ON payment
  AS RESTRICTIVE FOR UPDATE USING (FALSE);


-- ════════════════════════════════════════════════════════════
-- 002_fix_rls_policies.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- Fix: RLS circular reference on staff_user table
-- The original staff_user policy queried staff_user inside itself,
-- causing Postgres to return no rows. Solution: a SECURITY DEFINER
-- helper function that bypasses RLS for the gym_id lookup, plus
-- a simple direct-id policy on staff_user itself.
-- ============================================================

-- 1. Helper function: returns the caller's gym_id without hitting RLS
CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM staff_user WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Fix staff_user policy — staff can read/write their own row only
DROP POLICY IF EXISTS "staff_user_access" ON staff_user;
CREATE POLICY "staff_user_access" ON staff_user
  FOR ALL USING (id = auth.uid());

-- 3. Rebuild all other policies to use get_my_gym_id() instead of the subquery

DROP POLICY IF EXISTS "staff_gym_access" ON gym;
CREATE POLICY "staff_gym_access" ON gym
  FOR ALL USING (id = get_my_gym_id());

DROP POLICY IF EXISTS "staff_plan_access" ON membership_plan;
CREATE POLICY "staff_plan_access" ON membership_plan
  FOR ALL USING (gym_id = get_my_gym_id());

DROP POLICY IF EXISTS "staff_member_access" ON member;
CREATE POLICY "staff_member_access" ON member
  FOR ALL USING (gym_id = get_my_gym_id());

-- Keep public insert for walk-in self-signup (/join page)
DROP POLICY IF EXISTS "public_member_insert" ON member;
CREATE POLICY "public_member_insert" ON member
  FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "staff_subscription_access" ON member_subscription;
CREATE POLICY "staff_subscription_access" ON member_subscription
  FOR ALL USING (gym_id = get_my_gym_id());

DROP POLICY IF EXISTS "staff_payment_access" ON payment;
CREATE POLICY "staff_payment_access" ON payment
  FOR ALL USING (gym_id = get_my_gym_id());

-- Audit trail: keep delete/update locked
DROP POLICY IF EXISTS "no_payment_delete" ON payment;
CREATE POLICY "no_payment_delete" ON payment
  AS RESTRICTIVE FOR DELETE USING (false);

DROP POLICY IF EXISTS "no_payment_update" ON payment;
CREATE POLICY "no_payment_update" ON payment
  AS RESTRICTIVE FOR UPDATE USING (false);


-- ════════════════════════════════════════════════════════════
-- 004_public_gym_read.sql
-- ════════════════════════════════════════════════════════════

-- QA-001: Allow anonymous users to read gym info so the /join self-signup form works.
-- Without this, the RLS on gym only allows staff, so POST /api/auth returns "Gym not configured".
CREATE POLICY "public_gym_read" ON gym
  FOR SELECT USING (true);


-- ════════════════════════════════════════════════════════════
-- 005_rls_and_rpc.sql
-- ════════════════════════════════════════════════════════════

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


-- ════════════════════════════════════════════════════════════
-- 006_performance.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- Migration 006 — Performance: indexes + dashboard aggregation
-- Every index below corresponds to a query that runs on page load.
-- ============================================================

-- Query: SELECT count(*) FROM member WHERE gym_id = ? AND status = 'active'
--        SELECT ... FROM member WHERE gym_id = ? AND status = 'pending'
--        /api/members?status=  (status filter)
-- Before: sequential scan on member, filter on both columns.
CREATE INDEX IF NOT EXISTS idx_member_gym_status
  ON member (gym_id, status);

-- Query: expiring-soon / overdue on the dashboard —
--        WHERE gym_id = ? AND is_current AND end_date BETWEEN/< ? ORDER BY end_date
-- Before: idx_member_subscription_member leads with member_id, so it could not
-- serve a gym-wide scan; Postgres fell back to a seq scan plus an explicit sort.
-- Partial index keeps it small: only current subscriptions are ever queried this way.
CREATE INDEX IF NOT EXISTS idx_member_subscription_gym_current_end
  ON member_subscription (gym_id, end_date)
  WHERE is_current;

-- Query: the members list embeds only the current subscription per member.
CREATE INDEX IF NOT EXISTS idx_member_subscription_current_by_member
  ON member_subscription (member_id)
  WHERE is_current;

-- Query: monthly revenue —
--        WHERE gym_id = ? AND type = 'payment' AND payment_date >= ?
-- Before: idx_payment_gym_date lacked `type`, so every adjustment row was
-- read and discarded.
CREATE INDEX IF NOT EXISTS idx_payment_gym_type_date
  ON payment (gym_id, type, payment_date DESC);

-- ============================================================
-- Dashboard stats in one database round trip.
--
-- Replaces five separate PostgREST requests plus a JavaScript .reduce() over
-- every payment row in the month. SECURITY INVOKER (the default) so RLS still
-- applies to every table read here; the gym is resolved from the caller's own
-- session via get_my_gym_id() rather than trusted from the application.
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_today DATE)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_gym_id      UUID := get_my_gym_id();
  v_month_start DATE := date_trunc('month', p_today)::DATE;
  v_horizon     DATE := p_today + 7;
BEGIN
  IF v_gym_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'total_active', (
      SELECT COUNT(*)
      FROM member
      WHERE gym_id = v_gym_id AND status = 'active'
    ),

    'revenue_this_month', (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment
      WHERE gym_id = v_gym_id
        AND type = 'payment'
        AND payment_date >= v_month_start
    ),

    'expiring_soon', COALESCE((
      SELECT json_agg(x)
      FROM (
        SELECT
          s.id, s.start_date, s.end_date, s.is_current,
          json_build_object('name', p.name, 'price', p.price) AS membership_plan,
          json_build_object(
            'id', m.id, 'full_name', m.full_name,
            'phone', m.phone, 'email', m.email, 'status', m.status
          ) AS member
        FROM member_subscription s
        JOIN member m          ON m.id = s.member_id
        LEFT JOIN membership_plan p ON p.id = s.plan_id
        WHERE s.gym_id = v_gym_id
          AND s.is_current
          AND m.status = 'active'
          AND s.end_date >= p_today
          AND s.end_date <= v_horizon
        ORDER BY s.end_date
      ) x
    ), '[]'::json),

    'overdue', COALESCE((
      SELECT json_agg(x)
      FROM (
        SELECT
          s.id, s.start_date, s.end_date, s.is_current,
          json_build_object('name', p.name, 'price', p.price) AS membership_plan,
          json_build_object(
            'id', m.id, 'full_name', m.full_name,
            'phone', m.phone, 'email', m.email, 'status', m.status
          ) AS member
        FROM member_subscription s
        JOIN member m          ON m.id = s.member_id
        LEFT JOIN membership_plan p ON p.id = s.plan_id
        WHERE s.gym_id = v_gym_id
          AND s.is_current
          AND m.status = 'active'
          AND s.end_date < p_today
        ORDER BY s.end_date
      ) x
    ), '[]'::json),

    'pending_signups', COALESCE((
      SELECT json_agg(x)
      FROM (
        SELECT id, full_name, phone, email, created_at
        FROM member
        WHERE gym_id = v_gym_id AND status = 'pending'
        ORDER BY created_at DESC
      ) x
    ), '[]'::json),

    'pending_count', (
      SELECT COUNT(*)
      FROM member
      WHERE gym_id = v_gym_id AND status = 'pending'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;

-- Net revenue across the whole filtered payment set, so the payments page can
-- paginate without the total changing per page. Aggregating here avoids
-- shipping every matching row to Node just to .reduce() it.
CREATE OR REPLACE FUNCTION get_payment_totals(
  p_type TEXT DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to   DATE DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payment
  WHERE gym_id = get_my_gym_id()
    AND (p_type IS NULL OR type = p_type)
    AND (p_from IS NULL OR payment_date >= p_from)
    AND (p_to   IS NULL OR payment_date <= p_to);
$$;

GRANT EXECUTE ON FUNCTION get_payment_totals TO authenticated;

-- Pending-signup badge for the sidebar, so the browser no longer needs a
-- Supabase client just to run a COUNT.
CREATE OR REPLACE FUNCTION get_pending_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM member
  WHERE gym_id = get_my_gym_id() AND status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION get_pending_count TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 007_renewal_reference.sql
-- ════════════════════════════════════════════════════════════

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


-- ════════════════════════════════════════════════════════════
-- 008_staff_bootstrap.sql
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- Migration 008 — Collapse two per-request round trips into one
--
-- Measured on production: every authenticated page made four sequential
-- Supabase round trips before fetching anything it displayed, at roughly
-- 330ms each. /join-qr, which runs no page-level query at all, still cost
-- ~1.4s; /dashboard with its full stats RPC was no slower. The fixed path
-- was the bottleneck, not the queries.
--
--   before                                  after
--   1 middleware  auth.getUser()            1 middleware  auth.getUser()
--   2 layout      auth.getUser()            2 layout      auth.getUser()
--   3 layout      staff_user select         3 layout      get_staff_bootstrap()
--   4 layout      get_pending_count()
--
-- Steps 3 and 4 asked the same database two questions that have one answer
-- between them, so they are now one call.
--
-- Security is unchanged. SECURITY INVOKER, so RLS applies to the member
-- count exactly as before, and the gym is resolved from the caller's own
-- session via get_my_gym_id() — never passed in by the application.
-- ============================================================

CREATE OR REPLACE FUNCTION get_staff_bootstrap()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_gym_id UUID := get_my_gym_id();
BEGIN
  -- NULL means the caller has no staff_user row: not staff, no access.
  -- The application treats this the same as an unauthenticated request.
  IF v_gym_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'gym_id', v_gym_id,
    'pending_count', (
      SELECT COUNT(*)
      FROM member
      WHERE gym_id = v_gym_id AND status = 'pending'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_staff_bootstrap TO authenticated;

-- get_pending_count() is left in place: it is no longer called by the
-- application, but dropping it would break any deployment still running the
-- previous build during the rollout window.

