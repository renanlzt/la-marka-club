import { NextRequest, NextResponse } from 'next/server';
import {
  parseSalesCsv,
  matchSalesWithClub,
  creditRetroactiveFromErp,
} from '@/lib/reconciliation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'parse_and_match') {
      const { csvText } = body;
      const parsed = parseSalesCsv(csvText);
      const matched = await matchSalesWithClub(parsed);
      return NextResponse.json({ parsedCount: parsed.length, result: matched });
    }

    if (action === 'retroactive_credit') {
      const { phone, amount, customerName } = body;
      const creditRes = await creditRetroactiveFromErp(phone, parseFloat(amount), customerName);
      return NextResponse.json({ success: true, credit: creditRes });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
