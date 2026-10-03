import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  createCampaign,
  getActiveCampaign,
  getUpcomingBirthdays,
  sendBirthdayGiftAction,
  performManualAdjustment,
} from '../src/lib/campaigns-service';
import { grantCashback, getCustomerBalance } from '../src/lib/fifo-engine';
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
    expect(txs.some((t) => t.type === 'REDEEM' && t.operatorName === 'Dieizy')).toBe(true);
  });
});
