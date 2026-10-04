import { NextRequest, NextResponse } from 'next/server';
import {
  searchCustomerForCounter,
  registerQuickCustomer,
  processCounterSale,
} from '@/lib/counter-service';

import { prisma } from '@/lib/db';
import { getActiveCampaign } from '@/lib/campaigns-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    const activeCampaign = await getActiveCampaign();

    const storeSettings = {
      storeName: settings?.storeName ?? 'La Marka',
      defaultCashbackPercentage: settings?.defaultCashbackPercentage ?? 5.0,
      defaultExpirationDays: settings?.defaultExpirationDays ?? 45,
    };

    const campaignSummary = activeCampaign ? {
      id: activeCampaign.id,
      name: activeCampaign.name,
      type: activeCampaign.type,
      value: activeCampaign.value,
    } : null;

    if (!q.trim()) {
      return NextResponse.json({
        settings: storeSettings,
        activeCampaign: campaignSummary,
      });
    }

    const customer = await searchCustomerForCounter(q);
    return NextResponse.json({
      customer,
      settings: storeSettings,
      activeCampaign: campaignSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      const customer = await registerQuickCustomer(body.data);
      const summary = await searchCustomerForCounter(customer.phone);
      return NextResponse.json({ customer: summary });
    }

    if (action === 'sale') {
      const result = await processCounterSale(body.data);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
