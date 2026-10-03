import { prisma } from './db';
import { grantCashback } from './fifo-engine';
import { nanoid } from 'nanoid';

export interface ImportedSaleRow {
  saleIdentifier: string;
  date: Date;
  grossAmount: number;
  customerPhone?: string;
  customerName?: string;
}

export interface ReconciliationResult {
  matched: Array<{
    saleIdentifier: string;
    grossAmount: number;
    customerName?: string;
    customerPhone?: string;
    creditId: string;
    cashbackEarned: number;
  }>;
  unmatchedErp: Array<{
    saleIdentifier: string;
    date: Date;
    grossAmount: number;
    customerPhone?: string;
    customerName?: string;
  }>;
  unmatchedClub: Array<{
    creditId: string;
    customerName: string;
    customerPhone: string;
    purchaseAmount: number;
    cashbackAmount: number;
    date: Date;
  }>;
}

/**
 * Faz o parsing de relatório de vendas (CSV ou texto colado do ERP/PDV comercial)
 */
export function parseSalesCsv(csvText: string): ImportedSaleRow[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rows: ImportedSaleRow[] = [];

  // Checa se primeira linha é cabeçalho
  const startIdx = lines[0].toLowerCase().includes('cupom') ||
    lines[0].toLowerCase().includes('data') ||
    lines[0].toLowerCase().includes('valor')
      ? 1
      : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) continue;

    const saleIdentifier = cols[0] || `VENDA-${i}`;
    const rawDate = cols[1];
    const rawAmount = cols[2];
    const rawPhone = cols[3] || '';
    const rawName = cols[4] || '';

    // Limpa valor monetário (ex: "R$ 350,00" -> 350.0)
    const cleanAmountStr = rawAmount
      .replace(/[^\d,\.-]/g, '')
      .replace(',', '.');
    const grossAmount = parseFloat(cleanAmountStr);

    if (isNaN(grossAmount) || grossAmount <= 0) continue;

    // Converte data
    let date = new Date();
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    rows.push({
      saleIdentifier,
      date: isNaN(date.getTime()) ? new Date() : date,
      grossAmount: Number(grossAmount.toFixed(2)),
      customerPhone: rawPhone.replace(/\D/g, '') || undefined,
      customerName: rawName || undefined,
    });
  }

  return rows;
}

/**
 * Cruza as vendas importadas do sistema comercial com as vendas lançadas no La Marka Club
 */
export async function matchSalesWithClub(
  importedSales: ImportedSaleRow[]
): Promise<ReconciliationResult> {
  const clubCredits = await prisma.cashbackCredit.findMany({
    where: { purchaseValue: { not: null } },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  const matched: ReconciliationResult['matched'] = [];
  const unmatchedErp: ReconciliationResult['unmatchedErp'] = [];
  const matchedClubCreditIds = new Set<string>();

  for (const sale of importedSales) {
    // Procura correspondência no clube
    const foundCredit = clubCredits.find((c) => {
      if (matchedClubCreditIds.has(c.id)) return false;

      // 1. Mesmo valor exato
      const isSameAmount = Math.abs((c.purchaseValue ?? 0) - sale.grossAmount) < 0.05;

      // 2. Mesmo telefone (se ambos informados)
      if (sale.customerPhone && c.customer.phone) {
        const cleanSalePhone = sale.customerPhone.replace(/\D/g, '');
        const cleanClubPhone = c.customer.phone.replace(/\D/g, '');
        if (cleanSalePhone !== cleanClubPhone) return false;
        return isSameAmount;
      }

      // Se não tem telefone, confere se bate valor
      return isSameAmount;
    });

    if (foundCredit) {
      matchedClubCreditIds.add(foundCredit.id);
      matched.push({
        saleIdentifier: sale.saleIdentifier,
        grossAmount: sale.grossAmount,
        customerName: foundCredit.customer.name,
        customerPhone: foundCredit.customer.phone,
        creditId: foundCredit.id,
        cashbackEarned: foundCredit.initialAmount,
      });
    } else {
      unmatchedErp.push(sale);
    }
  }

  // Identifica vendas que estão apenas no clube
  const unmatchedClub: ReconciliationResult['unmatchedClub'] = clubCredits
    .filter((c) => !matchedClubCreditIds.has(c.id))
    .map((c) => ({
      creditId: c.id,
      customerName: c.customer.name,
      customerPhone: c.customer.phone,
      purchaseAmount: c.purchaseValue ?? 0,
      cashbackAmount: c.initialAmount,
      date: c.createdAt,
    }));

  return {
    matched,
    unmatchedErp,
    unmatchedClub,
  };
}

/**
 * Concede cashback retroativo para uma venda fiscal que foi esquecida no balcão
 */
export async function creditRetroactiveFromErp(
  phone: string,
  amount: number,
  customerName?: string,
  operatorName = 'Dieizy (Conciliação)'
) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) {
    throw new Error('Telefone obrigatório para vincular o cashback à cliente.');
  }

  let customer = await prisma.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: customerName?.trim() || 'Cliente La Marka',
        phone: cleanPhone,
        magicToken: `tk_${nanoid(24)}`,
      },
    });
  }

  return await grantCashback(customer.id, amount, operatorName);
}
