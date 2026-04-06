import { NextResponse } from 'next/server'

import { ApifyService } from '@/lib/apify'
import { pollAndMaybeFinalize } from '@/lib/complete-search'
import { jsonServerError, jsonUnauthorized } from '@/lib/api-response'
import { getSupabaseForApiRoute } from '@/lib/supabase/api-route'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Params) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
    }

    const { id } = await context.params

    const { data: taskRow, error } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    if (!taskRow) {
      return NextResponse.json(
        { error: 'Not found', message: 'No existe la búsqueda o no tienes acceso.' },
        { status: 404 }
      )
    }

    const { data: cfg } = await supabase
      .from('scraper_config')
      .select('apify_token')
      .eq('user_id', user.id)
      .maybeSingle()

    const apify = new ApifyService()
    const { task, apifyStatus } = await pollAndMaybeFinalize(
      supabase,
      taskRow,
      cfg?.apify_token ?? null,
      apify
    )

    return NextResponse.json({ task, status: apifyStatus })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}
