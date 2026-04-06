export interface SearchTask {
  id: string
  user_id: string
  name: string
  keywords: string[]
  countries: string[]
  cities: string[]
  min_followers: number
  max_followers: number | null
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
  username: string
  full_name: string | null
  bio: string | null
  followers: number
  following: number
  posts_count: number
  engagement_rate: number | null
  avg_likes: number | null
  avg_comments: number | null
  posts_per_week: number | null
  profile_image: string | null
  website: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  verified: boolean
  is_business: boolean
  instagram_url: string | null
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
  keywords: string[]
  countries: string[]
  cities: string[]
  min_followers: number
  max_followers: string
}
