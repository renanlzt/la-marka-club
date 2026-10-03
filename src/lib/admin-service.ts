import { prisma } from './db';
import { DEFAULT_TEMPLATES } from './whatsapp';
import { CustomerBalanceInfo } from './fifo-engine';

export interface DashboardStats {
  totalCustomers: number;
  totalSalesVolume: number;
  totalCashbackIssued: number;
  totalCashbackRedeemed: number;
  totalCashbackExpired: number;
  activeCashbackInCirculation: number;
  repeatPurchaseRate: number; // %
  customersWithRepeatPurchase: number;
  totalPurchasingCustomers: number;
  upcomingBirthdaysCount: number;
}

/**
 * Agrega todos os indicadores do negócio para a Dieizy
 */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const totalCustomers = await prisma.customer.count();

  // Volume total de vendas que geraram cashback
  const purchases = await prisma.cashbackCredit.findMany({
    where: { purchaseValue: { not: null } },
    select: { purchaseValue: true, initialAmount: true, currentBalance: true, status: true },
  });

  const totalSalesVolume = Number(
    purchases.reduce((acc, p) => acc + (p.purchaseValue ?? 0), 0).toFixed(2)
  );

  const totalCashbackIssued = Number(
    purchases.reduce((acc, p) => acc + p.initialAmount, 0).toFixed(2)
  );

  // Resgates e Expirações
  const transactions = await prisma.cashbackTransaction.findMany({
    select: { type: true, amount: true, customerId: true },
  });

  const totalCashbackRedeemed = Number(
    transactions
      .filter((t) => t.type === 'REDEEM')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0)
      .toFixed(2)
  );

  const totalCashbackExpired = Number(
    transactions
      .filter((t) => t.type === 'EXPIRE')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0)
      .toFixed(2)
  );

  // Saldo ativo em circulação
  const activeCredits = await prisma.cashbackCredit.findMany({
    where: { status: 'ACTIVE', currentBalance: { gt: 0 } },
    select: { currentBalance: true },
  });
  const activeCashbackInCirculation = Number(
    activeCredits.reduce((acc, c) => acc + c.currentBalance, 0).toFixed(2)
  );

  // Indicador de Recompra (Fidelização): clientes com 2 ou mais compras
  const customerPurchaseCounts = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'EARN')
    .forEach((t) => {
      customerPurchaseCounts.set(
        t.customerId,
        (customerPurchaseCounts.get(t.customerId) ?? 0) + 1
      );
    });

  const totalPurchasingCustomers = customerPurchaseCounts.size;
  let customersWithRepeatPurchase = 0;
  customerPurchaseCounts.forEach((count) => {
    if (count >= 2) customersWithRepeatPurchase++;
  });

  const repeatPurchaseRate =
    totalPurchasingCustomers > 0
      ? Number(
          ((customersWithRepeatPurchase / totalPurchasingCustomers) * 100).toFixed(1)
        )
      : 0;

  // Aniversariantes do mês atual
  const currentMonth = new Date().getMonth() + 1;
  const upcomingBirthdaysCount = await prisma.customer.count({
    where: { birthMonth: currentMonth },
  });

  return {
    totalCustomers,
    totalSalesVolume,
    totalCashbackIssued,
    totalCashbackRedeemed,
    totalCashbackExpired,
    activeCashbackInCirculation,
    repeatPurchaseRate,
    customersWithRepeatPurchase,
    totalPurchasingCustomers,
    upcomingBirthdaysCount,
  };
}

/**
 * Atualiza configurações globais da La Marka
 */
export async function updateStoreSettings(data: {
  storeName?: string;
  defaultCashbackPercentage?: number;
  defaultExpirationDays?: number;
  birthdayBonusAmount?: number;
  birthdayBonusValidityDays?: number;
  birthdayBonusDaysBefore?: number;
}) {
  return await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: data,
    create: {
      id: 'default',
      storeName: data.storeName ?? 'La Marka',
      defaultCashbackPercentage: data.defaultCashbackPercentage ?? 5.0,
      defaultExpirationDays: data.defaultExpirationDays ?? 45,
      birthdayBonusAmount: data.birthdayBonusAmount ?? 30.0,
      birthdayBonusValidityDays: data.birthdayBonusValidityDays ?? 30,
      birthdayBonusDaysBefore: data.birthdayBonusDaysBefore ?? 7,
    },
  });
}

/**
 * Customiza o template de mensagem no banco
 */
export async function updateMessageTemplate(id: string, content: string) {
  const defaultTitle = DEFAULT_TEMPLATES[id]?.title ?? 'Mensagem';

  return await prisma.messageTemplate.upsert({
    where: { id },
    update: {
      content,
      isCustomized: true,
    },
    create: {
      id,
      title: defaultTitle,
      content,
      isCustomized: true,
    },
  });
}

/**
 * Restaura o template para o texto padrão oficial da La Marka
 */
export async function resetMessageTemplate(id: string) {
  const defaultTemplate = DEFAULT_TEMPLATES[id];
  if (!defaultTemplate) {
    throw new Error(`Template padrão para ${id} não encontrado.`);
  }

  return await prisma.messageTemplate.upsert({
    where: { id },
    update: {
      content: defaultTemplate.content,
      isCustomized: false,
    },
    create: {
      id,
      title: defaultTemplate.title,
      content: defaultTemplate.content,
      isCustomized: false,
    },
  });
}

export interface CustomerAdminSummary {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  notes: string | null;
  magicToken: string;
  isSeller: boolean;
  createdAt: Date;
  balanceInfo: CustomerBalanceInfo;
  stats: {
    totalEarned: number;
    totalRedeemed: number;
    totalPurchases: number;
  };
}

/**
 * Lista clientes cadastrados com saldo em tempo real, vencimentos e histórico resumido
 */
export async function getAllCustomersWithBalance(query?: string): Promise<CustomerAdminSummary[]> {
  const now = new Date();

  let where: any = {};
  if (query && query.trim()) {
    const q = query.trim();
    const digits = q.replace(/\D/g, '');
    const conditions: any[] = [{ name: { contains: q } }];
    if (digits.length >= 3 && /^[0-9()+\-\s.]+$/.test(q)) {
      conditions.push({ phone: { contains: digits } });
      conditions.push({ cpf: { contains: digits } });
    } else if (digits.length >= 8) {
      conditions.push({ phone: { contains: digits } });
      conditions.push({ cpf: { contains: digits } });
    }
    where = { OR: conditions };
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const activeCredits = await prisma.cashbackCredit.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gt: now },
      currentBalance: { gt: 0 },
    },
    orderBy: { expiresAt: 'asc' },
  });

  const creditsByCustomer = new Map<string, typeof activeCredits>();
  for (const c of activeCredits) {
    const list = creditsByCustomer.get(c.customerId) || [];
    list.push(c);
    creditsByCustomer.set(c.customerId, list);
  }

  const txs = await prisma.cashbackTransaction.findMany({
    select: { customerId: true, type: true, amount: true },
  });

  const txsByCustomer = new Map<string, { totalEarned: number; totalRedeemed: number; totalPurchases: number }>();
  for (const t of txs) {
    const s = txsByCustomer.get(t.customerId) || { totalEarned: 0, totalRedeemed: 0, totalPurchases: 0 };
    if (t.type === 'EARN') {
      s.totalEarned += Math.max(0, t.amount);
      s.totalPurchases += 1;
    } else if (t.type === 'REDEEM' || t.type === 'MANUAL_SUBTRACT') {
      s.totalRedeemed += Math.abs(t.amount);
    } else if (t.type === 'MANUAL_ADD' || t.type === 'BIRTHDAY') {
      s.totalEarned += Math.max(0, t.amount);
    }
    txsByCustomer.set(t.customerId, s);
  }

  return customers.map((cust) => {
    const custCredits = creditsByCustomer.get(cust.id) || [];
    const availableBalance = Number(
      custCredits.reduce((acc, c) => acc + c.currentBalance, 0).toFixed(2)
    );
    const firstExpiring = custCredits[0];
    let expiringAmount = 0;
    let expiringInDays: number | null = null;
    let nextExpirationDate: Date | null = null;

    if (firstExpiring) {
      expiringAmount = Number(firstExpiring.currentBalance.toFixed(2));
      nextExpirationDate = firstExpiring.expiresAt;
      const diffTime = firstExpiring.expiresAt.getTime() - now.getTime();
      expiringInDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const s = txsByCustomer.get(cust.id) || { totalEarned: 0, totalRedeemed: 0, totalPurchases: 0 };

    return {
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      cpf: cust.cpf,
      birthDay: cust.birthDay,
      birthMonth: cust.birthMonth,
      notes: cust.notes,
      magicToken: cust.magicToken,
      isSeller: Boolean(cust.isSeller),
      createdAt: cust.createdAt,
      balanceInfo: {
        availableBalance,
        expiringAmount,
        expiringInDays,
        nextExpirationDate,
      },
      stats: {
        totalEarned: Number(s.totalEarned.toFixed(2)),
        totalRedeemed: Number(s.totalRedeemed.toFixed(2)),
        totalPurchases: s.totalPurchases,
      },
    };
  });
}

/**
 * Altera o status de vendedora de uma cliente (liga/desliga)
 */
export async function toggleCustomerSeller(
  customerId: string,
  explicitStatus?: boolean
): Promise<boolean> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { isSeller: true },
  });

  if (!customer) {
    throw new Error('Cliente não encontrada.');
  }

  const nextStatus =
    explicitStatus !== undefined ? explicitStatus : !customer.isSeller;

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { isSeller: nextStatus },
    select: { isSeller: true },
  });

  return updated.isSeller;
}

/**
 * Retorna todas as clientes marcadas como vendedoras ativas na loja
 */
export async function getActiveSellers(): Promise<
  Array<{ id: string; name: string; phone: string }>
> {
  return await prisma.customer.findMany({
    where: { isSeller: true },
    select: {
      id: true,
      name: true,
      phone: true,
    },
    orderBy: { name: 'asc' },
  });
}


