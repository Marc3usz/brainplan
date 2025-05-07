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
  
  // Check for user auth in cookies (Firebase persistence)
  const hasFirebaseCookie = request.cookies.has('Firebase-Auth-Token');
  
  const isAuthenticated = !!token || !!firebaseToken || hasFirebaseCookie;
  const path = request.nextUrl.pathname;
  
  // Debug logs
  console.log(`Middleware: Path=${path}, Authenticated=${isAuthenticated}, Token=${!!token}, FirebaseToken=${!!firebaseToken}`);
  
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
    return NextResponse.redirect(new URL('/', request.url));
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