import { prisma } from './db';
import {
  grantBirthdayGift,
  manualAdjustBalance,
  getCustomerBalance,
} from './fifo-engine';
import { formatWhatsAppMessage, generateWhatsAppLink } from './whatsapp';
import { getAppBaseUrl } from './url';

import { sanitizeText } from './sanitize';

export interface CampaignData {
  name: string;
  description?: string;
  type: string;
  value: number;
  minPurchase?: number;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Criação de uma campanha promocional temporária
 */
export async function createCampaign(data: CampaignData) {
  const cleanName = sanitizeText(data.name);
  if (!cleanName) {
    throw new Error('O nome da campanha é obrigatório.');
  }

  return await prisma.campaign.create({
    data: {
      name: cleanName,
      description: data.description ? sanitizeText(data.description) : null,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase || null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: true,
    },
  });
}

/**
 * Busca campanha ativa no momento
 */
export async function getActiveCampaign() {
  const now = new Date();
  return await prisma.campaign.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Lista clientes aniversariantes do mês com status de presente
 */
export async function getUpcomingBirthdays() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const customers = await prisma.customer.findMany({
    where: { birthMonth: currentMonth },
    include: {
      credits: {
        where: { origin: 'BIRTHDAY' },
      },
    },
    orderBy: [{ birthDay: 'asc' }, { name: 'asc' }],
  });

  return customers.map((c) => {
    // Verifica se já ganhou presente no ano atual
    const hasReceivedThisYear = c.credits.some(
      (credit) => new Date(credit.createdAt).getFullYear() === currentYear
    );

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      birthDay: c.birthDay,
      birthMonth: c.birthMonth,
      magicToken: c.magicToken,
      hasReceivedThisYear,
    };
  });
}

/**
 * Concede o presente de aniversário e gera a mensagem no WhatsApp
 */
export async function sendBirthdayGiftAction(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error('Cliente não encontrada.');
  }

  const settings = await prisma.storeSetting.findUnique({
    where: { id: 'default' },
  });

  const giftAmount = settings?.birthdayBonusAmount ?? 30.0;
  const validityDays = settings?.birthdayBonusValidityDays ?? 30;

  await grantBirthdayGift(customerId, giftAmount, validityDays, 'Dieizy (Presente de Aniversário)');

  const balanceInfo = await getCustomerBalance(customerId);
  const firstName = customer.name.trim().split(' ')[0];

  const walletUrl = `${getAppBaseUrl()}/c/${customer.magicToken}`;

  const whatsAppMessage = await formatWhatsAppMessage('BIRTHDAY', {
    primeiro_nome: firstName,
    nome: customer.name,
    cashback_ganho: `R$ ${giftAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    saldo_total: `R$ ${balanceInfo.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    link_carteira: walletUrl,
  });

  const whatsAppLink = generateWhatsAppLink(customer.phone, whatsAppMessage);

  return {
    giftAmount,
    whatsAppMessage,
    whatsAppLink,
  };
}

/**
 * Ajuste administrativo manual de saldo com justificativa obrigatória
 */
export async function performManualAdjustment(
  customerId: string,
  amount: number,
  reason: string,
  operatorName: string
) {
  const cleanReason = sanitizeText(reason);
  if (!cleanReason) {
    throw new Error('A justificativa é obrigatória para ajustes manuais.');
  }

  const cleanOperator = sanitizeText(operatorName);
  if (!cleanOperator) {
    throw new Error('O nome do operador é obrigatório.');
  }

  return await manualAdjustBalance(
    customerId,
    amount,
    cleanReason,
    cleanOperator
  );
}
