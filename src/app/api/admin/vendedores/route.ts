import { NextResponse } from 'next/server';
import {
  getAllSellers,
  createSeller,
  updateSeller,
  deleteSeller,
} from '@/lib/admin-service';

export async function GET() {
  try {
    const sellers = await getAllSellers();
    return NextResponse.json({ sellers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar vendedores.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, code, customerId } = body;

    if (!name && !customerId) {
      return NextResponse.json(
        { error: 'Informe o nome do vendedor ou selecione um cliente.' },
        { status: 400 }
      );
    }

    const seller = await createSeller({
      name,
      phone,
      code,
      customerId,
    });

    return NextResponse.json({ success: true, seller });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao cadastrar vendedor.' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, phone, code, active, customerId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do vendedor é obrigatório.' },
        { status: 400 }
      );
    }

    const seller = await updateSeller(id, {
      name,
      phone,
      code,
      active,
      customerId,
    });

    return NextResponse.json({ success: true, seller });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar vendedor.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // Ignora se não houver body
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID do vendedor é obrigatório.' },
        { status: 400 }
      );
    }

    await deleteSeller(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir vendedor.' },
      { status: 400 }
    );
  }
}
