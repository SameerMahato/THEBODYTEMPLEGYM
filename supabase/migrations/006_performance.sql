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
