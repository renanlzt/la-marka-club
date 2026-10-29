import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerSegments,
  CustomerSegmentType,
} from '@/lib/customer-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('type');

    let segmentType: CustomerSegmentType | 'ALL' = 'ALL';

    if (rawType && rawType.trim()) {
      const upper = rawType.trim().toUpperCase();
      const validTypes: Array<CustomerSegmentType | 'ALL'> = [
        'INACTIVE_45D',
        'EXPIRING_15D',
        'BIRTHDAYS_WEEK',
        'TOP_TIER',
        'ALL',
      ];

      if (!validTypes.includes(upper as any)) {
        return NextResponse.json(
          {
            error: `Segmento inválido: "${rawType}". Tipos válidos: INACTIVE_45D, EXPIRING_15D, BIRTHDAYS_WEEK, TOP_TIER, ALL`,
          },
          { status: 400 }
        );
      }

      segmentType = upper as CustomerSegmentType | 'ALL';
    }

    const result = await getCustomerSegments(segmentType);

    return NextResponse.json({
      success: true,
      segment: result.segment,
      count: result.count,
      customers: result.customers,
      counts: result.counts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message ||
          'Erro ao processar segmentação inteligente de clientes.',
      },
      { status: 500 }
    );
  }
}
