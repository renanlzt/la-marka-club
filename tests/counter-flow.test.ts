import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { processCounterSale, registerQuickCustomer, searchCustomerForCounter } from '../src/lib/counter-service';
import { nanoid } from 'nanoid';

describe('Counter / Point of Sale Flow', () => {
  let customerPhone: string;
  let customerId: string;

  beforeEach(async () => {
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
  });
});
