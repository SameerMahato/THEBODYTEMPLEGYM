-- Clear all seeded member data (keeps gym, staff, and membership plans)
-- Run in Supabase SQL editor as superuser (bypasses RLS)

DELETE FROM payment;
DELETE FROM member_subscription;
DELETE FROM member;
