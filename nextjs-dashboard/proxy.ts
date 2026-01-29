import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const key = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-key'
);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth routes and static files
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const session = request.cookies.get('session')?.value;

  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(session, key);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users from login page to dashboard
  if (pathname === '/login' && session) {
    try {
      await jwtVerify(session, key);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Invalid session, allow access to login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};