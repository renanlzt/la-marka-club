import { NextRequest, NextResponse } from 'next/server';
import { getAllCustomersWithBalance } from '@/lib/admin-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;

    const customers = await getAllCustomersWithBalance(query);
    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
