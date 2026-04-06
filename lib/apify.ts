import type { ScraperConfig, SearchTask } from '@/lib/types'

export type ApifyRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT'

const API_BASE = 'https://api.apify.com/v2'
const GOOGLE_MAPS_ACTOR = 'apify~google-maps-scraper'

const ARGENTINA_CITIES = [
  'Buenos Aires',
  'Córdoba',
  'Rosario',
  'Mendoza',
  'Tucumán',
  'La Plata',
  'Mar del Plata',
  'Salta',
  'Santa Fe',
  'San Juan',
  'Resistencia',
  'Neuquén',
  'Santiago del Estero',
  'Corrientes',
  'Posadas',
  'Bahía Blanca',
  'Paraná',
  'Formosa',
  'San Luis',
  'Río Cuarto',
]

export class ApifyService {
  async startSearch(config: ScraperConfig, task: SearchTask): Promise<string> {
    const token = config.apify_token
    if (!token) throw new Error('Missing Apify token')

    const citiesToSearch =
      task.cities.length > 0 ? task.cities : ARGENTINA_CITIES.slice(0, 5)

    const searchStrings = citiesToSearch.map(
      (city) => `${task.search_query} en ${city}, Argentina`
    )

    const body = {
      searchStringsArray: searchStrings,
      maxCrawledPlacesPerSearch: Math.ceil(
        task.max_results / citiesToSearch.length
      ),
      language: 'es',
      countryCode: 'ar',
      includeWebResults: false,
      scrapeDirectories: false,
      deeperCityScrape: false,
    }

    const url = `${API_BASE}/acts/${GOOGLE_MAPS_ACTOR}/runs?token=${encodeURIComponent(token)}`
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
      throw new Error(json.error?.message ?? `Apify error (${res.status})`)
    }
    return json.data.id
  }

  async getRunStatus(runId: string, token: string): Promise<ApifyRunStatus> {
    const url = `${API_BASE}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const json = (await res.json()) as {
      data?: { status: string }
      error?: { message: string }
    }
    if (!res.ok || !json.data?.status) {
      throw new Error(json.error?.message ?? `Status error (${res.status})`)
    }
    const s = json.data.status
    if (s === 'SUCCEEDED') return 'SUCCEEDED'
    if (s === 'FAILED' || s === 'ABORTED') return 'FAILED'
    if (s === 'TIMED-OUT' || s === 'TIMING-OUT') return 'TIMED-OUT'
    return 'RUNNING'
  }

  async getRunResults(runId: string, token: string): Promise<unknown[]> {
    const url = `${API_BASE}/actor-runs/${encodeURIComponent(runId)}/dataset/items?token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const json: unknown = await res.json()
    if (Array.isArray(json)) return json
    if (json && typeof json === 'object' && 'data' in json) {
      const d = (json as { data: unknown }).data
      if (Array.isArray(d)) return d
    }
    return []
  }
}
