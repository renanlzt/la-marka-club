import { NextRequest, NextResponse } from 'next/server';
import {
  searchCustomerForCounter,
  registerQuickCustomer,
  processCounterSale,
} from '@/lib/counter-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const customer = await searchCustomerForCounter(q);
    return NextResponse.json({ customer });
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
