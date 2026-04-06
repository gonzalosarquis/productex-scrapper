import { NextResponse } from 'next/server'

export function jsonUnauthorized() {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: 'Debes iniciar sesión para acceder a este recurso.',
    },
    { status: 401 }
  )
}

export function jsonServerError(detail?: string) {
  return NextResponse.json(
    {
      error: 'Internal server error',
      message:
        detail ??
        'Error interno del servidor. Inténtalo de nuevo más tarde.',
    },
    { status: 500 }
  )
}
