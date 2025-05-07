import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should not be accessible if logged in
const authRoutes = ['/auth/signin', '/auth/signup'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;
  
  // Redirect from auth pages if already logged in
  if (isAuthenticated && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect to login if accessing protected routes while not authenticated
  if (!isAuthenticated && protectedRoutes.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  // Specify which paths this middleware will run on
  matcher: [...protectedRoutes, ...authRoutes],
}; 