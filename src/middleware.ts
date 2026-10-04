import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso irrestrito às telas de login e APIs de autenticação
  if (
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/auth')
  ) {
    return NextResponse.next();
  }

  // Verifica proteção para rotas restritas
  const requiresAuth =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/balcao') ||
    pathname.startsWith('/portal');

  if (requiresAuth) {
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Extrai o papel (role) do token assinado
    const tokenParts = sessionCookie.value.split(':');
    const role = tokenParts.length === 5 ? tokenParts[2] : 'GESTAO';

    // Perfil BALCAO: não pode acessar rotas /admin
    if (role === 'BALCAO' && pathname.startsWith('/admin')) {
      const balcaoUrl = new URL('/balcao', request.url);
      return NextResponse.redirect(balcaoUrl);
    }

    // Perfil BALCAO: se tentar acessar o portal de escolha, vai direto pro balcão
    if (role === 'BALCAO' && pathname === '/portal') {
      const balcaoUrl = new URL('/balcao', request.url);
      return NextResponse.redirect(balcaoUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/balcao/:path*', '/portal/:path*'],
};
