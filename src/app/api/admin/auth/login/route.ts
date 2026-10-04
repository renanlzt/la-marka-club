import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createSessionToken } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  let rateLimitKey = 'login:unknown';
  try {
    const body = await request.json();
    const { username, password } = body;

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const cleanUsername = (username || '').trim().toLowerCase();
    rateLimitKey = `login:${ip}:${cleanUsername || 'blank'}`;

    // 1. Verificação de Ataque de Força Bruta
    const limitCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Por segurança, aguarde ${Math.ceil(
            limitCheck.resetInSeconds / 60
          )} minutos para tentar novamente.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limitCheck.resetInSeconds),
          },
        }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Informe usuário e senha.' },
        { status: 400 }
      );
    }

    const user = await authenticateAdmin(username, password);

    // Login com sucesso: reseta tentativas
    resetRateLimit(rateLimitKey);

    const token = createSessionToken(user.id, user.username, user.role);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    // Define cookie de sessão seguro
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    // Cookie de role para a interface
    response.cookies.set('user_role', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    // Registra falha para a proteção contra força bruta
    recordFailedAttempt(rateLimitKey, 15 * 60 * 1000);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
