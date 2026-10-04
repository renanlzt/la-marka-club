import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        role: user.role || session.role || 'GESTAO',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
