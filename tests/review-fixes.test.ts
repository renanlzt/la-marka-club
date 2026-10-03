import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  expireOutdatedCredits,
  getCustomerBalance,
  redeemCashback,
  grantCashback,
  manualAdjustBalance,
} from '../src/lib/fifo-engine';
import { processCounterSale } from '../src/lib/counter-service';
import { matchSalesWithClub } from '../src/lib/reconciliation';
import { createCampaign } from '../src/lib/campaigns-service';
import { nanoid } from 'nanoid';

describe('Review Fixes Verification Suite', () => {
  let customerId: string;
  let customerPhone: string;

  beforeEach(async () => {
    customerPhone = `1191${Math.floor(1000000 + Math.random() * 9000000)}`;
    const customer = await prisma.customer.create({
      data: {
        name: 'Tatiana Rezende',
        phone: customerPhone,
        magicToken: `tk_${nanoid(20)}`,
      },
    });
    customerId = customer.id;
  });

  afterEach(async () => {
    await prisma.campaign.deleteMany();
  });

  it('Critical 1: should accurately compute balanceAfter in ledger when multiple lots expire for the same customer', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    // Lot A: R$ 10.00 (expired)
    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 10.0,
        currentBalance: 10.0,
        expiresAt: pastDate,
        status: 'ACTIVE',
      },
    });

    // Lot B: R$ 5.00 (expired)
    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 5.0,
        currentBalance: 5.0,
        expiresAt: pastDate,
        status: 'ACTIVE',
      },
    });

    // Lot C: R$ 20.00 (active)
    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 20.0,
        currentBalance: 20.0,
        expiresAt: futureDate,
        status: 'ACTIVE',
      },
    });

    // Initial total was 35.00
    await expireOutdatedCredits(customerId);

    // After expiration, balance should be exactly 20.00
    const finalBalance = await getCustomerBalance(customerId);
    expect(finalBalance.availableBalance).toBe(20.0);

    // Check ledger entries for correct sequential balanceAfter
    const expireTxs = await prisma.cashbackTransaction.findMany({
      where: { customerId, type: 'EXPIRE' },
      orderBy: { createdAt: 'asc' },
    });
    expect(expireTxs.length).toBe(2);

    // One should decrease from 35 -> 25, the next from 25 -> 20
    const firstTx = expireTxs[0];
    const secondTx = expireTxs[1];
    expect(firstTx.balanceAfter).toBe(25.0);
    expect(secondTx.balanceAfter).toBe(20.0);
  });

  it('Important 1: should reject reconciliation match if phone numbers are explicitly different', async () => {
    const saleAmount = 320.0;
    // Credit with customer's phone
    await grantCashback(customerId, saleAmount, 'Balcão');

    const importedSales = [
      {
        saleIdentifier: 'CUP-DIFF-PHONE',
        date: new Date(),
        grossAmount: saleAmount,
        customerPhone: '11988887777', // Completely different phone!
        customerName: 'Outra Cliente',
      },
    ];

    const result = await matchSalesWithClub(importedSales);
    // Should NOT match because phone numbers are different even though amounts are identical
    expect(result.matched.length).toBe(0);
    expect(result.unmatchedErp.length).toBe(1);
  });

  it('Important 2: should automatically apply active promotional campaign in counter sale', async () => {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 5);

    await createCampaign({
      name: 'Black Friday 10%',
      type: 'PERCENTAGE_OVERRIDE',
      value: 10.0, // 10%
      startsAt,
      endsAt,
    });

    const sale = await processCounterSale({
      customerId,
      purchaseAmount: 200.0,
      redeemAmount: 0,
      operatorName: 'Balcão',
    });

    // 10% of 200 = 20.00, NOT the default 5% (10.00)
    expect(sale.cashbackEarned).toBe(20.0);
  });

  it('Important 4: should record MANUAL_SUBTRACT type and persist reason in manual balance deduction', async () => {
    // Add initial balance
    await grantCashback(customerId, 200.0, 'Balcão'); // 10.00 (or campaign % if active)
    const initialBalance = (await getCustomerBalance(customerId)).availableBalance;

    const res = await manualAdjustBalance(
      customerId,
      -5.0,
      'Estorno devolução de regata',
      'Dieizy'
    );
    expect(res.newBalance).toBe(initialBalance - 5.0);

    const tx = await prisma.cashbackTransaction.findFirst({
      where: { customerId, type: 'MANUAL_SUBTRACT' },
    });
    expect(tx).toBeDefined();
    expect(tx?.type).toBe('MANUAL_SUBTRACT');
    expect(tx?.reason).toBe('Estorno devolução de regata');
    expect(tx?.operatorName).toBe('Dieizy');
  });

  it('Important 5: should reject redemption amount greater than the purchase amount', async () => {
    // Concede R$ 100 de saldo
    await prisma.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: 100.0,
        currentBalance: 100.0,
        expiresAt: new Date(Date.now() + 864000000),
        status: 'ACTIVE',
      },
    });

    // Compra de R$ 50 tentando resgatar R$ 80
    await expect(
      processCounterSale({
        customerId,
        purchaseAmount: 50.0,
        redeemAmount: 80.0,
      })
    ).rejects.toThrow(/não pode ser maior que o valor da compra/i);
  });
});
