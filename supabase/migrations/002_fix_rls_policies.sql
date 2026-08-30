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
