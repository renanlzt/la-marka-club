import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  updateStoreSettings,
  updateMessageTemplate,
  resetMessageTemplate,
} from '@/lib/admin-service';
import {
  getActiveVipTierConfig,
  saveActiveVipTierConfig,
} from '@/lib/vip-tier-service';

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    const templates = await prisma.messageTemplate.findMany({
      where: {
        id: { not: 'VIP_TIER_CONFIG' },
      },
    });
    const vipConfig = await getActiveVipTierConfig();

    return NextResponse.json({ settings, templates, vipConfig });
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

    if (action === 'update_vip_config') {
      const updatedVip = await saveActiveVipTierConfig(body.data);
      return NextResponse.json({ vipConfig: updatedVip });
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
