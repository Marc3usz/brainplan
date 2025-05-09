import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Wszystkie ścieżki, które wymagają uwierzytelnienia (włączając stronę główną)
const protectedRoutes = ['/', '/dashboard', '/chat', '/brainrot'];

// Ścieżki autoryzacyjne, które nie powinny być dostępne dla zalogowanych
const authRoutes = ['/auth/signin', '/auth/signup', '/login'];

// API ścieżki wymagające autoryzacji
const protectedApiRoutes = ['/api/chat'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;
  
  // Sprawdzenie tokena Firebase w nagłówkach (dla ścieżek API)
  const authHeader = request.headers.get('authorization');
  const firebaseToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Sprawdzenie ciasteczek Firebase Auth
  const hasFirebaseCookie = request.cookies.has('__session') || 
                           request.cookies.has('firebase-auth-token');
  
  // Określenie czy użytkownik jest uwierzytelniony
  const isAuthenticated = !!token || !!firebaseToken || hasFirebaseCookie;
  
  console.log(`Middleware: Path=${path}, Authenticated=${isAuthenticated}`);

  // Przekierowanie z głównej strony na login, jeśli użytkownik nie jest zalogowany
  if (path === '/' && !isAuthenticated) {
    console.log('Middleware: Przekierowanie niezalogowanego użytkownika z głównej strony na login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Przekierowanie ze stron autoryzacji na dashboard, gdy użytkownik jest już zalogowany
  if (isAuthenticated && authRoutes.some(route => path.startsWith(route))) {
    console.log('Middleware: Przekierowanie zalogowanego użytkownika ze strony logowania na dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Przekierowanie na stronę logowania dla chronionych ścieżek
  if (!isAuthenticated && 
      protectedRoutes.some(route => path === route || path.startsWith(`${route}/`)) && 
      !authRoutes.some(route => path.startsWith(route))) {
    console.log(`Middleware: Przekierowanie niezalogowanego użytkownika z ${path} na login`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Dla chronionych API - zwróć błąd 401
  if (!isAuthenticated && protectedApiRoutes.some(route => path.startsWith(route))) {
    console.log(`Middleware: Brak autoryzacji dla ścieżki API ${path}`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/chat/:path*',
    '/brainrot/:path*',
    '/auth/signin',
    '/auth/signup',
    '/login',
    '/api/chat/:path*'
  ]
};