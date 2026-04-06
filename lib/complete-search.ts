import type { SupabaseClient } from '@supabase/supabase-js'

import { ApifyService, type ApifyRunStatus } from '@/lib/apify'
import { processBrandData } from '@/lib/brand-processor'
import type { Brand, SearchTask } from '@/lib/types'

function toBrandRow(task: SearchTask, b: Partial<Brand>): Record<string, unknown> {
  if (!b.name) throw new Error('Brand missing name')
  return {
    user_id: task.user_id,
    search_task_id: task.id,
    name: b.name,
    phone: b.phone ?? null,
    address: b.address ?? null,
    city: b.city ?? null,
    rating: b.rating ?? null,
    reviews_count: b.reviews_count ?? 0,
    instagram_url: b.instagram_url ?? null,
    website: b.website ?? null,
    google_maps_url: b.google_maps_url ?? null,
    category: b.category ?? null,
    status: b.status ?? 'pending',
    score: b.score ?? 0,
    notes: b.notes ?? null,
    last_contacted_at: b.last_contacted_at ?? null,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Descarga resultados del run, procesa marcas, upsert y marca la tarea como completada.
 */
export async function finalizeSuccessfulRun(
  supabase: SupabaseClient,
  task: SearchTask,
  token: string,
  apify: ApifyService
): Promise<{ brandsCount: number }> {
  if (!task.apify_run_id) {
    return { brandsCount: 0 }
  }

  const raw = await apify.getRunResults(task.apify_run_id, token)
  const rows = processBrandData(raw, task.min_rating ?? 0)

  if (rows.length === 0) {
    await supabase
      .from('search_tasks')
      .update({
        status: 'completed',
        brands_found: 0,
        updated_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', task.id)

    return { brandsCount: 0 }
  }

  const payload = rows.map((b) => toBrandRow(task, b))

  const { error: upsertError } = await supabase.from('brands').upsert(payload, {
    onConflict: 'user_id,google_maps_url',
  })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const { error: taskError } = await supabase
    .from('search_tasks')
    .update({
      status: 'completed',
      brands_found: rows.length,
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', task.id)

  if (taskError) {
    throw new Error(taskError.message)
  }

  return { brandsCount: rows.length }
}

export async function markTaskFailed(
  supabase: SupabaseClient,
  taskId: string,
  message: string
): Promise<void> {
  await supabase
    .from('search_tasks')
    .update({
      status: 'failed',
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
}

export type SearchPollResult = {
  apifyStatus: ApifyRunStatus | null
  task: SearchTask
}

/**
 * Si el run terminó OK y la tarea aún no está completada, finaliza importación de marcas.
 */
export async function pollAndMaybeFinalize(
  supabase: SupabaseClient,
  task: SearchTask,
  token: string | null,
  apify: ApifyService
): Promise<SearchPollResult> {
  let apifyStatus: ApifyRunStatus | null = null

  if (!task.apify_run_id || !token) {
    const { data: fresh } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('id', task.id)
      .single()
    return {
      apifyStatus: null,
      task: (fresh ?? task) as SearchTask,
    }
  }

  apifyStatus = await apify.getRunStatus(task.apify_run_id, token)

  if (apifyStatus === 'FAILED' || apifyStatus === 'TIMED-OUT') {
    await markTaskFailed(
      supabase,
      task.id,
      `Apify run ${apifyStatus}`
    )
    const { data: fresh } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('id', task.id)
      .single()
    return { apifyStatus, task: (fresh ?? task) as SearchTask }
  }

  if (
    apifyStatus === 'SUCCEEDED' &&
    task.status !== 'completed'
  ) {
    try {
      await finalizeSuccessfulRun(supabase, task, token, apify)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Finalize failed'
      await markTaskFailed(supabase, task.id, msg)
    }
    const { data: fresh } = await supabase
      .from('search_tasks')
      .select('*')
      .eq('id', task.id)
      .single()
    return { apifyStatus, task: (fresh ?? task) as SearchTask }
  }

  const { data: fresh } = await supabase
    .from('search_tasks')
    .select('*')
    .eq('id', task.id)
    .single()

  return { apifyStatus, task: (fresh ?? task) as SearchTask }
}
