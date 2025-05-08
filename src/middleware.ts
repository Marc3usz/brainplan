import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication - specify exact routes instead of root
const protectedRoutes = ['/dashboard', '/chat'];

// Routes that should not be accessible if logged in
const authRoutes = ['/auth/signin', '/auth/signup', '/login'];

// API routes that require authentication
const protectedApiRoutes = ['/api/chat'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Check for Firebase auth token in headers (for API routes)
  const authHeader = request.headers.get('authorization');
  const firebaseToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Check for user auth in cookies - Firebase may use different cookie names
  // Common Firebase cookie names to check
  const firebaseCookies = [
    'Firebase-Auth-Token',
    'firebase-auth-token',
    'firebase-token',
    'firebaseToken',
    'firebaseauth',
    '__session'  // Firebase often uses this for auth sessions
  ];
  
  const hasFirebaseCookie = firebaseCookies.some(cookieName => request.cookies.has(cookieName));
  
  // Also check if we have any cookie containing 'firebase' case insensitive
  const allCookieNames = request.cookies.getAll().map(c => c.name);
  const hasAnyFirebaseCookie = allCookieNames.some(name => 
    name.toLowerCase().includes('firebase') || name.toLowerCase().includes('auth')
  );
  
  const isAuthenticated = !!token || !!firebaseToken || hasFirebaseCookie || hasAnyFirebaseCookie;
  const path = request.nextUrl.pathname;
  
  // Debug logs
  console.log(`Middleware: Path=${path}, Authenticated=${isAuthenticated}, Token=${!!token}, FirebaseToken=${!!firebaseToken}, HasFirebaseCookie=${hasFirebaseCookie}, HasAnyFirebaseCookie=${hasAnyFirebaseCookie}`);
  console.log('All cookies:', allCookieNames.join(', '));
  
  // Check for protected API routes
  if (protectedApiRoutes.some(route => path.startsWith(route))) {
    if (!isAuthenticated) {
      console.error(`Middleware: Authentication required for API route ${path}`);
      return NextResponse.json(
        { error: 'Authentication required', path, authenticated: isAuthenticated },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Redirect from auth pages if already logged in
  if (isAuthenticated && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Only redirect to login for specific protected routes
  // Make sure we're checking for exact routes or proper subpaths
  if (!isAuthenticated && 
      protectedRoutes.some(route => 
        path === route || // Exact match
        (path.startsWith(route) && path.charAt(route.length) === '/') // Subpath match
      ) && 
      !authRoutes.some(route => path.startsWith(route))) {
    console.log(`Middleware: Redirecting unauthenticated user from ${path} to login`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', path); // Keep original requested path
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/auth/signin',
    '/auth/signup',
    '/login',
    '/api/chat'
  ]
};