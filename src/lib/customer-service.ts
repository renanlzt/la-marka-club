import { prisma } from './db';
import { getCustomerBalance, CustomerBalanceInfo } from './fifo-engine';
import { getCustomerVipTier, VipTierInfo } from './vip-tier-service';
import { getActiveCampaign } from './campaigns-service';

export interface CustomerWalletData {
  customer: {
    id: string;
    name: string;
    firstName: string;
    maskedPhone: string;
    birthDay: number | null;
    birthMonth: number | null;
  };
  balanceInfo: CustomerBalanceInfo;
  storeSettings: {
    storeName: string;
    defaultCashbackPercentage: number;
    defaultExpirationDays: number;
  };
  vipTier?: VipTierInfo;
  activeCampaign?: {
    name: string;
    description?: string | null;
    type: string;
    value: number;
    endsAt: Date;
  } | null;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
  }>;
}

export type CustomerSegmentType =
  | 'INACTIVE_45D'
  | 'EXPIRING_15D'
  | 'BIRTHDAYS_WEEK'
  | 'TOP_TIER';

export interface SegmentCounts {
  INACTIVE_45D: number;
  EXPIRING_15D: number;
  BIRTHDAYS_WEEK: number;
  TOP_TIER: number;
}

export interface CustomerSegmentCustomer {
  id: string;
  name: string;
  firstName: string;
  phone: string;
  maskedPhone: string;
  cpf: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  notes: string | null;
  magicToken: string;
  isSeller?: boolean;
  createdAt: Date;
  balanceInfo: {
    availableBalance: number;
    expiringAmount: number;
    expiringInDays: number | null;
    nextExpirationDate: Date | null;
  };
  stats: {
    totalEarned: number;
    totalRedeemed: number;
    totalPurchases: number;
    lastPurchaseDate: Date | null;
  };
  segmentContext: {
    daysInactive?: number;
    daysUntilExpiration?: number | null;
    isBirthdayWeek?: boolean;
    tier?: string;
    suggestedWhatsAppMessage: string;
    whatsAppUrl: string;
  };
}

/**
 * Formata valores numéricos para o padrão de moeda brasileiro (BRL)
 */
export function formatBRL(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Ofusca número de telefone preservando apenas DDD e final para privacidade
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const ddd = digits.slice(-11, -9);
    const last4 = digits.slice(-4);
    return `(${ddd}) 9****-${last4}`;
  }
  return 'Telefone cadastrado';
}

/**
 * Calcula os dias inativos desde a última compra ou data de cadastro
 */
export function calculateDaysInactive(
  lastPurchaseDate: Date | null,
  createdAt: Date,
  referenceDate = new Date()
): number {
  const baseDate = lastPurchaseDate || createdAt;
  const diffMs = referenceDate.getTime() - new Date(baseDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Verifica se a cliente não realiza compras há mais de 45 dias
 */
export function isInactiveCustomer(
  lastPurchaseDate: Date | null,
  createdAt: Date,
  daysThreshold = 45,
  referenceDate = new Date()
): boolean {
  const days = calculateDaysInactive(lastPurchaseDate, createdAt, referenceDate);
  return days >= daysThreshold;
}

/**
 * Verifica se a cliente possui saldo com vencimento nos próximos X dias (ex: 15 dias)
 */
export function isExpiringCustomer(
  balanceInfo: {
    availableBalance: number;
    expiringInDays: number | null;
    expiringAmount?: number;
  },
  daysThreshold = 15
): boolean {
  if (balanceInfo.availableBalance <= 0) return false;
  if (balanceInfo.expiringInDays === null || balanceInfo.expiringInDays === undefined) {
    return false;
  }
  return balanceInfo.expiringInDays >= 0 && balanceInfo.expiringInDays <= daysThreshold;
}

/**
 * Retorna lista de pares { month, day } para a janela de dias à frente (ex: 7 dias)
 */
export function getUpcomingBirthdayDays(
  daysAhead = 7,
  referenceDate = new Date()
): Array<{ month: number; day: number }> {
  const result: Array<{ month: number; day: number }> = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + i);
    result.push({
      month: d.getMonth() + 1,
      day: d.getDate(),
    });
  }
  return result;
}

/**
 * Verifica se a cliente faz aniversário nos próximos X dias (ex: 7 dias)
 */
export function isBirthdayInUpcomingDays(
  birthDay: number | null,
  birthMonth: number | null,
  daysAhead = 7,
  referenceDate = new Date()
): boolean {
  if (!birthDay || !birthMonth) return false;

  const upcomingDays = getUpcomingBirthdayDays(daysAhead, referenceDate);
  return upcomingDays.some((d) => d.month === birthMonth && d.day === birthDay);
}

/**
 * Verifica se a cliente é TOP_TIER (maior fidelidade / maior volume)
 */
export function isTopTierCustomer(stats: {
  totalEarned: number;
  totalPurchases: number;
}): boolean {
  // Fidelidade comprovada: 2 ou mais compras OU volume VIP acumulado >= R$ 100 em cashback
  return stats.totalPurchases >= 2 || stats.totalEarned >= 100;
}

/**
 * Formata mensagem contextualizada e carinhosa para WhatsApp por segmento
 */
export function formatSegmentWhatsAppMessage(
  segment: CustomerSegmentType,
  customer: {
    name: string;
    firstName?: string;
    availableBalance?: number;
    balanceInfo?: {
      availableBalance: number;
      expiringAmount?: number;
      expiringInDays?: number | null;
    };
    expiringAmount?: number;
    expiringInDays?: number | null;
    magicToken?: string;
  },
  originUrl = ''
): string {
  const firstName =
    customer.firstName || customer.name.trim().split(/\s+/)[0] || 'Cliente';
  const balance =
    customer.balanceInfo?.availableBalance ?? customer.availableBalance ?? 0;
  const expiringAmt =
    customer.balanceInfo?.expiringAmount ?? customer.expiringAmount ?? balance;
  const expiringDays =
    customer.balanceInfo?.expiringInDays ?? customer.expiringInDays ?? null;

  const saldoFormatted = `R$ ${formatBRL(balance)}`;
  const expiringFormatted = `R$ ${formatBRL(expiringAmt)}`;

  const walletUrl = customer.magicToken
    ? originUrl
      ? `${originUrl.replace(/\/$/, '')}/c/${customer.magicToken}`
      : `https://lamarka.com.br/c/${customer.magicToken}`
    : '';

  switch (segment) {
    case 'INACTIVE_45D': {
      let msg = `Olá, ${firstName}! Sentimos sua falta aqui na La Marka... você tem ${saldoFormatted} de saldo esperando por você! ✨`;
      if (walletUrl) {
        msg += `\n\nVenha nos visitar e aproveitar seu saldo antes de escolher seu novo look:\n👉 ${walletUrl}`;
      }
      return msg;
    }

    case 'EXPIRING_15D': {
      const valorExpira = expiringAmt > 0 ? expiringFormatted : saldoFormatted;
      let msg = `Olá, ${firstName}! Seu cashback de ${valorExpira} expira em breve...`;
      if (expiringDays !== null && expiringDays !== undefined) {
        msg += ` (em ${expiringDays} dia${expiringDays !== 1 ? 's' : ''})!`;
      }
      msg += ` Não deixe seu saldo expirar! Venha escolher suas peças favoritas na La Marka 💕`;
      if (walletUrl) {
        msg += `\n\nConfira seu extrato aqui: ${walletUrl}`;
      }
      return msg;
    }

    case 'BIRTHDAYS_WEEK': {
      let msg = `Olá, ${firstName}! Parabéns pelo seu aniversário nesta semana! A La Marka comemora o seu dia com você! 🎂✨\nVocê tem ${saldoFormatted} de saldo especial esperando por você para escolher o seu presente!`;
      if (walletUrl) {
        msg += `\n\nConfira sua carteira digital:\n👉 ${walletUrl}`;
      }
      return msg;
    }

    case 'TOP_TIER': {
      let msg = `Olá, ${firstName}! Como uma de nossas clientes VIP mais especiais da La Marka, preparamos novidades exclusivas para você! ✨\nVocê tem ${saldoFormatted} de saldo disponível para novas peças.`;
      if (walletUrl) {
        msg += `\n\nVeja sua carteira VIP:\n👉 ${walletUrl}`;
      }
      return msg;
    }
  }
}

/**
 * Higieniza o número de telefone e gera o link direto do WhatsApp (wa.me)
 */
export function generateSegmentWhatsAppUrl(
  segment: CustomerSegmentType,
  customer: {
    phone: string;
    name: string;
    firstName?: string;
    availableBalance?: number;
    balanceInfo?: {
      availableBalance: number;
      expiringAmount?: number;
      expiringInDays?: number | null;
    };
    expiringAmount?: number;
    expiringInDays?: number | null;
    magicToken?: string;
  },
  originUrl = ''
): string {
  let cleanDigits = customer.phone.replace(/\D/g, '');
  if (cleanDigits.length === 10 || cleanDigits.length === 11) {
    cleanDigits = `55${cleanDigits}`;
  }
  const text = formatSegmentWhatsAppMessage(segment, customer, originUrl);
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(text)}`;
}

/**
 * Busca e computa dados unificados de todas as clientes para segmentação
 */
export async function getAllCustomersSegmentData(
  referenceDate = new Date()
): Promise<CustomerSegmentCustomer[]> {
  const now = referenceDate;

  // 1. Clientes cadastrados
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (customers.length === 0) return [];

  // 2. Créditos ativos para apuração de saldo e prazos de validade
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

  // 3. Transações para histórico e apuração da última compra
  const txs = await prisma.cashbackTransaction.findMany({
    select: {
      customerId: true,
      type: true,
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const txsByCustomer = new Map<
    string,
    {
      totalEarned: number;
      totalRedeemed: number;
      totalPurchases: number;
      lastPurchaseDate: Date | null;
    }
  >();

  for (const t of txs) {
    const s = txsByCustomer.get(t.customerId) || {
      totalEarned: 0,
      totalRedeemed: 0,
      totalPurchases: 0,
      lastPurchaseDate: null,
    };

    if (t.type === 'EARN') {
      s.totalEarned += Math.max(0, t.amount);
      s.totalPurchases += 1;
      if (!s.lastPurchaseDate || t.createdAt > s.lastPurchaseDate) {
        s.lastPurchaseDate = t.createdAt;
      }
    } else if (t.type === 'REDEEM' || t.type === 'MANUAL_SUBTRACT') {
      s.totalRedeemed += Math.abs(t.amount);
    } else if (
      t.type === 'MANUAL_ADD' ||
      t.type === 'BIRTHDAY' ||
      t.type === 'BIRTHDAY_GIFT'
    ) {
      s.totalEarned += Math.max(0, t.amount);
    }

    txsByCustomer.set(t.customerId, s);
  }

  // 4. Mapeamento consolidado
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

    const s = txsByCustomer.get(cust.id) || {
      totalEarned: 0,
      totalRedeemed: 0,
      totalPurchases: 0,
      lastPurchaseDate: null,
    };

    const daysInactive = calculateDaysInactive(
      s.lastPurchaseDate,
      cust.createdAt,
      now
    );
    const firstName = cust.name.trim().split(/\s+/)[0] || 'Cliente';

    // Segmento primário contextual
    let defaultSegment: CustomerSegmentType = 'INACTIVE_45D';
    if (isExpiringCustomer({ availableBalance, expiringInDays }, 15)) {
      defaultSegment = 'EXPIRING_15D';
    } else if (
      isBirthdayInUpcomingDays(cust.birthDay, cust.birthMonth, 7, now)
    ) {
      defaultSegment = 'BIRTHDAYS_WEEK';
    } else if (isTopTierCustomer(s)) {
      defaultSegment = 'TOP_TIER';
    } else if (
      isInactiveCustomer(s.lastPurchaseDate, cust.createdAt, 45, now)
    ) {
      defaultSegment = 'INACTIVE_45D';
    }

    const suggestedMsg = formatSegmentWhatsAppMessage(defaultSegment, {
      name: cust.name,
      firstName,
      availableBalance,
      expiringAmount,
      expiringInDays,
      magicToken: cust.magicToken,
    });

    const whatsAppUrl = generateSegmentWhatsAppUrl(defaultSegment, {
      phone: cust.phone,
      name: cust.name,
      firstName,
      availableBalance,
      expiringAmount,
      expiringInDays,
      magicToken: cust.magicToken,
    });

    return {
      id: cust.id,
      name: cust.name,
      firstName,
      phone: cust.phone,
      maskedPhone: maskPhone(cust.phone),
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
        lastPurchaseDate: s.lastPurchaseDate,
      },
      segmentContext: {
        daysInactive,
        daysUntilExpiration: expiringInDays,
        isBirthdayWeek: isBirthdayInUpcomingDays(
          cust.birthDay,
          cust.birthMonth,
          7,
          now
        ),
        tier:
          s.totalEarned >= 300
            ? 'Diamante'
            : s.totalEarned >= 100
            ? 'Ouro'
            : 'Prata',
        suggestedWhatsAppMessage: suggestedMsg,
        whatsAppUrl,
      },
    };
  });
}

/**
 * Retorna clientes segmentados com contagens otimizadas
 */
export async function getCustomerSegments(
  type?: CustomerSegmentType | 'ALL',
  referenceDate = new Date()
): Promise<{
  segment: CustomerSegmentType | 'ALL';
  count: number;
  customers: CustomerSegmentCustomer[];
  counts: SegmentCounts;
}> {
  const all = await getAllCustomersSegmentData(referenceDate);

  const inactives = all.filter((c) =>
    isInactiveCustomer(c.stats.lastPurchaseDate, c.createdAt, 45, referenceDate)
  );

  const expirings = all.filter((c) =>
    isExpiringCustomer(c.balanceInfo, 15)
  );

  const birthdays = all.filter((c) =>
    isBirthdayInUpcomingDays(c.birthDay, c.birthMonth, 7, referenceDate)
  );

  const topTiers = all.filter((c) => isTopTierCustomer(c.stats));

  const counts: SegmentCounts = {
    INACTIVE_45D: inactives.length,
    EXPIRING_15D: expirings.length,
    BIRTHDAYS_WEEK: birthdays.length,
    TOP_TIER: topTiers.length,
  };

  const chosenType = type || 'ALL';
  let selectedCustomers: CustomerSegmentCustomer[] = [];

  if (chosenType === 'INACTIVE_45D') {
    selectedCustomers = inactives.map((c) => ({
      ...c,
      segmentContext: {
        ...c.segmentContext,
        suggestedWhatsAppMessage: formatSegmentWhatsAppMessage('INACTIVE_45D', c),
        whatsAppUrl: generateSegmentWhatsAppUrl('INACTIVE_45D', c),
      },
    }));
  } else if (chosenType === 'EXPIRING_15D') {
    selectedCustomers = expirings.map((c) => ({
      ...c,
      segmentContext: {
        ...c.segmentContext,
        suggestedWhatsAppMessage: formatSegmentWhatsAppMessage('EXPIRING_15D', c),
        whatsAppUrl: generateSegmentWhatsAppUrl('EXPIRING_15D', c),
      },
    }));
  } else if (chosenType === 'BIRTHDAYS_WEEK') {
    selectedCustomers = birthdays.map((c) => ({
      ...c,
      segmentContext: {
        ...c.segmentContext,
        suggestedWhatsAppMessage: formatSegmentWhatsAppMessage('BIRTHDAYS_WEEK', c),
        whatsAppUrl: generateSegmentWhatsAppUrl('BIRTHDAYS_WEEK', c),
      },
    }));
  } else if (chosenType === 'TOP_TIER') {
    selectedCustomers = topTiers
      .slice()
      .sort(
        (a, b) =>
          b.stats.totalEarned - a.stats.totalEarned ||
          b.stats.totalPurchases - a.stats.totalPurchases
      )
      .map((c) => ({
        ...c,
        segmentContext: {
          ...c.segmentContext,
          suggestedWhatsAppMessage: formatSegmentWhatsAppMessage('TOP_TIER', c),
          whatsAppUrl: generateSegmentWhatsAppUrl('TOP_TIER', c),
        },
      }));
  } else {
    selectedCustomers = all;
  }

  return {
    segment: chosenType,
    count: selectedCustomers.length,
    customers: selectedCustomers,
    counts,
  };
}

/**
 * Retorna apenas as contagens de todos os segmentos
 */
export async function getCustomerSegmentCounts(
  referenceDate = new Date()
): Promise<SegmentCounts> {
  const result = await getCustomerSegments('ALL', referenceDate);
  return result.counts;
}

/**
 * Busca a carteira digital da cliente pelo token de alta segurança
 */
export async function getCustomerWalletByToken(
  magicToken: string
): Promise<CustomerWalletData | null> {
  if (!magicToken || magicToken.trim().length === 0) return null;

  const customer = await prisma.customer.findUnique({
    where: { magicToken: magicToken.trim() },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  });

  if (!customer) return null;

  const balanceInfo = await getCustomerBalance(customer.id);
  const firstName = customer.name.trim().split(' ')[0];
  const vipTier = await getCustomerVipTier(customer.id);
  const activeCampaign = await getActiveCampaign();

  const settings = await prisma.storeSetting.findUnique({
    where: { id: 'default' },
  });

  const storeSettings = {
    storeName: settings?.storeName ?? 'La Marka',
    defaultCashbackPercentage: settings?.defaultCashbackPercentage ?? 5.0,
    defaultExpirationDays: settings?.defaultExpirationDays ?? 45,
  };

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      firstName,
      maskedPhone: maskPhone(customer.phone),
      birthDay: customer.birthDay,
      birthMonth: customer.birthMonth,
    },
    balanceInfo,
    storeSettings,
    vipTier,
    activeCampaign: activeCampaign
      ? {
          name: activeCampaign.name,
          description: activeCampaign.description,
          type: activeCampaign.type,
          value: activeCampaign.value,
          endsAt: activeCampaign.endsAt,
        }
      : null,
    transactions: customer.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt,
    })),
  };
}

export interface CustomerLookupInput {
  name?: string;
  phone?: string;
  birthDay?: number | null;
  birthMonth?: number | null;
}

export interface CustomerLookupResult {
  success: boolean;
  magicToken?: string;
  customerName?: string;
  error?: string;
}

function normalizeForSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Consulta pública da carteira da cliente por combinação de pelo menos 2 critérios:
 * - Telefone
 * - Data de aniversário (Dia e Mês)
 * - Nome (parcial ou completo)
 */
export async function lookupCustomerWallet(
  input: CustomerLookupInput
): Promise<CustomerLookupResult> {
  const cleanName = input.name ? input.name.trim() : '';
  const cleanPhone = input.phone ? input.phone.replace(/\D/g, '') : '';
  const birthDay =
    typeof input.birthDay === 'number' && !isNaN(input.birthDay) ? input.birthDay : null;
  const birthMonth =
    typeof input.birthMonth === 'number' && !isNaN(input.birthMonth) ? input.birthMonth : null;

  const hasName = cleanName.length >= 2;
  const hasPhone = cleanPhone.length >= 8;
  const hasBirthday =
    birthDay !== null &&
    birthDay >= 1 &&
    birthDay <= 31 &&
    birthMonth !== null &&
    birthMonth >= 1 &&
    birthMonth <= 12;

  const validCount = (hasName ? 1 : 0) + (hasPhone ? 1 : 0) + (hasBirthday ? 1 : 0);

  if (validCount < 2) {
    return {
      success: false,
      error:
        'Por favor, preencha pelo menos 2 campos (ex: Telefone e Data de Aniversário, ou Nome e Telefone) para localizar sua carteira com segurança.',
    };
  }

  // Monta condições de busca no banco
  const whereConditions: any[] = [];

  if (hasPhone) {
    const last8 = cleanPhone.slice(-8);
    whereConditions.push({
      phone: { contains: last8 },
    });
  }

  if (hasBirthday) {
    whereConditions.push({
      birthDay,
      birthMonth,
    });
  }

  // Busca candidatos no banco
  const candidates = await prisma.customer.findMany({
    where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
    select: {
      id: true,
      name: true,
      phone: true,
      birthDay: true,
      birthMonth: true,
      magicToken: true,
    },
  });

  // Filtra em memória para matching preciso com nome parcial e telefone
  const matched = candidates.filter((c) => {
    // 1. Checa nome se foi informado
    if (hasName) {
      const normalizedQuery = normalizeForSearch(cleanName);
      const normalizedCandidate = normalizeForSearch(c.name);
      if (!normalizedCandidate.includes(normalizedQuery)) {
        return false;
      }
    }

    // 2. Checa telefone se foi informado
    if (hasPhone) {
      const candidateDigits = c.phone.replace(/\D/g, '');
      const queryDigits = cleanPhone;
      // Aceita correspondência se terminar com os mesmos dígitos ou conter
      if (!candidateDigits.includes(queryDigits) && !candidateDigits.endsWith(queryDigits.slice(-8))) {
        return false;
      }
    }

    // 3. Checa aniversário se foi informado
    if (hasBirthday) {
      if (c.birthDay !== birthDay || c.birthMonth !== birthMonth) {
        return false;
      }
    }

    return true;
  });

  if (matched.length === 0) {
    return {
      success: false,
      error:
        'Nenhuma carteira foi localizada com as informações preenchidas. Por favor, confira os dados ou solicite ajuda em nossa loja física.',
    };
  }

  if (matched.length > 1) {
    return {
      success: false,
      error:
        'Encontramos mais de um cadastro correspondente. Por favor, informe também o seu número de telefone para consultar sua carteira com segurança.',
    };
  }

  return {
    success: true,
    magicToken: matched[0].magicToken,
    customerName: matched[0].name,
  };
}
