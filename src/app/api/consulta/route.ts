import { NextRequest, NextResponse } from 'next/server';
import { lookupCustomerWallet } from '@/lib/customer-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, birthDay, birthMonth } = body;

    const parsedBirthDay =
      typeof birthDay === 'number'
        ? birthDay
        : birthDay
        ? parseInt(birthDay, 10)
        : undefined;

    const parsedBirthMonth =
      typeof birthMonth === 'number'
        ? birthMonth
        : birthMonth
        ? parseInt(birthMonth, 10)
        : undefined;

    const result = await lookupCustomerWallet({
      name: typeof name === 'string' ? name : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      birthDay: parsedBirthDay,
      birthMonth: parsedBirthMonth,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Não foi possível localizar a carteira.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      magicToken: result.magicToken,
      customerName: result.customerName,
      redirectUrl: `/c/${result.magicToken}`,
    });
  } catch (err: any) {
    console.error('Erro na consulta de carteira:', err);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar sua consulta. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
