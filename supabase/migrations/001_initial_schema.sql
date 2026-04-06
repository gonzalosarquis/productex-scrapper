-- Tabla: search_tasks
--
-- Bases nuevas: la columna se llama `categories` (filtro post-scrape por categoría de negocio IG).
-- Si tu proyecto ya existía con la columna `keywords`, ejecutá en Supabase SQL Editor:
--   ALTER TABLE search_tasks RENAME COLUMN keywords TO categories;
--
CREATE TABLE search_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  min_followers INTEGER DEFAULT 1000,
  max_followers INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  apify_run_id TEXT,
  brands_found INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_task_id UUID REFERENCES search_tasks(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  avg_likes DECIMAL(10,2),
  avg_comments DECIMAL(10,2),
  posts_per_week DECIMAL(5,2),
  profile_image TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT false,
  is_business BOOLEAN DEFAULT false,
  instagram_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'interested', 'rejected', 'client')),
  score INTEGER DEFAULT 0,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, username)
);

-- Tabla: scraper_config
CREATE TABLE scraper_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  apify_token TEXT,
  actor_id TEXT DEFAULT 'apify/instagram-scraper',
  max_items INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE search_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own search_tasks" ON search_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own brands" ON brands FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own scraper_config" ON scraper_config FOR ALL USING (auth.uid() = user_id);
