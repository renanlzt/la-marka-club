import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  getAdminDashboardStats,
  updateStoreSettings,
  updateMessageTemplate,
  resetMessageTemplate,
} from '../src/lib/admin-service';

describe('Admin Dashboard Stats & Store Settings', () => {
  it('should return aggregated stats for dashboard', async () => {
    const stats = await getAdminDashboardStats();

    expect(stats.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(stats.totalCashbackIssued).toBeGreaterThanOrEqual(0);
    expect(stats.totalCashbackRedeemed).toBeGreaterThanOrEqual(0);
    expect(stats.repeatPurchaseRate).toBeDefined(); // Taxa de retorno em %
  });

  it('should update store settings (cashback % and expiration days)', async () => {
    const updated = await updateStoreSettings({
      defaultCashbackPercentage: 6.0,
      defaultExpirationDays: 60,
      birthdayBonusAmount: 35.0,
      birthdayBonusValidityDays: 30,
      birthdayBonusDaysBefore: 7,
    });

    expect(updated.defaultCashbackPercentage).toBe(6.0);
    expect(updated.defaultExpirationDays).toBe(60);

    // Reset back to defaults for other tests
    await updateStoreSettings({
      defaultCashbackPercentage: 5.0,
      defaultExpirationDays: 45,
      birthdayBonusAmount: 30.0,
      birthdayBonusValidityDays: 30,
      birthdayBonusDaysBefore: 7,
    });
  });

  it('should update active purchase credits expiration date when defaultExpirationDays changes', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Cliente Teste Validade',
        phone: '11999998877',
        magicToken: 'tk_test_validade',
      },
    });

    const now = new Date();
    const expires45 = new Date(now);
    expires45.setDate(expires45.getDate() + 45);

    const credit = await prisma.cashbackCredit.create({
      data: {
        customerId: customer.id,
        initialAmount: 10.0,
        currentBalance: 10.0,
        expiresAt: expires45,
        status: 'ACTIVE',
        origin: 'PURCHASE',
      },
    });

    // Atualiza configurações da loja para 60 dias
    await updateStoreSettings({
      defaultExpirationDays: 60,
    });

    const updatedCredit = await prisma.cashbackCredit.findUnique({
      where: { id: credit.id },
    });

    const diffDays = Math.round(
      (updatedCredit!.expiresAt.getTime() - updatedCredit!.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(60);

    // Clean up
    await prisma.cashbackCredit.delete({ where: { id: credit.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await updateStoreSettings({ defaultExpirationDays: 45 });
  });

  it('should customize a WhatsApp message template and allow reset to default', async () => {
    const customContent = 'Olá {primeiro_nome}, recado especial!';

    // Customize
    const updated = await updateMessageTemplate('EARN_PURCHASE', customContent);
    expect(updated.isCustomized).toBe(true);
    expect(updated.content).toBe(customContent);

    // Reset to default
    const reset = await resetMessageTemplate('EARN_PURCHASE');
    expect(reset.isCustomized).toBe(false);
    expect(reset.content).toContain('La Marka');
  });
});
