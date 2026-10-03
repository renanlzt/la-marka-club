import { prisma } from './db';
import {
  getCustomerBalance,
  grantCashback,
  redeemCashback,
  CustomerBalanceInfo,
} from './fifo-engine';
import { formatWhatsAppMessage, generateWhatsAppLink } from './whatsapp';
import { getActiveCampaign } from './campaigns-service';
import { nanoid } from 'nanoid';

export interface CounterCustomerSummary {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  magicToken: string;
  balanceInfo: CustomerBalanceInfo;
}

export interface CounterSaleResult {
  customer: {
    id: string;
    name: string;
    phone: string;
    magicToken: string;
  };
  purchaseAmount: number;
  redeemed: number;
  netAmountToPay: number;
  cashbackEarned: number;
  newBalance: number;
  balanceInfo: CustomerBalanceInfo;
  whatsAppMessage: string;
  whatsAppLink: string;
}

/**
 * Busca rápida de cliente para a atendente no caixa por telefone, nome ou CPF
 */
export async function searchCustomerForCounter(
  query: string
): Promise<CounterCustomerSummary | null> {
  if (!query || query.trim().length === 0) return null;

  const cleanQuery = query.trim();
  const digits = cleanQuery.replace(/\D/g, '');

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: { contains: digits.length > 0 ? digits : cleanQuery } },
        { name: { contains: cleanQuery } },
        ...(digits.length >= 6 ? [{ cpf: { contains: digits } }] : []),
      ],
    },
  });

  if (!customer) return null;

  const balanceInfo = await getCustomerBalance(customer.id);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    cpf: customer.cpf,
    birthDay: customer.birthDay,
    birthMonth: customer.birthMonth,
    magicToken: customer.magicToken,
    balanceInfo,
  };
}

/**
 * Cadastro expresso de cliente no balcão em até 10 segundos
 */
export async function registerQuickCustomer(data: {
  name: string;
  phone: string;
  cpf?: string;
  birthDay?: number;
  birthMonth?: number;
  notes?: string;
}) {
  const cleanPhone = data.phone.replace(/\D/g, '');

  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Informe um número de telefone válido.');
  }

  const existing = await prisma.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (existing) {
    throw new Error('Já existe uma cliente cadastrada com este número de telefone.');
  }

  const magicToken = `tk_${nanoid(24)}`;

  return await prisma.customer.create({
    data: {
      name: data.name.trim(),
      phone: cleanPhone,
      cpf: data.cpf?.replace(/\D/g, '') || null,
      birthDay: data.birthDay || null,
      birthMonth: data.birthMonth || null,
      notes: data.notes || null,
      magicToken,
    },
  });
}

/**
 * Processamento completo de venda no balcão com resgate, novo cashback e link WhatsApp
 */
export async function processCounterSale(data: {
  customerId: string;
  purchaseAmount: number;
  redeemAmount?: number;
  operatorName?: string;
  customMessageNote?: string;
}): Promise<CounterSaleResult> {
  const { customerId, purchaseAmount, redeemAmount = 0, operatorName = 'Caixa' } = data;

  if (redeemAmount > purchaseAmount) {
    throw new Error('O valor de resgate não pode ser maior que o valor da compra.');
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error('Cliente não encontrada.');
  }

  // 1. Aplica o resgate se solicitado
  let actualRedeemed = 0;
  if (redeemAmount > 0) {
    const redeemRes = await redeemCashback(customerId, redeemAmount, operatorName);
    actualRedeemed = redeemRes.redeemed;
  }

  // 2. Calcula valor líquido a pagar
  const netAmountToPay = Number(
    Math.max(0, purchaseAmount - actualRedeemed).toFixed(2)
  );

  // 3. Concede novo cashback sobre o valor líquido pago
  let cashbackEarned = 0;
  if (netAmountToPay > 0) {
    const activeCampaign = await getActiveCampaign();
    const earnRes = await grantCashback(customerId, netAmountToPay, operatorName, activeCampaign?.id);
    cashbackEarned = earnRes.credit.initialAmount;
  }

  // 4. Saldo atualizado e prazos
  const balanceInfo = await getCustomerBalance(customerId);
  const firstName = customer.name.trim().split(' ')[0];

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://club.lamarka.com.br';
  const walletUrl = `${appBaseUrl}/c/${customer.magicToken}`;

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 5. Gera mensagem do WhatsApp
  const templateType = actualRedeemed > 0 ? 'REDEEM' : 'EARN_PURCHASE';
  let whatsAppMessage = await formatWhatsAppMessage(templateType, {
    primeiro_nome: firstName,
    nome: customer.name,
    valor_compra: `R$ ${formatBRL(purchaseAmount)}`,
    cashback_ganho: `R$ ${formatBRL(cashbackEarned)}`,
    saldo_utilizado: `R$ ${formatBRL(actualRedeemed)}`,
    saldo_total: `R$ ${formatBRL(balanceInfo.availableBalance)}`,
    validade: balanceInfo.nextExpirationDate
      ? new Intl.DateTimeFormat('pt-BR').format(balanceInfo.nextExpirationDate)
      : '30 dias',
    dias_para_expirar: String(balanceInfo.expiringInDays ?? 30),
    link_carteira: walletUrl,
  });

  if (data.customMessageNote && data.customMessageNote.trim()) {
    whatsAppMessage += `\n\n${data.customMessageNote.trim()}`;
  }

  const whatsAppLink = generateWhatsAppLink(customer.phone, whatsAppMessage);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      magicToken: customer.magicToken,
    },
    purchaseAmount,
    redeemed: actualRedeemed,
    netAmountToPay,
    cashbackEarned,
    newBalance: balanceInfo.availableBalance,
    balanceInfo,
    whatsAppMessage,
    whatsAppLink,
  };
}
