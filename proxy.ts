import { NextResponse, type NextRequest } from 'next/server'

// Proxy same-origin de /api/* hacia el backend.
//
// Solo reescribe la URL: el header `Origin` viaja intacto y el backend lo valida contra su
// allowlist (APP_CORS_ALLOWED_ORIGINS, que debe incluir el origen del frontend).
//
// Hasta el 2026-09-13 esta función borraba el `Origin` para esquivar un 403 que se creía
// inherente al CORS. No lo era: la allowlist apuntaba a un puerto inexistente. Con el valor
// corregido, el reenvío pasa CORS y CSRF (medido end-to-end), y borrar el header solo servía
// para desactivar esa validación sin que nadie lo notara. Ver docs/integracion-auth.md §0.
export function proxy(request: NextRequest) {
  const backend = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'
  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    backend,
  )

  return NextResponse.rewrite(target)
}

export const config = {
  matcher: '/api/:path*',
}
