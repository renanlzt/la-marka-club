import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createCampaign } from '@/lib/campaigns-service';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const campaign = await createCampaign({
      name: body.name,
      description: body.description,
      type: body.type,
      value: parseFloat(body.value),
      minPurchase: body.minPurchase ? parseFloat(body.minPurchase) : undefined,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
