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

describe('VIP Loyalty Tier Rules & Dynamic Engine', () => {
  describe('calculateCustomerVipTier (Pure function)', () => {
    it('should assign PRATA tier for 0 or negative accumulated spend with 1.0% cashback', () => {
      const zeroTier = calculateCustomerVipTier(0);
      expect(zeroTier.tier).toBe('PRATA');
      expect(zeroTier.percentage).toBe(1.0);
      expect(zeroTier.label).toBe('Membro Prata');
      expect(zeroTier.nextTierSpentRequired).toBe(500.0);
      expect(zeroTier.badgeColor).toContain('slate');

      const negTier = calculateCustomerVipTier(-150);
      expect(negTier.tier).toBe('PRATA');
      expect(negTier.percentage).toBe(1.0);
      expect(negTier.nextTierSpentRequired).toBe(500.0);

      const nanTier = calculateCustomerVipTier(NaN);
      expect(nanTier.tier).toBe('PRATA');
      expect(nanTier.percentage).toBe(1.0);
    });

    it('should assign PRATA tier for spend under R$ 500 with correct progress to OURO', () => {
      const tier250 = calculateCustomerVipTier(250.0);
      expect(tier250.tier).toBe('PRATA');
      expect(tier250.percentage).toBe(1.0);
      expect(tier250.nextTierSpentRequired).toBe(250.0);

      const tier499 = calculateCustomerVipTier(499.99);
      expect(tier499.tier).toBe('PRATA');
      expect(tier499.percentage).toBe(1.0);
      expect(tier499.nextTierSpentRequired).toBe(0.01);
    });

    it('should assign OURO tier at exactly R$ 500 up to R$ 1.500 with 1.5% cashback', () => {
      const tier500 = calculateCustomerVipTier(500.0);
      expect(tier500.tier).toBe('OURO');
      expect(tier500.percentage).toBe(1.5);
      expect(tier500.label).toBe('Membro Ouro');
      expect(tier500.nextTierSpentRequired).toBe(1000.0);
      expect(tier500.badgeColor).toContain('amber');

      const tier1000 = calculateCustomerVipTier(1000.0);
      expect(tier1000.tier).toBe('OURO');
      expect(tier1000.percentage).toBe(1.5);
      expect(tier1000.nextTierSpentRequired).toBe(500.0);

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

    it('should return PRATA tier for customer without prior purchases', async () => {
      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('PRATA');
      expect(vip.percentage).toBe(1.0);
      expect(vip.nextTierSpentRequired).toBe(500.0);
      expect(vip.totalSpent6Months).toBe(0);
    });

    it('should return OURO tier when purchases in last 6 months reach R$ 600', async () => {
      // 1. Concede crédito originado de compra de R$ 600
      await grantCashback(customerId, 600.0, 'Balcão Teste');

      const vip = await getCustomerVipTier(customerId);
      expect(vip.tier).toBe('OURO');
      expect(vip.percentage).toBe(1.5);
      expect(vip.nextTierSpentRequired).toBe(900.0);
      expect(vip.totalSpent6Months).toBe(600.0);
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

      // Cliente sem compras recentes deve permanecer PRATA
      const vipBefore = await getCustomerVipTier(customerId);
      expect(vipBefore.tier).toBe('PRATA');
      expect(vipBefore.totalSpent6Months).toBe(0);

      // Nova compra recente de R$ 600 dentro da janela de 6 meses
      await grantCashback(customerId, 600.0, 'Balcão Atual');
      const vipAfter = await getCustomerVipTier(customerId);
      expect(vipAfter.tier).toBe('OURO');
      expect(vipAfter.totalSpent6Months).toBe(600.0);
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

    it('should include customer vipTier in searchCustomerForCounter', async () => {
      const summary = await searchCustomerForCounter(customerPhone);
      expect(summary).not.toBeNull();
      expect(summary?.vipTier).toBeDefined();
      expect(summary?.vipTier?.tier).toBe('PRATA');
      expect(summary?.vipTier?.percentage).toBe(1.0);
    });

    it('should grant 1.0% cashback for PRATA customer in processCounterSale', async () => {
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
      expect(sale.newBalance).toBe(3.0);
      expect(sale.vipTier?.tier).toBe('PRATA');
    });

    it('should grant 1.5% cashback for OURO customer in processCounterSale', async () => {
      // Cliente já acumula R$ 700 em compras
      await grantCashback(customerId, 700.0, 'Compra anterior');

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
      expect(sale.vipTier?.totalSpent6Months).toBe(1100.0);
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

    it('should upgrade customer tier from PRATA to OURO after crossing threshold', async () => {
      // Cliente tinha R$ 400 de compras (PRATA)
      await grantCashback(customerId, 400.0, 'Compra inicial');

      const initialVip = await getCustomerVipTier(customerId);
      expect(initialVip.tier).toBe('PRATA');

      // Nova compra de R$ 300 (leva a R$ 700 acumulados)
      // Ganha 1.0% sobre os R$ 300 (= R$ 3.00), e passa a ser OURO
      const sale = await processCounterSale({
        customerId,
        purchaseAmount: 300.0,
        redeemAmount: 0,
        operatorName: 'Caixa VIP',
        applyVipTier: true,
      });

      expect(sale.cashbackEarned).toBe(3.0);
      expect(sale.vipTier?.tier).toBe('OURO');
      expect(sale.vipTier?.totalSpent6Months).toBe(700.0);
      expect(sale.vipTier?.nextTierSpentRequired).toBe(800.0);
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
      // Cliente PRATA (1.0%)
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
