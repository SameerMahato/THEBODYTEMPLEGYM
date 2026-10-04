/**
 * Copies gym data from one Supabase project to another, for the Seoul ->
 * Mumbai region move. Six tables, in foreign-key order, over the REST API.
 *
 * Replaces exporting and importing six CSVs by hand, which is where UUIDs get
 * mangled and rows land in the wrong order.
 *
 *   node scripts/migrate-region.mjs           # dry run: reads only, reports counts
 *   node scripts/migrate-region.mjs --apply   # writes to the target
 *
 * Reads from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL      source project
 *   SUPABASE_SERVICE_ROLE_KEY     source service-role key
 *   TARGET_SUPABASE_URL           new project
 *   TARGET_SERVICE_ROLE_KEY       new project's service-role key
 *
 * Service-role keys bypass RLS, which is what lets this read every row and
 * write into `payment` despite its RESTRICTIVE no-update/no-delete policies.
 * They are read from .env.local and never logged.
 */

import { readFileSync } from 'node:fs'

// Foreign keys dictate this order. A child whose parent is missing is rejected.
const TABLES = [
  'gym',
  'staff_user',          // also needs the auth.users row to exist first
  'membership_plan',
  'member',
  'member_subscription',
  'payment',
]

function loadEnv() {
  const env = {}
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function fetchAll(url, key, table) {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.asc`, {
      headers: { ...headers(key), Range: `${from}-${from + page - 1}` },
    })
    if (!res.ok) throw new Error(`read ${table}: ${res.status} ${await res.text()}`)
    const batch = await res.json()
    rows.push(...batch)
    if (batch.length < page) break
  }
  return rows
}

async function insertAll(url, key, table, rows) {
  if (!rows.length) return 0
  const chunk = 500
  let written = 0
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk)
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers(key), Prefer: 'return=minimal' },
      body: JSON.stringify(slice),
    })
    if (!res.ok) throw new Error(`write ${table}: ${res.status} ${await res.text()}`)
    written += slice.length
  }
  return written
}

async function count(url, key, table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id`, {
    headers: { ...headers(key), Prefer: 'count=exact', Range: '0-0' },
  })
  const cr = res.headers.get('content-range')
  return cr ? Number(cr.split('/')[1]) : null
}

const apply = process.argv.includes('--apply')
const env = loadEnv()

const SRC = env.NEXT_PUBLIC_SUPABASE_URL
const SRC_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const DST = env.TARGET_SUPABASE_URL
const DST_KEY = env.TARGET_SERVICE_ROLE_KEY

if (!SRC || !SRC_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!DST || !DST_KEY) {
  console.error('Missing TARGET_SUPABASE_URL or TARGET_SERVICE_ROLE_KEY in .env.local.')
  console.error('Add them once the ap-south-1 project exists, then re-run.')
  process.exit(1)
}

console.log(`source  ${SRC}`)
console.log(`target  ${DST}`)
console.log(apply ? '\nMODE: APPLY — writing to target\n' : '\nMODE: dry run — reading only, nothing written\n')

let failed = false
for (const table of TABLES) {
  try {
    const rows = await fetchAll(SRC, SRC_KEY, table)
    const before = await count(DST, DST_KEY, table)

    if (!apply) {
      console.log(`  ${table.padEnd(20)} source ${String(rows.length).padStart(5)}  target ${String(before).padStart(5)}  (would copy ${rows.length})`)
      continue
    }

    if (before > 0) {
      console.log(`  ${table.padEnd(20)} SKIPPED — target already has ${before} rows`)
      continue
    }

    const written = await insertAll(DST, DST_KEY, table, rows)
    const after = await count(DST, DST_KEY, table)
    const ok = after === rows.length
    if (!ok) failed = true
    console.log(`  ${table.padEnd(20)} copied ${String(written).padStart(5)}  target now ${String(after).padStart(5)}  ${ok ? 'OK' : 'MISMATCH'}`)
  } catch (e) {
    failed = true
    console.error(`  ${table.padEnd(20)} FAILED: ${e.message}`)
    console.error('  Stopping: later tables depend on this one.')
    break
  }
}

if (!apply) {
  console.log('\nRe-run with --apply to write. Tables with existing rows are skipped,')
  console.log('so a partial run can be resumed safely.')
}
process.exit(failed ? 1 : 0)
