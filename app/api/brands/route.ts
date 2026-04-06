import { NextResponse } from 'next/server'

import { jsonServerError, jsonUnauthorized } from '@/lib/api-response'
import { getSupabaseForApiRoute } from '@/lib/supabase/api-route'

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getSupabaseForApiRoute(request)

    if (!user) {
      return jsonUnauthorized()
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .order('score', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ brands: data ?? [] })
  } catch (e) {
    console.error(e)
    return jsonServerError(
      e instanceof Error ? e.message : undefined
    )
  }
}
