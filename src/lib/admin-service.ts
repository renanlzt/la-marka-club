import { prisma } from './db';
import { DEFAULT_TEMPLATES } from './whatsapp';

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
