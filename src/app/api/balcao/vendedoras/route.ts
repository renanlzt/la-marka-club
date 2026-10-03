import { NextResponse } from 'next/server';
import { getActiveSellers } from '@/lib/admin-service';

export async function GET() {
  try {
    const sellers = await getActiveSellers();
    return NextResponse.json({ sellers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
