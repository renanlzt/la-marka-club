import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { getCustomerWalletByToken } from '../src/lib/customer-service';
import { grantCashback } from '../src/lib/fifo-engine';
import { getVipTierInfo } from '../src/components/carteira/VipProgressCard';
import { nanoid } from 'nanoid';

describe('Customer Digital Wallet Service & Privacy', () => {
  let magicToken: string;
  let customerId: string;

  beforeEach(async () => {
    await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: { defaultCashbackPercentage: 5.0, defaultExpirationDays: 45 },
      create: { id: 'default', defaultCashbackPercentage: 5.0, defaultExpirationDays: 45 },
    });

    magicToken = `tk_${nanoid(20)}`;
    const randomPhone = `1198${Math.floor(1000000 + Math.random() * 9000000)}`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Camila Albuquerque',
        phone: randomPhone,
        cpf: '12345678900',
        magicToken,
      },
    });
    customerId = customer.id;
    await grantCashback(customerId, 200.0, 'Caixa Teste');
  });

  it('should retrieve wallet details with masked privacy data by valid token', async () => {
    const wallet = await getCustomerWalletByToken(magicToken);

    expect(wallet).not.toBeNull();
    expect(wallet?.customer.firstName).toBe('Camila');
    expect(wallet?.customer.maskedPhone).toContain('****');
    expect(wallet?.balanceInfo.availableBalance).toBe(10.0); // 5% of 200 = 10.0
    expect(wallet?.storeSettings).toBeDefined();
    expect(wallet?.storeSettings.defaultExpirationDays).toBe(45);
    expect(wallet?.storeSettings.defaultCashbackPercentage).toBe(5.0);
    expect(wallet?.transactions.length).toBeGreaterThanOrEqual(1);
    expect(wallet?.transactions[0].type).toBe('EARN');
  });

  it('should return null for invalid or non-existent token', async () => {
    const wallet = await getCustomerWalletByToken('invalid-token-123');
    expect(wallet).toBeNull();
  });
});

describe('VIP Club Progress and Card Tier Engine', () => {
  it('should correctly identify Prata tier with progress towards Ouro', () => {
    const tier = getVipTierInfo(50);
    expect(tier.currentTier).toBe('Prata');
    expect(tier.nextTier).toBe('Ouro');
    expect(tier.isMaxTier).toBe(false);
    expect(tier.remaining).toBe(50);
    expect(tier.progressPercentage).toBe(50);
  });

  it('should correctly identify Ouro tier when customer accumulates >= 100', () => {
    const tier = getVipTierInfo(150);
    expect(tier.currentTier).toBe('Ouro');
    expect(tier.nextTier).toBe('Diamante');
    expect(tier.isMaxTier).toBe(false);
    expect(tier.remaining).toBe(150);
    expect(tier.progressPercentage).toBe(25); // (150-100)/200 = 25%
  });

  it('should reach Diamante max tier when customer reaches 300 or more', () => {
    const tier = getVipTierInfo(350);
    expect(tier.currentTier).toBe('Diamante');
    expect(tier.isMaxTier).toBe(true);
    expect(tier.progressPercentage).toBe(100);
    expect(tier.remaining).toBe(0);
  });

  it('should format currency values consistently in Brazilian Real (pt-BR)', () => {
    const amount = 1250.5;
    const formatted = amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatted).toBe('1.250,50');
  });
});
