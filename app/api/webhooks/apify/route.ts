import { NextResponse } from 'next/server'

/**
 * Webhook Apify cuando termina el scraping — placeholder.
 * En fases siguientes: `createClient(url, SUPABASE_SERVICE_ROLE_KEY, …)` para bypass RLS.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    )
  }

  const payload = await request.json().catch(() => null)

  return NextResponse.json({
    ok: true,
    received: payload !== null,
  })
}
