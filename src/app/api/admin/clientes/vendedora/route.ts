import { NextRequest, NextResponse } from 'next/server';
import { toggleCustomerSeller } from '@/lib/admin-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, isSeller } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID da cliente não informado.' },
        { status: 400 }
      );
    }

    const updatedStatus = await toggleCustomerSeller(customerId, isSeller);
    return NextResponse.json({ success: true, isSeller: updatedStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
