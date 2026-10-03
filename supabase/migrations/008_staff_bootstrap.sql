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
