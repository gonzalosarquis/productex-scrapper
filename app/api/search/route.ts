import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const keywords = Array.isArray(body.keywords) ? body.keywords : []
  const countries = Array.isArray(body.countries) ? body.countries : []
  const cities = Array.isArray(body.cities) ? body.cities : []
  const min_followers =
    typeof body.min_followers === 'number' ? body.min_followers : 1000
  const max_followers =
    body.max_followers === null || body.max_followers === undefined
      ? null
      : Number(body.max_followers)

  const { data, error } = await supabase
    .from('search_tasks')
    .insert({
      user_id: user.id,
      name: body.name,
      keywords,
      countries,
      cities,
      min_followers,
      max_followers,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
