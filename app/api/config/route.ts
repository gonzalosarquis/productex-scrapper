import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('scraper_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('scraper_config')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const payload = {
      user_id: user.id,
      apify_token:
        typeof body.apify_token === 'string' ? body.apify_token : null,
      actor_id:
        typeof body.actor_id === 'string'
          ? body.actor_id
          : 'apify/instagram-scraper',
      max_items:
        typeof body.max_items === 'number' ? body.max_items : 50,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data, error } = await supabase
        .from('scraper_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ config: data })
    }

    const { data, error } = await supabase
      .from('scraper_config')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
