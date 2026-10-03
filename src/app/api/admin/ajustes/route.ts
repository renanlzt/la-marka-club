import { NextRequest, NextResponse } from 'next/server';
import { performManualAdjustment } from '@/lib/campaigns-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, amount, reason, operatorName } = body;

    const result = await performManualAdjustment(
      customerId,
      parseFloat(amount),
      reason,
      operatorName || 'Dieizy'
    );

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
