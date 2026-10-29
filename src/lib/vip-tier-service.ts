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

export interface VipTierConfig {
  silverPercentage: number;
  goldMinSpent: number;
  goldPercentage: number;
  diamondMinSpent: number;
  diamondPercentage: number;
}

export const DEFAULT_VIP_CONFIG: VipTierConfig = {
  silverPercentage: 1.0,
  goldMinSpent: 500,
  goldPercentage: 1.5,
  diamondMinSpent: 1500,
  diamondPercentage: 2.0,
};

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
 * Carrega a configuração ativa dos Níveis VIP do banco de dados.
 * O nível Prata (base) é automaticamente sincronizado com o defaultCashbackPercentage da loja.
 */
export async function getActiveVipTierConfig(): Promise<VipTierConfig> {
  const config: VipTierConfig = { ...DEFAULT_VIP_CONFIG };

  try {
    const vipTemplate = await prisma.messageTemplate.findUnique({
      where: { id: 'VIP_TIER_CONFIG' },
    });

    if (vipTemplate?.content) {
      const parsed = JSON.parse(vipTemplate.content);
      if (typeof parsed.silverPercentage === 'number') config.silverPercentage = parsed.silverPercentage;
      if (typeof parsed.goldMinSpent === 'number') config.goldMinSpent = parsed.goldMinSpent;
      if (typeof parsed.goldPercentage === 'number') config.goldPercentage = parsed.goldPercentage;
      if (typeof parsed.diamondMinSpent === 'number') config.diamondMinSpent = parsed.diamondMinSpent;
      if (typeof parsed.diamondPercentage === 'number') config.diamondPercentage = parsed.diamondPercentage;
    }
  } catch {
    // Fallback gracioso para os valores padrão caso o banco não responda
  }

  return config;
}

/**
 * Salva e persiste os Níveis VIP no banco de dados.
 * Aceita qualquer percentual fracionário (ex: 0.5%, 0.05%, 0.01%).
 */
export async function saveActiveVipTierConfig(partial: Partial<VipTierConfig>): Promise<VipTierConfig> {
  const current = await getActiveVipTierConfig();
  const updated: VipTierConfig = {
    silverPercentage: typeof partial.silverPercentage === 'number' ? partial.silverPercentage : current.silverPercentage,
    goldMinSpent: typeof partial.goldMinSpent === 'number' ? partial.goldMinSpent : current.goldMinSpent,
    goldPercentage: typeof partial.goldPercentage === 'number' ? partial.goldPercentage : current.goldPercentage,
    diamondMinSpent: typeof partial.diamondMinSpent === 'number' ? partial.diamondMinSpent : current.diamondMinSpent,
    diamondPercentage: typeof partial.diamondPercentage === 'number' ? partial.diamondPercentage : current.diamondPercentage,
  };

  // Se o percentual do nível Prata foi informado, mantém sincronizado com storeSetting.defaultCashbackPercentage
  if (typeof partial.silverPercentage === 'number') {
    try {
      await prisma.storeSetting.upsert({
        where: { id: 'default' },
        update: { defaultCashbackPercentage: partial.silverPercentage },
        create: {
          id: 'default',
          defaultCashbackPercentage: partial.silverPercentage,
        },
      });
    } catch {
      // continua
    }
  }

  await prisma.messageTemplate.upsert({
    where: { id: 'VIP_TIER_CONFIG' },
    update: {
      content: JSON.stringify(updated),
      title: 'Configuração dos Níveis VIP',
      isCustomized: true,
    },
    create: {
      id: 'VIP_TIER_CONFIG',
      content: JSON.stringify(updated),
      title: 'Configuração dos Níveis VIP',
      isCustomized: true,
    },
  });

  return updated;
}

/**
 * Calcula o nível VIP da cliente com base no total de compras líquidas acumuladas nos últimos 6 meses.
 * Aceita uma configuração customizada opcional para simulações ou regras personalizadas da loja.
 */
export function calculateCustomerVipTier(
  totalSpent6Months: number,
  customConfig?: VipTierConfig
): {
  tier: 'PRATA' | 'OURO' | 'DIAMANTE';
  percentage: number;
  label: string;
  badgeColor: string;
  nextTierSpentRequired: number | null;
  totalSpent6Months: number;
} {
  const spent = Math.max(0, typeof totalSpent6Months === 'number' && !isNaN(totalSpent6Months) ? totalSpent6Months : 0);

  const cfg = customConfig ?? {
    silverPercentage: VIP_TIER_CONFIG.PRATA.percentage,
    goldMinSpent: VIP_TIER_CONFIG.OURO.minSpent,
    goldPercentage: VIP_TIER_CONFIG.OURO.percentage,
    diamondMinSpent: VIP_TIER_CONFIG.DIAMANTE.minSpent,
    diamondPercentage: VIP_TIER_CONFIG.DIAMANTE.percentage,
  };

  if (spent >= cfg.diamondMinSpent) {
    return {
      tier: 'DIAMANTE',
      percentage: cfg.diamondPercentage,
      label: VIP_TIER_CONFIG.DIAMANTE.label,
      badgeColor: VIP_TIER_CONFIG.DIAMANTE.badgeColor,
      nextTierSpentRequired: null,
      totalSpent6Months: Number(spent.toFixed(2)),
    };
  }

  if (spent >= cfg.goldMinSpent) {
    const required = Number(Math.max(0, cfg.diamondMinSpent - spent).toFixed(2));
    return {
      tier: 'OURO',
      percentage: cfg.goldPercentage,
      label: VIP_TIER_CONFIG.OURO.label,
      badgeColor: VIP_TIER_CONFIG.OURO.badgeColor,
      nextTierSpentRequired: required,
      totalSpent6Months: Number(spent.toFixed(2)),
    };
  }

  const required = Number(Math.max(0, cfg.goldMinSpent - spent).toFixed(2));
  return {
    tier: 'PRATA',
    percentage: cfg.silverPercentage,
    label: VIP_TIER_CONFIG.PRATA.label,
    badgeColor: VIP_TIER_CONFIG.PRATA.badgeColor,
    nextTierSpentRequired: required,
    totalSpent6Months: Number(spent.toFixed(2)),
  };
}

/**
 * Consulta o total de compras líquidas nos últimos 6 meses da cliente no banco de dados
 * e retorna as informações completas do Nível VIP de acordo com os parâmetros configurados na loja.
 */
export async function getCustomerVipTier(customerId: string): Promise<VipTierInfo> {
  const vipConfig = await getActiveVipTierConfig();

  if (!customerId || typeof customerId !== 'string') {
    return calculateCustomerVipTier(0, vipConfig);
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

  return calculateCustomerVipTier(totalSpent, vipConfig);
}
