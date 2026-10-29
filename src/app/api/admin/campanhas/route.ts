import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaigns,
  createCampaign,
  toggleCampaignActive,
  deleteCampaign,
} from '@/lib/campaigns-service';

export async function GET() {
  try {
    const campaigns = await getAllCampaigns();
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
    }
    const updated = await toggleCampaignActive(id, isActive);
    return NextResponse.json({ campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
    }
    await deleteCampaign(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
