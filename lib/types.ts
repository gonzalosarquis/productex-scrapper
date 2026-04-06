export interface SearchTask {
  id: string
  user_id: string
  name: string
  search_query: string
  cities: string[]
  min_rating: number
  max_results: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  apify_run_id: string | null
  brands_found: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  user_id: string
  search_task_id: string | null
  name: string
  phone: string | null
  address: string | null
  city: string | null
  rating: number | null
  reviews_count: number | null
  instagram_url: string | null
  website: string | null
  google_maps_url: string | null
  category: string | null
  status: 'pending' | 'contacted' | 'interested' | 'rejected' | 'client'
  score: number
  notes: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export interface ScraperConfig {
  id: string
  user_id: string
  apify_token: string | null
  actor_id: string
  max_items: number
  created_at: string
  updated_at: string
}

export interface SearchFormData {
  name: string
  search_query: string
  cities: string[]
  min_rating: number
  max_results: number
}
