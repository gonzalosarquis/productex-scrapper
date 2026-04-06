import { NextResponse } from 'next/server'

import { ApifyService } from '@/lib/apify'
import { getSupabaseForApiRoute } from '@/lib/supabase/api-route'
import type { SearchTask } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (
      !body ||
      typeof body.name !== 'string' ||
      !Array.isArray(body.keywords) ||
      body.keywords.length === 0 ||
      typeof body.min_followers !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid body: require name, keywords (non-empty array), min_followers' },
        { status: 400 }
      )
    }

    const keywords = body.keywords.map((k: unknown) => String(k))
    const countries = Array.isArray(body.countries)
      ? body.countries.map((c: unknown) => String(c))
      : []
    const cities = Array.isArray(body.cities)
      ? body.cities.map((c: unknown) => String(c))
      : []
    const min_followers = body.min_followers as number
    const max_followers =
      body.max_followers === null || body.max_followers === undefined
        ? null
        : Number(body.max_followers)

    const { data: inserted, error: insertError } = await supabase
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
      .select('*')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Insert failed' },
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
          { task: (failedTask ?? task) as SearchTask, error: msg },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ task })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
