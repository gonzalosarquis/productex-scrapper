import type { ScraperConfig, SearchTask } from '@/lib/types'

export type ApifyRunStatus =
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED-OUT'

const API_BASE = 'https://api.apify.com/v2'

const ARGENTINA_FASHION_HASHTAGS = [
  'marcaargentina',
  'hechoenargentina',
  'indumentariaargentina',
  'modaargentina',
  'showroomargentina',
  'ropafemenina',
  'ropaargentina',
  'tiendaonlineargentina',
  'marcaderopa',
  'indumentaria',
]

function encodeActorId(actorId: string): string {
  return actorId.replace('/', '~')
}

function mapApifyStatus(raw: string): ApifyRunStatus {
  switch (raw) {
    case 'SUCCEEDED':
      return 'SUCCEEDED'
    case 'FAILED':
    case 'ABORTED':
      return 'FAILED'
    case 'TIMED-OUT':
    case 'TIMING-OUT':
      return 'TIMED-OUT'
    case 'RUNNING':
    case 'READY':
    default:
      return 'RUNNING'
  }
}

export class ApifyService {
  /**
   * Inicia un run del actor de Instagram: hashtags AR de moda (explore/tags).
   * Las categorías de la tarea se filtran post-scrape en brand-processor.
   */
  async startSearch(config: ScraperConfig, task: SearchTask): Promise<string> {
    void task
    const token = config.apify_token
    if (!token) {
      throw new Error('Missing Apify token in scraper config')
    }

    const actorPath = encodeActorId(config.actor_id || 'apify/instagram-scraper')
    const url = `${API_BASE}/acts/${encodeURIComponent(actorPath)}/runs?token=${encodeURIComponent(token)}`

    const startUrls = ARGENTINA_FASHION_HASHTAGS.map((tag) => ({
      url: `https://www.instagram.com/explore/tags/${tag}/`,
    }))

    const body: Record<string, unknown> = {
      startUrls,
      resultsType: 'posts',
      resultsLimit: Math.min(config.max_items, 100),
      addParentData: true,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as {
      data?: { id: string }
      error?: { message: string }
    }

    if (!res.ok || !json.data?.id) {
      throw new Error(
        json.error?.message ?? `Apify start run failed (${res.status})`
      )
    }

    return json.data.id
  }

  async getRunStatus(
    runId: string,
    token: string
  ): Promise<ApifyRunStatus> {
    const url = `${API_BASE}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`
    const res = await fetch(url, { method: 'GET' })
    const json = (await res.json()) as {
      data?: { status: string }
      error?: { message: string }
    }

    if (!res.ok || !json.data?.status) {
      throw new Error(
        json.error?.message ?? `Apify get run failed (${res.status})`
      )
    }

    return mapApifyStatus(json.data.status)
  }

  async getRunResults(runId: string, token: string): Promise<unknown[]> {
    const url = `${API_BASE}/actor-runs/${encodeURIComponent(runId)}/dataset/items?token=${encodeURIComponent(token)}`
    const res = await fetch(url, { method: 'GET' })
    const json: unknown = await res.json()

    if (!res.ok) {
      const err = json as { error?: { message: string } }
      throw new Error(
        err.error?.message ?? `Apify dataset items failed (${res.status})`
      )
    }

    if (Array.isArray(json)) {
      return json
    }

    if (json && typeof json === 'object' && 'data' in json) {
      const data = (json as { data: unknown }).data
      if (Array.isArray(data)) {
        return data
      }
      if (
        data &&
        typeof data === 'object' &&
        'items' in data &&
        Array.isArray((data as { items: unknown[] }).items)
      ) {
        return (data as { items: unknown[] }).items
      }
    }

    return []
  }
}
