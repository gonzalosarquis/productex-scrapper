import { NextResponse } from 'next/server'

import { jsonServerError } from '@/lib/api-response'
import { ApifyService } from '@/lib/apify'
import { finalizeSuccessfulRun } from '@/lib/complete-search'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import type { SearchTask } from '@/lib/types'

type WebhookBody = {
  eventType?: string
  eventData?: { actorRunId?: string }
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          error: 'Server misconfigured',
          message:
            'Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      )
    }

    const payload = (await request.json().catch(() => null)) as WebhookBody | null
    if (!payload?.eventType) {
      return NextResponse.json({ ok: true })
    }

    if (payload.eventType !== 'ACTOR_RUN_SUCCEEDED') {
      return NextResponse.json({ ok: true })
    }

    const runId = payload.eventData?.actorRunId
    if (!runId) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createServiceRoleClient()

    const { data: taskRow, error: taskErr } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('apify_run_id', runId)
      .maybeSingle()

    if (taskErr || !taskRow) {
      return NextResponse.json({ ok: true })
    }

    const task = taskRow as SearchTask

    if (task.status === 'completed') {
      return NextResponse.json({ ok: true })
    }

    const { data: cfg } = await supabase
      .from('scraper_config')
      .select('*')
      .eq('user_id', task.user_id)
      .maybeSingle()

    if (!cfg?.apify_token) {
      await supabase
        .from('search_tasks')
        .update({
          status: 'failed',
          error_message: 'Missing Apify token in scraper_config',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      return NextResponse.json({ ok: true })
    }

    const apify = new ApifyService()
    try {
      await finalizeSuccessfulRun(supabase, task, cfg.apify_token, apify)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Finalize failed'
      await supabase
        .from('search_tasks')
        .update({
          status: 'failed',
          error_message: msg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
      console.error(e)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}
