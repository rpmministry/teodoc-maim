import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy perimetral de seguridad para Next.js 16.
 * Intercepta y valida todas las peticiones entrantes hacia las rutas de API (/api/*).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplicar exclusivamente a rutas API
  if (pathname.startsWith('/api/')) {
    const method = request.method;

    // Proteger métodos que modifican estado contra ataques CSRF / Cross-Origin
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');

      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          // Si el origen de la petición no coincide con el host del servidor, bloquear acceso
          if (originHost !== host && !originHost.includes('localhost') && !originHost.includes('127.0.0.1')) {
            console.warn(`[Seguridad] Petición bloqueada por origen no confiable: ${origin} !== ${host}`);
            return NextResponse.json(
              { error: 'Acceso no autorizado desde origen externo no confiable.' },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json({ error: 'Origen inválido.' }, { status: 400 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

