import { NextRequest, NextResponse } from 'next/server';
import {
  getUpcomingBirthdays,
  sendBirthdayGiftAction,
} from '@/lib/campaigns-service';

export async function GET() {
  try {
    const birthdays = await getUpcomingBirthdays();
    return NextResponse.json({ birthdays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;
    const result = await sendBirthdayGiftAction(customerId);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
