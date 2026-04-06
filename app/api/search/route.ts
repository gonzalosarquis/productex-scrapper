import { NextResponse } from 'next/server'

import { ApifyService } from '@/lib/apify'
import { jsonServerError, jsonUnauthorized } from '@/lib/api-response'
import { getSupabaseForApiRoute } from '@/lib/supabase/api-route'
import type { SearchTask } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
    }

    const { data, error } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ tasks: data ?? [] })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.name !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid body',
          message: 'Se requiere name (string).',
        },
        { status: 400 }
      )
    }

    const search_query =
      typeof body.search_query === 'string' && body.search_query.trim()
        ? body.search_query.trim()
        : 'tienda de ropa'

    const cities = Array.isArray(body.cities)
      ? body.cities.map((c: unknown) => String(c))
      : []

    const min_rating =
      typeof body.min_rating === 'number' ? body.min_rating : 0
    const max_results =
      typeof body.max_results === 'number' ? body.max_results : 100

    const { data: inserted, error: insertError } = await supabase
      .from('search_tasks')
      .insert({
        user_id: user.id,
        name: body.name,
        search_query,
        cities,
        min_rating,
        max_results,
        status: 'pending',
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          error: 'Insert failed',
          message: insertError?.message ?? 'No se pudo crear la búsqueda.',
        },
        { status: 500 }
      )
    }

    let task = inserted as SearchTask

    const { data: cfg } = await supabase
      .from('scraper_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (cfg?.apify_token) {
      const apify = new ApifyService()
      try {
        const runId = await apify.startSearch(cfg, task)
        const { data: updated, error: updErr } = await supabase
          .from('search_tasks')
          .update({
            apify_run_id: runId,
            status: 'running',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)
          .select('*')
          .single()

        if (updErr || !updated) {
          throw new Error(updErr?.message ?? 'update failed')
        }
        task = updated as SearchTask
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Apify start failed'
        await supabase
          .from('search_tasks')
          .update({
            status: 'failed',
            error_message: msg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        const { data: failedTask } = await supabase
          .from('search_tasks')
          .select('*')
          .eq('id', task.id)
          .single()

        return NextResponse.json(
          {
            task: (failedTask ?? task) as SearchTask,
            error: 'Apify error',
            message: msg,
          },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ task })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}
