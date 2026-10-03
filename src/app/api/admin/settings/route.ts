import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  updateStoreSettings,
  updateMessageTemplate,
  resetMessageTemplate,
} from '@/lib/admin-service';

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    const templates = await prisma.messageTemplate.findMany();
    return NextResponse.json({ settings, templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'update_settings') {
      const updated = await updateStoreSettings(body.data);
      return NextResponse.json({ settings: updated });
    }

    if (action === 'update_template') {
      const { id, content } = body.data;
      const updated = await updateMessageTemplate(id, content);
      return NextResponse.json({ template: updated });
    }

    if (action === 'reset_template') {
      const { id } = body.data;
      const reset = await resetMessageTemplate(id);
      return NextResponse.json({ template: reset });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
