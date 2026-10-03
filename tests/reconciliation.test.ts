import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  parseSalesCsv,
  matchSalesWithClub,
} from '../src/lib/reconciliation';
import { grantCashback } from '../src/lib/fifo-engine';
import { nanoid } from 'nanoid';

describe('Sales Reconciliation Matcher & Auditor', () => {
  let customerPhone: string;
  let customerId: string;

  beforeEach(async () => {
    customerPhone = `1193${Math.floor(1000000 + Math.random() * 9000000)}`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Priscila Rocha',
        phone: customerPhone,
        magicToken: `tk_${nanoid(20)}`,
      },
    });
    customerId = customer.id;

    // Lança uma venda de R$ 350.00 no clube
    await grantCashback(customerId, 350.0, 'Balcão Venda Real');
  });

  it('should parse CSV with Brazilian currency and date formats', () => {
    const csvContent = `Cupom;Data;Valor;Telefone;Cliente
CUP-1001;03/10/2026;R$ 350,00;${customerPhone};Priscila Rocha
CUP-1002;03/10/2026;180,50;11999990000;Cliente Não Cadastrada`;

    const parsed = parseSalesCsv(csvContent);
    expect(parsed.length).toBe(2);
    expect(parsed[0].saleIdentifier).toBe('CUP-1001');
    expect(parsed[0].grossAmount).toBe(350.0);
    expect(parsed[1].grossAmount).toBe(180.5);
  });

  it('should match ERP sales against club transactions and identify unmatched sales', async () => {
    const importedSales = [
      {
        saleIdentifier: 'CUP-1001',
        date: new Date(),
        grossAmount: 350.0,
        customerPhone,
        customerName: 'Priscila Rocha',
      },
      {
        saleIdentifier: 'CUP-1002',
        date: new Date(),
        grossAmount: 180.0,
        customerPhone: '11999990000',
        customerName: 'Cliente Sem Clube',
      },
    ];

    const result = await matchSalesWithClub(importedSales);

    // CUP-1001 deve bater com a compra de R$ 350.00 da Priscila no clube
    expect(result.matched.length).toBe(1);
    expect(result.matched[0].saleIdentifier).toBe('CUP-1001');

    // CUP-1002 não existe no clube (oportunidade perdida ou sem cadastro)
    expect(result.unmatchedErp.length).toBe(1);
    expect(result.unmatchedErp[0].saleIdentifier).toBe('CUP-1002');
  });
});
