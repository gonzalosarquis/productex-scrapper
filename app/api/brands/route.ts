import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .order('score', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ brands: data ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
