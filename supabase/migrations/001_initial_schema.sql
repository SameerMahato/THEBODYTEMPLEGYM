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
