import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value)
  })
  return to
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options: CookieOptions
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const hasBearer = request.headers.get('Authorization')?.startsWith('Bearer ')

  if (pathname.startsWith('/auth')) {
    if (user) {
      const r = NextResponse.redirect(new URL('/dashboard', request.url))
      return copyCookies(supabaseResponse, r)
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const r = NextResponse.redirect(new URL('/auth', request.url))
      return copyCookies(supabaseResponse, r)
    }
  }

  if (
    request.method === 'OPTIONS' &&
    pathname.startsWith('/api/')
  ) {
    return supabaseResponse
  }

  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/webhooks/')
  ) {
    if (!user && !hasBearer) {
      const res = NextResponse.json(
        {
          error: 'Unauthorized',
          message:
            'Se requiere sesión o token Bearer válido para acceder a este recurso.',
        },
        { status: 401 }
      )
      return copyCookies(supabaseResponse, res)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
