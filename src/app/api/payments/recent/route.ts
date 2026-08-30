import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type') || ''
  const dateFrom  = searchParams.get('from') || ''
  const dateTo    = searchParams.get('to') || ''

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 403 })

  let query = supabase
    .from('payment')
    .select(`
      *,
      member(id, full_name),
      staff_user(full_name)
    `)
    .eq('gym_id', staff.gym_id)
    .order('payment_date', { ascending: false })
    .limit(500)

  if (typeFilter) query = query.eq('type', typeFilter)
  if (dateFrom)   query = query.gte('payment_date', dateFrom)
  if (dateTo)     query = query.lte('payment_date', dateTo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
