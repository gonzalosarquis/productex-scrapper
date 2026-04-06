import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * Autenticación para Route Handlers: prioriza `Authorization: Bearer`,
 * si no hay token usa cookies (SSR).
 */
export async function getSupabaseForApiRoute(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const authHeader = request.headers.get('Authorization')
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (bearer) {
    const supabase = createSupabaseJsClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${bearer}` },
      },
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return { supabase, user }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}
