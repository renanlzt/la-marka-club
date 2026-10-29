import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { calculateCustomerVipTier, getCustomerVipTier } from '../src/lib/vip-tier-service';
import {
  searchCustomerForCounter,
  processCounterSale,
  registerQuickCustomer,
} from '../src/lib/counter-service';
import { grantCashback } from '../src/lib/fifo-engine';
import { createCampaign } from '../src/lib/campaigns-service';
import { nanoid } from 'nanoid';

describe('VIP Loyalty Tier Rules & Dynamic Engine (Bronze -> Prata -> Ouro -> Diamante)', () => {
  describe('calculateCustomerVipTier (Pure function)', () => {
    it('should assign BRONZE tier for 0 or negative accumulated spend with 0.5% cashback as initial category', () => {
      const zeroTier = calculateCustomerVipTier(0);
      expect(zeroTier.tier).toBe('BRONZE');
      expect(zeroTier.percentage).toBe(0.5);
      expect(zeroTier.label).toBe('Membro Bronze');
      expect(zeroTier.nextTierSpentRequired).toBe(300.0);
      expect(zeroTier.badgeColor).toContain('#7E4825');

      const negTier = calculateCustomerVipTier(-150);
      expect(negTier.tier).toBe('BRONZE');
      expect(negTier.percentage).toBe(0.5);
      expect(negTier.nextTierSpentRequired).toBe(300.0);

      const nanTier = calculateCustomerVipTier(NaN);
      expect(nanTier.tier).toBe('BRONZE');
      expect(nanTier.percentage).toBe(0.5);
    });

    it('should assign PRATA tier for spend between R$ 300 and R$ 800 with 1.0% cashback', () => {
      const tier300 = calculateCustomerVipTier(300.0);
      expect(tier300.tier).toBe('PRATA');
      expect(tier300.percentage).toBe(1.0);
      expect(tier300.label).toBe('Membro Prata');
      expect(tier300.nextTierSpentRequired).toBe(500.0);

      const tier799 = calculateCustomerVipTier(799.99);
      expect(tier799.tier).toBe('PRATA');
      expect(tier799.percentage).toBe(1.0);
      expect(tier799.nextTierSpentRequired).toBe(0.01);
    });

    it('should assign OURO tier at exactly R$ 800 up to R$ 1.500 with 1.5% cashback', () => {
      const tier800 = calculateCustomerVipTier(800.0);
      expect(tier800.tier).toBe('OURO');
      expect(tier800.percentage).toBe(1.5);
      expect(tier800.label).toBe('Membro Ouro');
      expect(tier800.nextTierSpentRequired).toBe(700.0);
      expect(tier800.badgeColor).toContain('amber');

      const tier1200 = calculateCustomerVipTier(1200.0);
      expect(tier1200.tier).toBe('OURO');
      expect(tier1200.percentage).toBe(1.5);
      expect(tier1200.nextTierSpentRequired).toBe(300.0);

      const tier1499 = calculateCustomerVipTier(1499.99);
      expect(tier1499.tier).toBe('OURO');
      expect(tier1499.percentage).toBe(1.5);
      expect(tier1499.nextTierSpentRequired).toBe(0.01);
    });

    it('should assign DIAMANTE tier for spend >= R$ 1.500 with 2.0% cashback and null nextTierRequired', () => {
      const tier1500 = calculateCustomerVipTier(1500.0);
      expect(tier1500.tier).toBe('DIAMANTE');
      expect(tier1500.percentage).toBe(2.0);
      expect(tier1500.label).toBe('Membro Diamante');
      expect(tier1500.nextTierSpentRequired).toBeNull();
      expect(tier1500.badgeColor).toContain('purple');

      const tier3000 = calculateCustomerVipTier(3000.0);
      expect(tier3000.tier).toBe('DIAMANTE');
      expect(tier3000.percentage).toBe(2.0);
      expect(tier3000.nextTierSpentRequired).toBeNull();
    });
  });

  describe('getCustomerVipTier (Database query with 6-month rolling window)', () => {
    let customerId: string;
    let customerPhone: string;

    beforeEach(async () => {
      customerPhone = `1194${Math.floor(1000000 + Math.random() * 9000000)}`;
      const customer = await prisma.customer.create({
        data: {
          name: 'Renata Vasconcellos',
          phone: customerPhone,
          magicToken: `tk_${nanoid(20)}`,
        },
      });
      customerId = customer.id;
    });

    it('should return BRONZE tier for customer without prior purchases', async () => {
      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('BRONZE');
      expect(vip.percentage).toBe(0.5);
      expect(vip.nextTierSpentRequired).toBe(300.0);
      expect(vip.totalSpent6Months).toBe(0);
    });

    it('should return PRATA tier when purchases in last 6 months reach R$ 350', async () => {
      await grantCashback(customerId, 350.0, 'Balcão Teste');

      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('PRATA');
      expect(vip.percentage).toBe(1.0);
      expect(vip.nextTierSpentRequired).toBe(450.0); // 800 - 350
      expect(vip.totalSpent6Months).toBe(350.0);
    });

    it('should return OURO tier when purchases in last 6 months reach R$ 900', async () => {
      await grantCashback(customerId, 900.0, 'Balcão Teste');

      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('OURO');
      expect(vip.percentage).toBe(1.5);
      expect(vip.nextTierSpentRequired).toBe(600.0); // 1500 - 900
      expect(vip.totalSpent6Months).toBe(900.0);
    });

    it('should return DIAMANTE tier when purchases in last 6 months exceed R$ 1.500', async () => {
      await grantCashback(customerId, 1000.0, 'Balcão Teste');
      await grantCashback(customerId, 800.0, 'Balcão Teste');

      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('DIAMANTE');
      expect(vip.percentage).toBe(2.0);
      expect(vip.nextTierSpentRequired).toBeNull();
      expect(vip.totalSpent6Months).toBe(1800.0);
    });

    it('should NOT count purchases older than 6 months', async () => {
      const sevenMonthsAgo = new Date();
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

      const expiresFuture = new Date();
      expiresFuture.setDate(expiresFuture.getDate() + 30);

      // Compra de R$ 2.000 realizada há 7 meses
      await prisma.cashbackCredit.create({
        data: {
          customerId,
          initialAmount: 100.0,
          currentBalance: 100.0,
          origin: 'PURCHASE',
          purchaseValue: 2000.0,
          status: 'ACTIVE',
          expiresAt: expiresFuture,
          createdAt: sevenMonthsAgo,
        },
      });

      // Cliente sem compras recentes deve permanecer BRONZE (categoria inicial)
      const vipBefore = await getCustomerVipTier(customerId);
      expect(vipBefore.tier).toBe('BRONZE');
      expect(vipBefore.totalSpent6Months).toBe(0);

      // Nova compra recente de R$ 900 dentro da janela de 6 meses leva a OURO
      await grantCashback(customerId, 900.0, 'Balcão Atual');
      const vipAfter = await getCustomerVipTier(customerId);
      expect(vipAfter.tier).toBe('OURO');
      expect(vipAfter.totalSpent6Months).toBe(900.0);
    });
  });

  describe('Counter & Caixa Integration (/balcao)', () => {
    let customerId: string;
    let customerPhone: string;

    beforeEach(async () => {
      customerPhone = `1193${Math.floor(1000000 + Math.random() * 9000000)}`;
      const customer = await prisma.customer.create({
        data: {
          name: 'Juliana Paes',
          phone: customerPhone,
          magicToken: `tk_${nanoid(20)}`,
        },
      });
      customerId = customer.id;
    });

    afterEach(async () => {
      await prisma.campaign.deleteMany();
    });

    it('should include customer vipTier in searchCustomerForCounter with initial BRONZE tier', async () => {
      const summary = await searchCustomerForCounter(customerPhone);
      expect(summary).not.toBeNull();
      expect(summary?.vipTier).toBeDefined();
      expect(summary?.vipTier?.tier).toBe('BRONZE');
      expect(summary?.vipTier?.percentage).toBe(0.5);
    });

    it('should grant 0.5% cashback for initial BRONZE customer in processCounterSale', async () => {
      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 200.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // 0.5% de 200.00 = R$ 1.00
      expect(sale.cashbackEarned).toBe(1.0);
      expect(sale.netAmountToPay).toBe(200.0);
      expect(sale.newBalance).toBe(1.0);
      expect(sale.vipTier?.tier).toBe('BRONZE');
    });

    it('should grant 1.0% cashback for PRATA customer in processCounterSale', async () => {
      // Cliente acumula R$ 400 em compras (PRATA)
      await grantCashback(customerId, 400.0, 'Compra anterior');

      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 300.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // 1.0% de 300.00 = R$ 3.00
      expect(sale.cashbackEarned).toBe(3.0);
      expect(sale.netAmountToPay).toBe(300.0);
      expect(sale.vipTier?.tier).toBe('PRATA');
    });

    it('should grant 1.5% cashback for OURO customer in processCounterSale', async () => {
      // Cliente já acumula R$ 900 em compras
      await grantCashback(customerId, 900.0, 'Compra anterior');

      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 400.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // 1.5% de 400.00 = R$ 6.00
      expect(sale.cashbackEarned).toBe(6.0);
      expect(sale.netAmountToPay).toBe(400.0);
      expect(sale.vipTier?.tier).toBe('OURO');
      expect(sale.vipTier?.totalSpent6Months).toBe(1300.0);
    });

    it('should grant 2.0% cashback for DIAMANTE customer in processCounterSale', async () => {
      // Cliente já acumula R$ 2.000 em compras
      await grantCashback(customerId, 2000.0, 'Compras VIP Anteriores');

      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 500.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // 2.0% de 500.00 = R$ 10.00
      expect(sale.cashbackEarned).toBe(10.0);
      expect(sale.vipTier?.tier).toBe('DIAMANTE');
      expect(sale.vipTier?.nextTierSpentRequired).toBeNull();
    });

    it('should upgrade customer tier from BRONZE to PRATA after crossing threshold', async () => {
      // Cliente tinha R$ 150 de compras (BRONZE)
      await grantCashback(customerId, 150.0, 'Compra inicial');

      const initialVip = await getCustomerVipTier(customerId);
      expect(initialVip.tier).toBe('BRONZE');

      // Nova compra de R$ 200 (leva a R$ 350 acumulados)
      // Ganha 0.5% sobre os R$ 200 (= R$ 1.00), e passa a ser PRATA
      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 200.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      expect(sale.cashbackEarned).toBe(1.0);
      expect(sale.vipTier?.tier).toBe('PRATA');
      expect(sale.vipTier?.totalSpent6Months).toBe(350.0);
      expect(sale.vipTier?.nextTierSpentRequired).toBe(450.0);
    });

    it('should respect active promotional campaign multiplier over VIP percentage', async () => {
      // Cliente DIAMANTE (2.0%)
      await grantCashback(customerId, 2000.0, 'Histórico');

      // Campanha ativa de 2x Multiplicador
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      const endsAt = new Date(now.getTime() + 86400000 * 7);

      await createCampaign({
        name: 'Super Bônus Fidelidade 2x',
        type: 'MULTIPLIER',
        value: 2.0,
        startsAt,
        endsAt,
      });

      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 500.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // DIAMANTE 2.0% * 2x multiplicador = 4.0%
      // 4% de R$ 500 = R$ 20.00
      expect(sale.cashbackEarned).toBe(20.0);
    });

    it('should respect PERCENTAGE_OVERRIDE campaign overriding VIP tier', async () => {
      // Cliente BRONZE (0.5%)
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      const endsAt = new Date(now.getTime() + 86400000 * 7);

      await createCampaign({
        name: 'Black Friday 10%',
        type: 'PERCENTAGE_OVERRIDE',
        value: 10.0,
        startsAt,
        endsAt,
      });

      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 200.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      // 10% de R$ 200 = R$ 20.00
      expect(sale.cashbackEarned).toBe(20.0);
    });
  });
});
