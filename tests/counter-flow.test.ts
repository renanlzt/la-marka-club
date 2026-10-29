import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { processCounterSale, registerQuickCustomer, searchCustomerForCounter } from '../src/lib/counter-service';
import { formatCelebrationCashbackText } from '../src/components/balcao/RewardSuccessModal';
import { nanoid } from 'nanoid';

describe('Counter / Point of Sale Flow', () => {
  let customerPhone: string;
  let customerId: string;

  beforeEach(async () => {
    await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: { defaultCashbackPercentage: 5.0 },
      create: { id: 'default', defaultCashbackPercentage: 5.0 },
    });

    customerPhone = `1197${Math.floor(1000000 + Math.random() * 9000000)}`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Isabela Fontes',
        phone: customerPhone,
        magicToken: `tk_${nanoid(20)}`,
        birthDay: 15,
        birthMonth: 8,
      },
    });
    customerId = customer.id;
  });

  it('should search customer by phone and return profile with balance', async () => {
    const found = await searchCustomerForCounter(customerPhone);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Isabela Fontes');
    expect(found?.balanceInfo.availableBalance).toBe(0);
  });

  it('should register a new customer in 10-second quick register modal', async () => {
    const newPhone = `1196${Math.floor(1000000 + Math.random() * 9000000)}`;
    const newCustomer = await registerQuickCustomer({
      name: 'Beatriz Lima',
      phone: newPhone,
      birthDay: 20,
      birthMonth: 10,
    });

    expect(newCustomer.id).toBeDefined();
    expect(newCustomer.name).toBe('Beatriz Lima');
    expect(newCustomer.magicToken).toBeDefined();
  });

  it('should process a sale of R$ 300.00, grant 5% cashback and produce WhatsApp payload', async () => {
    const result = await processCounterSale({
      customerId,
      purchaseAmount: 300.0,
      redeemAmount: 0,
      operatorName: 'Atendente Carol',
    });

    expect(result.cashbackEarned).toBe(15.0);
    expect(result.netAmountToPay).toBe(300.0);
    expect(result.newBalance).toBe(15.0);
    expect(result.whatsAppMessage).toContain('Isabela');
    expect(result.whatsAppMessage).toContain('R$ 15,00');
    expect(result.whatsAppLink).toContain('https://wa.me/55');

    // Verifica a mensagem de comemoração encantadora disparada no modal de sucesso
    const celebrationNotice = formatCelebrationCashbackText(result.cashbackEarned);
    expect(celebrationNotice).toBe('✨ Parabéns! Você acabou de ganhar R$ 15,00 de cashback!');
  });

  it('should process sale with redemption, calculate cashback on net amount and deduct balance', async () => {
    // Primeiro concede saldo inicial de 40.00
    await processCounterSale({
      customerId,
      purchaseAmount: 800.0, // 5% = 40.00
      redeemAmount: 0,
    });

    // Nova compra de R$ 300.00 usando R$ 20.00 de cashback
    const result = await processCounterSale({
      customerId,
      purchaseAmount: 300.0,
      redeemAmount: 20.0,
      operatorName: 'Atendente Carol',
    });

    expect(result.redeemed).toBe(20.0);
    expect(result.netAmountToPay).toBe(280.0);
    // Cashback sobre valor líquido pago: R$ 280.00 * 5% = R$ 14.00
    expect(result.cashbackEarned).toBe(14.0);
    // Saldo anterior (40) - resgate (20) + novo cashback (14) = 34.00
    expect(result.newBalance).toBe(34.0);

    // Celebração do novo cashback líquido
    expect(formatCelebrationCashbackText(result.cashbackEarned)).toBe('✨ Parabéns! Você acabou de ganhar R$ 14,00 de cashback!');
  });

  it('should correctly format POS celebration delight banner text for customer delight', () => {
    expect(formatCelebrationCashbackText(15)).toBe('✨ Parabéns! Você acabou de ganhar R$ 15,00 de cashback!');
    expect(formatCelebrationCashbackText(42.5)).toBe('✨ Parabéns! Você acabou de ganhar R$ 42,50 de cashback!');
    expect(formatCelebrationCashbackText(1250.75)).toBe('✨ Parabéns! Você acabou de ganhar R$ 1.250,75 de cashback!');
  });
});
