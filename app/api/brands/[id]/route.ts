import { NextResponse } from 'next/server'

import { jsonServerError, jsonUnauthorized } from '@/lib/api-response'
import { getSupabaseForApiRoute } from '@/lib/supabase/api-route'
import type { Brand } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_PUT: (keyof Brand)[] = ['status', 'notes', 'phone']

export async function PUT(request: Request, context: Params) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
    }

    const { id } = await context.params
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid body',
          message: 'El cuerpo debe ser un objeto JSON.',
        },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Not found', message: 'Marca no encontrada o sin permiso.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ brand: data })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
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
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Not found', message: 'Marca no encontrada o sin permiso.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, deleted: data.id })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}
