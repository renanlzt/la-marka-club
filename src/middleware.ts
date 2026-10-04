import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionTokenEdge } from '@/lib/session-verifier';

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Previne clickjacking (não permite embedding em iframes maliciosos)
  response.headers.set('X-Frame-Options', 'DENY');

  // Previne MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Proteção contra vazamento de URLs sensíveis em links externos
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Desativa APIs sensíveis desnecessárias
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Proteção contra cross-site scripting em navegadores legados
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HSTS em produção
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // 1. Rotas Públicas Isentas de Autenticação
  if (
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname === '/api/admin/auth/login' ||
    pathname === '/api/admin/auth/logout' ||
    pathname === '/api/admin/auth/me' ||
    pathname.startsWith('/c/') || // Carteira digital da cliente por token
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webmanifest')
  ) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  // 2. Determina se a rota requer autenticação
  const isProtectedAdminPage = pathname.startsWith('/admin');
  const isProtectedBalcaoPage = pathname.startsWith('/balcao');
  const isProtectedPortalPage = pathname.startsWith('/portal');

  const isProtectedAdminApi = pathname.startsWith('/api/admin');
  const isProtectedBalcaoApi = pathname.startsWith('/api/balcao');

  const requiresAuth =
    isProtectedAdminPage ||
    isProtectedBalcaoPage ||
    isProtectedPortalPage ||
    isProtectedAdminApi ||
    isProtectedBalcaoApi;

  if (requiresAuth) {
    const sessionCookie = request.cookies.get('admin_session');
    const session = await verifySessionTokenEdge(sessionCookie?.value);

    // Se o token não existir, for inválido, forjado ou tiver expirado (> 7 dias)
    if (!session) {
      if (isApi) {
        const unauthRes = NextResponse.json(
          { error: 'Não autorizado. Faça login para continuar.' },
          { status: 401 }
        );
        return applySecurityHeaders(unauthRes);
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectRes);
    }

    // 3. Controle de Acesso Baseado em Papéis (RBAC)
    // Usuários de perfil BALCAO não podem acessar páginas ou APIs de GESTAO (/admin)
    if (session.role === 'BALCAO') {
      if (isProtectedAdminApi) {
        const forbiddenRes = NextResponse.json(
          { error: 'Acesso negado. Ação restrita a gestores.' },
          { status: 403 }
        );
        return applySecurityHeaders(forbiddenRes);
      }

      if (isProtectedAdminPage || isProtectedPortalPage) {
        const balcaoUrl = new URL('/balcao', request.url);
        const redirectRes = NextResponse.redirect(balcaoUrl);
        return applySecurityHeaders(redirectRes);
      }
    }
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a todas as rotas de requisição, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico, logo.png
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
