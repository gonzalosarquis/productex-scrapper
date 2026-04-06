import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import type { Brand } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_PUT: (keyof Brand)[] = [
  'status',
  'notes',
  'email',
  'phone',
]

export async function PUT(request: Request, context: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const updates: Partial<Brand> = {}
    for (const key of ALLOWED_PUT) {
      if (key in body) {
        ;(updates as Record<string, unknown>)[key] = body[key as string]
      }
    }

    const { data, error } = await supabase
      .from('brands')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ brand: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const { data, error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, deleted: data.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
