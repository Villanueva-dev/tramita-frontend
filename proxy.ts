import { NextResponse, type NextRequest } from 'next/server'

// Proxy same-origin de /api/* hacia el backend.
//
// Además de reescribir, ELIMINA el header `Origin` de la request antes de reenviarla.
// El navegador manda `Origin: http://localhost:3000` en cada POST; si se lo reenviamos,
// el backend lo ve como cross-origin y responde 403 (aunque el CSRF sea válido). Al
// stripearlo, el backend recibe una request same-origin y no aplica el rechazo de CORS.
// Esto completa la intención del proxy: que el backend NO perciba dos orígenes distintos.
export function proxy(request: NextRequest) {
  const backend = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'
  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    backend,
  )

  const headers = new Headers(request.headers)
  headers.delete('origin')

  return NextResponse.rewrite(target, { request: { headers } })
}

export const config = {
  matcher: '/api/:path*',
}
