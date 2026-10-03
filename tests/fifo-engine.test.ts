import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  grantCashback,
  redeemCashback,
  getCustomerBalance,
  expireOutdatedCredits,
  grantBirthdayGift,
} from '../src/lib/fifo-engine';
import { nanoid } from 'nanoid';

describe('FIFO Cashback Engine & Ledger', () => {
  let customerId: string;

  beforeEach(async () => {
    // Clean up test customer
    const phone = `11999${Math.floor(100000 + Math.random() * 900000)}`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Mariana Silva',
        phone,
        magicToken: nanoid(24),
      },
    });
    customerId = customer.id;
  });

  it('should grant default 5% cashback on a purchase of R$ 300.00', async () => {
    const result = await grantCashback(customerId, 300.0, 'Caixa Balcão');

    expect(result.credit.initialAmount).toBe(15.0);
    expect(result.credit.currentBalance).toBe(15.0);
    expect(result.credit.status).toBe('ACTIVE');
    expect(result.newBalance).toBe(15.0);

    const balanceInfo = await getCustomerBalance(customerId);
    expect(balanceInfo.availableBalance).toBe(15.0);
    expect(balanceInfo.expiringAmount).toBe(15.0);
    expect(balanceInfo.expiringInDays).toBeGreaterThan(0);
  });

  it('should consume oldest batch first (FIFO) on partial and multiple lot redemption', async () => {
    // 1. Grant batch 1: R$ 15.00 (expires in 20 days)
    const date1 = new Date();
    date1.setDate(date1.getDate() + 20);

    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 15.0,
        currentBalance: 15.0,
        expiresAt: date1,
        status: 'ACTIVE',
        origin: 'PURCHASE',
      },
    });

    // 2. Grant batch 2: R$ 25.00 (expires in 45 days)
    const date2 = new Date();
    date2.setDate(date2.getDate() + 45);

    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 25.0,
        currentBalance: 25.0,
        expiresAt: date2,
        status: 'ACTIVE',
        origin: 'PURCHASE',
      },
    });

    const initialBalance = await getCustomerBalance(customerId);
    expect(initialBalance.availableBalance).toBe(40.0);

    // 3. Redeem R$ 20.00 (must consume 15.00 from batch 1 and 5.00 from batch 2)
    const redeemResult = await redeemCashback(customerId, 20.0, 'Caixa Balcão');
    expect(redeemResult.redeemed).toBe(20.0);
    expect(redeemResult.newBalance).toBe(20.0);

    // Verify credits in database
    const credits = await prisma.cashbackCredit.findMany({
      where: { customerId },
      orderBy: { expiresAt: 'asc' },
    });

    // First batch must be fully used
    expect(credits[0].status).toBe('FULLY_USED');
    expect(credits[0].currentBalance).toBe(0.0);

    // Second batch must have 20.00 left (25.00 - 5.00)
    expect(credits[1].status).toBe('ACTIVE');
    expect(credits[1].currentBalance).toBe(20.0);

    // Verify balance
    const finalBalance = await getCustomerBalance(customerId);
    expect(finalBalance.availableBalance).toBe(20.0);
  });

  it('should reject redemption when amount exceeds available balance', async () => {
    await grantCashback(customerId, 100.0); // 5% = 5.00

    await expect(redeemCashback(customerId, 10.0)).rejects.toThrow(
      /Saldo insuficiente/i
    );
  });

  it('should expire outdated credits and record EXPIRE transaction in ledger', async () => {
    // Create an expired credit
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 18.0,
        currentBalance: 18.0,
        expiresAt: pastDate,
        status: 'ACTIVE',
        origin: 'PURCHASE',
      },
    });

    const expiredCount = await expireOutdatedCredits();
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    const balanceInfo = await getCustomerBalance(customerId);
    expect(balanceInfo.availableBalance).toBe(0.0);

    const expireTransaction = await prisma.cashbackTransaction.findFirst({
      where: { customerId, type: 'EXPIRE' },
    });
    expect(expireTransaction).toBeDefined();
    expect(expireTransaction?.amount).toBe(-18.0);
  });

  it('should grant birthday gift bonus with custom validity', async () => {
    const gift = await grantBirthdayGift(customerId, 30.0, 30);
    expect(gift.initialAmount).toBe(30.0);
    expect(gift.origin).toBe('BIRTHDAY');

    const balanceInfo = await getCustomerBalance(customerId);
    expect(balanceInfo.availableBalance).toBe(30.0);

    const bdayTx = await prisma.cashbackTransaction.findFirst({
      where: { customerId, type: 'BIRTHDAY_GIFT' },
    });
    expect(bdayTx).toBeDefined();
    expect(bdayTx?.amount).toBe(30.0);
  });
});
