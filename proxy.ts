import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
  '/logo.jpg',
  '/manifest.json',
  '/sw.js',
  '/icons',
];

const adminPaths = [
  '/admin',
  '/api/admin',
  '/api/users',
];

async function verifyTokenInProxy(token: string): Promise<{ userId: string; username: string; ruolo: string; org_id?: string; idsocieta?: string; type: string } | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'bitora-jwt-secret-key-change-this-in-production-2024'
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; username: string; ruolo: string; org_id?: string; idsocieta?: string; type: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyTokenInProxy(accessToken);

  if (!payload || payload.type !== 'access') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 401 }
      );
    }

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  if (adminPaths.some(path => pathname.startsWith(path))) {
    if (payload.ruolo !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Accesso non autorizzato' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-ruolo', payload.ruolo);
  requestHeaders.set('x-user-username', payload.username);
  requestHeaders.set('x-org-id', payload.org_id || payload.idsocieta || 'base');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
