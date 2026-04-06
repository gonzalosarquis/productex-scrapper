import type { SupabaseClient } from '@supabase/supabase-js'

import { ApifyService, type ApifyRunStatus } from '@/lib/apify'
import { processBrandData } from '@/lib/brand-processor'
import type { Brand, SearchTask } from '@/lib/types'

function toBrandRow(task: SearchTask, b: Partial<Brand>): Record<string, unknown> {
  if (!b.username) {
    throw new Error('Brand row missing username')
  }
  return {
    user_id: task.user_id,
    search_task_id: task.id,
    username: b.username,
    full_name: b.full_name ?? null,
    bio: b.bio ?? null,
    followers: b.followers ?? 0,
    following: b.following ?? 0,
    posts_count: b.posts_count ?? 0,
    engagement_rate: b.engagement_rate ?? null,
    avg_likes: b.avg_likes ?? null,
    avg_comments: b.avg_comments ?? null,
    posts_per_week: b.posts_per_week ?? null,
    profile_image: b.profile_image ?? null,
    website: b.website ?? null,
    email: b.email ?? null,
    phone: b.phone ?? null,
    country: b.country ?? null,
    city: b.city ?? null,
    verified: b.verified ?? false,
    is_business: b.is_business ?? false,
    instagram_url: b.instagram_url ?? null,
    status: b.status ?? 'pending',
    score: b.score ?? 0,
    notes: b.notes ?? null,
    last_contacted_at: b.last_contacted_at ?? null,
    updated_at: new Date().toISOString(),
  }
}

function filterByFollowerRange(
  brands: Partial<Brand>[],
  task: SearchTask
): Partial<Brand>[] {
  return brands.filter((b) => {
    const f = b.followers ?? 0
    if (f < task.min_followers) return false
    if (task.max_followers != null && f > task.max_followers) return false
    return true
  })
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
  let rows = processBrandData(raw, task.categories ?? [])
  rows = filterByFollowerRange(rows, task)

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
    onConflict: 'user_id,username',
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
