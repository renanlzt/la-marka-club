import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, changeAdminCredentials, createSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada ou inválida.' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Informe a senha atual para confirmar a alteração.' },
        { status: 400 }
      );
    }

    const updated = await changeAdminCredentials(
      session.adminId,
      currentPassword,
      newPassword,
      newUsername
    );

    // Atualiza o cookie com o novo username
    const newToken = createSessionToken(updated.id, updated.username);
    const response = NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
      },
    });

    response.cookies.set('admin_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
