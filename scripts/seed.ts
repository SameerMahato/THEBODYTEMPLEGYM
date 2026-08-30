/**
 * Seed script for Body Temple Gym
 *
 * Usage:
 *   1. Copy .env.local.example to .env.local and fill in your Supabase creds
 *   2. Set ADMIN_EMAIL and ADMIN_PASSWORD below (or use env vars)
 *   3. Run: npx ts-node --skip-project scripts/seed.ts
 *
 * This script:
 *   - Creates the gym record
 *   - Creates an admin user in Supabase Auth + staff_user table
 *   - Creates 4 membership plans
 *   - Creates 10 members in various states
 *   - Records payments for active members
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@bodytemplegym.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'BodyTemple@2024!'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date()

async function seed() {
  console.log('🌱 Starting seed...\n')

  // 1. Create Gym
  const { data: gym, error: gymErr } = await supabase
    .from('gym')
    .insert({ name: 'Body Temple Gym', address: '12 Iron Cross Road, Andheri West, Mumbai', phone: '+91 98765 00001', email: 'info@bodytemplegym.com' })
    .select().single()
  if (gymErr) { console.error('Gym error:', gymErr.message); process.exit(1) }
  console.log('✅ Gym created:', gym.id)

  // 2. Create admin user
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  })
  if (authErr) { console.error('Auth user error:', authErr.message); process.exit(1) }
  console.log('✅ Admin auth user created:', ADMIN_EMAIL)

  const { error: staffErr } = await supabase.from('staff_user').insert({
    id: authUser.user.id,
    gym_id: gym.id,
    full_name: 'Gym Admin',
    email: ADMIN_EMAIL,
    role: 'admin',
  })
  if (staffErr) { console.error('Staff user error:', staffErr.message); process.exit(1) }
  const staffId = authUser.user.id
  console.log('✅ Staff user record created')

  // 3. Create Plans
  const { data: plans, error: planErr } = await supabase
    .from('membership_plan')
    .insert([
      { gym_id: gym.id, name: 'Monthly',    price: 1200,  duration_days: 30 },
      { gym_id: gym.id, name: 'Quarterly',  price: 3000,  duration_days: 90 },
      { gym_id: gym.id, name: 'Half-Yearly',price: 5500,  duration_days: 180 },
      { gym_id: gym.id, name: 'Annual',     price: 9000,  duration_days: 365 },
    ])
    .select()
  if (planErr) { console.error('Plan error:', planErr.message); process.exit(1) }
  console.log('✅ 4 plans created')

  const monthly   = plans[0]
  const quarterly = plans[1]
  const annual    = plans[3]

  // 4. Create Members
  type MemberInsert = {
    gym_id: string
    full_name: string
    phone: string
    email: string
    join_date: string
    status: 'active' | 'inactive' | 'pending'
    date_of_birth?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    notes?: string
  }

  const memberData: MemberInsert[] = [
    { gym_id: gym.id, full_name: 'Arjun Mehta',    phone: '+91 98100 11001', email: 'arjun@example.com',    join_date: addDays(today, -180), status: 'active', notes: 'Prefers morning slots' },
    { gym_id: gym.id, full_name: 'Priya Sharma',   phone: '+91 98100 11002', email: 'priya@example.com',    join_date: addDays(today, -90),  status: 'active' },
    { gym_id: gym.id, full_name: 'Rohan Verma',    phone: '+91 98100 11003', email: 'rohan@example.com',    join_date: addDays(today, -20),  status: 'active' },
    { gym_id: gym.id, full_name: 'Ananya Singh',   phone: '+91 98100 11004', email: 'ananya@example.com',   join_date: addDays(today, -60),  status: 'active' },
    { gym_id: gym.id, full_name: 'Karan Gupta',    phone: '+91 98100 11005', email: 'karan@example.com',    join_date: addDays(today, -35),  status: 'active', notes: 'Protein shake allergy' },
    // Expiring soon (5 days left)
    { gym_id: gym.id, full_name: 'Deepika Nair',   phone: '+91 98100 11006', email: 'deepika@example.com',  join_date: addDays(today, -25),  status: 'active' },
    { gym_id: gym.id, full_name: 'Vikram Joshi',   phone: '+91 98100 11007', email: 'vikram@example.com',   join_date: addDays(today, -28),  status: 'active' },
    // Overdue
    { gym_id: gym.id, full_name: 'Sneha Kulkarni', phone: '+91 98100 11008', email: 'sneha@example.com',    join_date: addDays(today, -40),  status: 'active' },
    // Inactive
    { gym_id: gym.id, full_name: 'Amit Patel',     phone: '+91 98100 11009', email: 'amit@example.com',     join_date: addDays(today, -200), status: 'inactive' },
    // Pending signup
    { gym_id: gym.id, full_name: 'Nisha Reddy',    phone: '+91 98100 11010', email: 'nisha@example.com',    join_date: addDays(today, -1),   status: 'pending' },
  ]

  const { data: members, error: memberErr } = await supabase
    .from('member')
    .insert(memberData)
    .select()
  if (memberErr) { console.error('Member error:', memberErr.message); process.exit(1) }
  console.log('✅ 10 members created')

  // 5. Create subscriptions + payments
  const subs = [
    // Active members — various plan stages
    { m: members[0], plan: annual,    start: addDays(today, -180), end: addDays(today, 185) },
    { m: members[1], plan: quarterly, start: addDays(today, -60),  end: addDays(today, 30)  },
    { m: members[2], plan: monthly,   start: addDays(today, -5),   end: addDays(today, 25)  },
    { m: members[3], plan: quarterly, start: addDays(today, -60),  end: addDays(today, 30)  },
    { m: members[4], plan: monthly,   start: addDays(today, -5),   end: addDays(today, 25)  },
    // Expiring soon
    { m: members[5], plan: monthly,   start: addDays(today, -25),  end: addDays(today, 5)   },
    { m: members[6], plan: monthly,   start: addDays(today, -27),  end: addDays(today, 3)   },
    // Overdue — expired 10 days ago
    { m: members[7], plan: monthly,   start: addDays(today, -40),  end: addDays(today, -10) },
  ]

  for (const s of subs) {
    const { data: sub, error: subErr } = await supabase
      .from('member_subscription')
      .insert({
        gym_id: gym.id,
        member_id: s.m.id,
        plan_id: s.plan.id,
        start_date: s.start,
        end_date: s.end,
        is_current: true,
      })
      .select().single()
    if (subErr) { console.error('Sub error:', subErr.message); continue }

    await supabase.from('payment').insert({
      gym_id: gym.id,
      member_id: s.m.id,
      subscription_id: sub.id,
      recorded_by: staffId,
      type: 'payment',
      amount: s.plan.price,
      payment_date: s.start,
      payment_method: Math.random() > 0.5 ? 'upi' : 'cash',
      period_start: s.start,
      period_end: s.end,
      notes: 'Initial seeded payment',
    })
  }

  console.log('✅ Subscriptions + payments created')
  console.log('\n🎉 Seed complete!')
  console.log(`\n   Admin login: ${ADMIN_EMAIL}`)
  console.log(`   Password:    ${ADMIN_PASSWORD}`)
  console.log('\n   Members in DB: 10 (5 active, 2 expiring soon, 1 overdue, 1 inactive, 1 pending)\n')
}

seed().catch(e => { console.error(e); process.exit(1) })
