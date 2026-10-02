import { NextRequest, NextResponse } from 'next/server'
import { getPayments } from '@/lib/data/payments'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  try {
    const result = await getPayments({
      type: searchParams.get('type') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      page: Number(searchParams.get('page')) || 0,
    })
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
