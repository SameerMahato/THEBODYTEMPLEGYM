-- QA-001: Allow anonymous users to read gym info so the /join self-signup form works.
-- Without this, the RLS on gym only allows staff, so POST /api/auth returns "Gym not configured".
CREATE POLICY "public_gym_read" ON gym
  FOR SELECT USING (true);
