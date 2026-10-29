import { prisma } from './db';

export type VipTierType = 'PRATA' | 'OURO' | 'DIAMANTE';

export interface VipTierInfo {
  tier: VipTierType;
  percentage: number;
  label: string;
  badgeColor: string;
  nextTierSpentRequired: number | null;
  totalSpent6Months: number;
}

export const VIP_TIER_CONFIG = {
  PRATA: {
    tier: 'PRATA' as VipTierType,
    label: 'Membro Prata',
    percentage: 1.0,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    minSpent: 0,
    nextThreshold: 500,
  },
  OURO: {
    tier: 'OURO' as VipTierType,
    label: 'Membro Ouro',
    percentage: 1.5,
    badgeColor: 'bg-amber-100/90 text-amber-900 border-amber-300',
    minSpent: 500,
    nextThreshold: 1500,
  },
  DIAMANTE: {
    tier: 'DIAMANTE' as VipTierType,
    label: 'Membro Diamante',
    percentage: 2.0,
    badgeColor: 'bg-purple-100/90 text-purple-900 border-purple-300',
    minSpent: 1500,
    nextThreshold: null,
  },
} as const;

/**
 * Calcula o nível VIP da cliente com base no total de compras líquidas acumuladas nos últimos 6 meses.
 *
 * Regras:
 * - PRATA: compras < R$ 500, cashback base de 1.0%
 * - OURO: compras entre R$ 500 e R$ 1.500, cashback base de 1.5%
 * - DIAMANTE: compras >= R$ 1.500 (ou > R$ 1.500), cashback base de 2.0%
 */
export function calculateCustomerVipTier(totalSpent6Months: number): {
  tier: 'PRATA' | 'OURO' | 'DIAMANTE';
  percentage: number;
  label: string;
  badgeColor: string;
  nextTierSpentRequired: number | null;
  totalSpent6Months: number;
} {
  const spent = Math.max(0, typeof totalSpent6Months === 'number' && !isNaN(totalSpent6Months) ? totalSpent6Months : 0);

  if (spent >= VIP_TIER_CONFIG.DIAMANTE.minSpent) {
    return {
      tier: VIP_TIER_CONFIG.DIAMANTE.tier,
      percentage: VIP_TIER_CONFIG.DIAMANTE.percentage,
      label: VIP_TIER_CONFIG.DIAMANTE.label,
      badgeColor: VIP_TIER_CONFIG.DIAMANTE.badgeColor,
      nextTierSpentRequired: null,
      totalSpent6Months: Number(spent.toFixed(2)),
    };
  }

  if (spent >= VIP_TIER_CONFIG.OURO.minSpent) {
    const required = Number(Math.max(0, VIP_TIER_CONFIG.OURO.nextThreshold - spent).toFixed(2));
    return {
      tier: VIP_TIER_CONFIG.OURO.tier,
      percentage: VIP_TIER_CONFIG.OURO.percentage,
      label: VIP_TIER_CONFIG.OURO.label,
      badgeColor: VIP_TIER_CONFIG.OURO.badgeColor,
      nextTierSpentRequired: required,
      totalSpent6Months: Number(spent.toFixed(2)),
    };
  }

  const required = Number(Math.max(0, VIP_TIER_CONFIG.PRATA.nextThreshold - spent).toFixed(2));
  return {
    tier: VIP_TIER_CONFIG.PRATA.tier,
    percentage: VIP_TIER_CONFIG.PRATA.percentage,
    label: VIP_TIER_CONFIG.PRATA.label,
    badgeColor: VIP_TIER_CONFIG.PRATA.badgeColor,
    nextTierSpentRequired: required,
    totalSpent6Months: Number(spent.toFixed(2)),
  };
}

/**
 * Consulta o total de compras líquidas nos últimos 6 meses da cliente no banco de dados
 * e retorna as informações completas do Nível VIP.
 */
export async function getCustomerVipTier(customerId: string): Promise<VipTierInfo> {
  if (!customerId || typeof customerId !== 'string') {
    return calculateCustomerVipTier(0);
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // 1. Consulta lotes originados de compras nos últimos 6 meses
  const purchaseCredits = await prisma.cashbackCredit.findMany({
    where: {
      customerId,
      origin: 'PURCHASE',
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      purchaseValue: true,
      initialAmount: true,
    },
  });

  let totalSpent = purchaseCredits.reduce((acc, credit) => {
    if (typeof credit.purchaseValue === 'number' && credit.purchaseValue > 0) {
      return acc + credit.purchaseValue;
    }
    return acc;
  }, 0);

  // 2. Se não houver purchaseValue explícito em credits, busca em transações do tipo EARN
  if (totalSpent === 0) {
    const earnTransactions = await prisma.cashbackTransaction.findMany({
      where: {
        customerId,
        type: 'EARN',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        description: true,
        amount: true,
      },
    });

    for (const tx of earnTransactions) {
      const match = tx.description.match(/Compra de R\$\s*([\d.,]+)/i);
      if (match) {
        const parsed = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          totalSpent += parsed;
        }
      }
    }
  }

  return calculateCustomerVipTier(totalSpent);
}
