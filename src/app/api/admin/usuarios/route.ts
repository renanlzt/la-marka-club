import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  verifySessionToken,
} from '@/lib/auth';

function getSessionUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifySessionToken(sessionCookie.value);
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== 'GESTAO') {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const users = await getAllAdminUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== 'GESTAO') {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, role } = body;

    const user = await createAdminUser({
      name,
      username,
      password,
      role,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== 'GESTAO') {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, username, role, newPassword } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não informado.' }, { status: 400 });
    }

    const user = await updateAdminUser(id, {
      name,
      username,
      role,
      newPassword,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session || session.role !== 'GESTAO') {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // Ignora
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não informado.' }, { status: 400 });
    }

    await deleteAdminUser(id, session.adminId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
