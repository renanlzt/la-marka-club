import { NextRequest, NextResponse } from 'next/server';
import { getAllCustomersWithBalance, updateCustomer } from '@/lib/admin-service';

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, cpf, birthDay, birthMonth, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da cliente não informado.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome da cliente é obrigatório.' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'O telefone da cliente é obrigatório.' }, { status: 400 });
    }

    const updated = await updateCustomer(id, {
      name,
      phone,
      cpf,
      birthDay: birthDay ? parseInt(String(birthDay), 10) : null,
      birthMonth: birthMonth ? parseInt(String(birthMonth), 10) : null,
      notes,
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
