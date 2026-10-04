import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { getCustomerWalletByToken } from '../src/lib/customer-service';
import { grantCashback } from '../src/lib/fifo-engine';
import { nanoid } from 'nanoid';

describe('Customer Digital Wallet Service & Privacy', () => {
  let magicToken: string;
  let customerId: string;

  beforeEach(async () => {
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
