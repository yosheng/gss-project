import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login'];
const DEFAULT_ROUTE = '/work-order';

function isAuthValid(request: NextRequest): boolean {
  const cookie = request.cookies.get('gss_auth');
  if (!cookie?.value) return false;
  try {
    const data = JSON.parse(decodeURIComponent(cookie.value));
    return typeof data.expiresAt === 'number' && Date.now() < data.expiresAt;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthValid(request);
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!authenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authenticated && isPublic) {
    return NextResponse.redirect(new URL(DEFAULT_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
