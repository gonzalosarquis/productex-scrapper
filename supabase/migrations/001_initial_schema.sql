-- CORRER EN SUPABASE SQL EDITOR:
-- DROP TABLE IF EXISTS brands CASCADE;
-- DROP TABLE IF EXISTS search_tasks CASCADE;
-- Luego correr este archivo completo de nuevo.

-- Tabla: search_tasks
CREATE TABLE search_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_query TEXT NOT NULL DEFAULT 'tienda de ropa',
  cities TEXT[] DEFAULT '{}',
  min_rating DECIMAL(3,1) DEFAULT 0,
  max_results INTEGER DEFAULT 100,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','running','completed','failed')
  ),
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
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  rating DECIMAL(3,1),
  reviews_count INTEGER DEFAULT 0,
  instagram_url TEXT,
  website TEXT,
  google_maps_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','contacted','interested','rejected','client')
  ),
  score INTEGER DEFAULT 0,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_maps_url)
);

-- Tabla: scraper_config
CREATE TABLE scraper_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  apify_token TEXT,
  actor_id TEXT DEFAULT 'apify/google-maps-scraper',
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
