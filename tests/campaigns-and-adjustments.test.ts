import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  createCampaign,
  getActiveCampaign,
  getAllCampaigns,
  toggleCampaignActive,
  deleteCampaign,
  getUpcomingBirthdays,
  sendBirthdayGiftAction,
  performManualAdjustment,
} from '../src/lib/campaigns-service';
import { grantCashback, getCustomerBalance } from '../src/lib/fifo-engine';
import { processCounterSale } from '../src/lib/counter-service';
import { nanoid } from 'nanoid';

describe('Campaigns, Birthdays & Manual Adjustments', () => {
  let customerId: string;

  beforeEach(async () => {
    const phone = `1195${Math.floor(1000000 + Math.random() * 9000000)}`;
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    const customer = await prisma.customer.create({
      data: {
        name: 'Tatiane Miranda',
        phone,
        magicToken: `tk_${nanoid(20)}`,
        birthDay: currentDay,
        birthMonth: currentMonth,
      },
    });
    customerId = customer.id;
  });

  it('should create a campaign and apply promotional percentage to cashback grant', async () => {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 7);

    const campaign = await createCampaign({
      name: 'Semana da Cliente La Marka',
      type: 'PERCENTAGE_OVERRIDE',
      value: 10.0, // 10% em vez dos 5% padrão
      startsAt,
      endsAt,
    });

    expect(campaign.id).toBeDefined();

    // Concede cashback passando a campanha ativa
    const result = await grantCashback(customerId, 200.0, 'Balcão', campaign.id);
    expect(result.credit.initialAmount).toBe(20.0); // 10% de 200 = 20.00
  });

  it('should list upcoming birthdays and grant gift bonus with WhatsApp message', async () => {
    const birthdays = await getUpcomingBirthdays();
    expect(birthdays.length).toBeGreaterThanOrEqual(1);

    const target = birthdays.find((b) => b.id === customerId);
    expect(target).toBeDefined();

    // Concede o presente
    const giftResult = await sendBirthdayGiftAction(customerId);
    expect(giftResult.giftAmount).toBe(30.0);
    expect(giftResult.whatsAppMessage).toContain('Parabéns');
    expect(giftResult.whatsAppMessage).toContain('R$ 30,00');

    const balance = await getCustomerBalance(customerId);
    expect(balance.availableBalance).toBe(30.0);
  });

  it('should perform manual adjustment with mandatory reason and operator', async () => {
    // 1. Rejeita sem justificativa
    await expect(
      performManualAdjustment(customerId, 15.0, '', 'Dieizy')
    ).rejects.toThrow(/justificativa/i);

    // 2. Ajuste positivo com justificativa
    const addResult = await performManualAdjustment(
      customerId,
      25.0,
      'Cortesia VIP Lançamento Coleção',
      'Dieizy'
    );
    expect(addResult.newBalance).toBe(25.0);

    // 3. Ajuste negativo (estorno de devolução)
    const subResult = await performManualAdjustment(
      customerId,
      -10.0,
      'Estorno por devolução de peça',
      'Dieizy'
    );
    expect(subResult.newBalance).toBe(15.0);

    // Verifica histórico de auditoria
    const txs = await prisma.cashbackTransaction.findMany({
      where: { customerId },
    });
    expect(txs.some((t) => t.type === 'MANUAL_ADD')).toBe(true);
    expect(txs.some((t) => t.type === 'MANUAL_SUBTRACT' && t.operatorName === 'Dieizy')).toBe(true);
  });

  it('should toggle campaign active status, retrieve stats, and delete safely', async () => {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 5);

    const campaign = await createCampaign({
      name: 'Black Friday Antecipada',
      description: 'Campanha de teste com cashback 15%',
      type: 'PERCENTAGE_OVERRIDE',
      value: 15.0,
      startsAt,
      endsAt,
    });

    // 1. Concede crédito com vínculo à campanha
    await grantCashback(customerId, 100.0, 'Balcão', campaign.id);

    // 2. Consulta campanhas com estatísticas
    const all = await getAllCampaigns();
    const found = all.find((c) => c.id === campaign.id);
    expect(found).toBeDefined();
    expect(found?.stats.totalCreditsCount).toBe(1);
    expect(found?.stats.totalCashbackGranted).toBe(15.0);

    // 3. Pausa a campanha
    const paused = await toggleCampaignActive(campaign.id, false);
    expect(paused.isActive).toBe(false);

    // 4. Reativa a campanha
    const resumed = await toggleCampaignActive(campaign.id, true);
    expect(resumed.isActive).toBe(true);

    // 5. Exclui a campanha com segurança (mantém o crédito histórico desvinculando com segurança)
    await deleteCampaign(campaign.id);
    const afterDelete = await getAllCampaigns();
    expect(afterDelete.some((c) => c.id === campaign.id)).toBe(false);
  });

  it('should preserve campaign attribution when counter sale is processed', async () => {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 3);

    const campaign = await createCampaign({
      name: 'Semana VIP Dupla',
      type: 'MULTIPLIER',
      value: 2.0,
      startsAt,
      endsAt,
    });

    const saleResult = await processCounterSale({
      customerId,
      purchaseAmount: 300.0,
      redeemAmount: 0,
      operatorName: 'Balcão Teste',
      customCashbackPercentage: 2.0, // VIP tier 1.0% x 2
    });

    expect(saleResult.cashbackEarned).toBe(6.0);

    // Verifica que o crédito salvo possui campaignId atribuído
    const credit = await prisma.cashbackCredit.findFirst({
      where: { customerId, campaignId: campaign.id },
    });
    expect(credit).toBeDefined();
    expect(credit?.initialAmount).toBe(6.0);
    expect(credit?.campaignId).toBe(campaign.id);
  });

  afterEach(async () => {
    await prisma.campaign.deleteMany();
  });
});
