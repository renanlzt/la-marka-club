import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { toggleCustomerSeller, getActiveSellers } from '../src/lib/admin-service';
import { processCounterSale } from '../src/lib/counter-service';
import { nanoid } from 'nanoid';

describe('Salespersons (Vendedoras) Management & Point of Sale Selection', () => {
  let customerAId: string;
  let customerBId: string;
  let buyerId: string;

  beforeEach(async () => {
    // Cliente A
    const custA = await prisma.customer.create({
      data: {
        name: 'Carol Martins',
        phone: `1197${Math.floor(1000000 + Math.random() * 9000000)}`,
        magicToken: `tk_${nanoid(20)}`,
        isSeller: false,
      },
    });
    customerAId = custA.id;

    // Cliente B
    const custB = await prisma.customer.create({
      data: {
        name: 'Juliana Paes',
        phone: `1196${Math.floor(1000000 + Math.random() * 9000000)}`,
        magicToken: `tk_${nanoid(20)}`,
        isSeller: true,
      },
    });
    customerBId = custB.id;

    // Cliente Compradora
    const buyer = await prisma.customer.create({
      data: {
        name: 'Renata Vasconcelos',
        phone: `1195${Math.floor(1000000 + Math.random() * 9000000)}`,
        magicToken: `tk_${nanoid(20)}`,
      },
    });
    buyerId = buyer.id;
  });

  it('should list only active sellers', async () => {
    const sellers = await getActiveSellers();
    const hasJuliana = sellers.some((s) => s.id === customerBId);
    const hasCarol = sellers.some((s) => s.id === customerAId);

    expect(hasJuliana).toBe(true);
    expect(hasCarol).toBe(false);
  });

  it('should toggle customer seller status on and off', async () => {
    // Torna Carol vendedora
    const newStatus1 = await toggleCustomerSeller(customerAId, true);
    expect(newStatus1).toBe(true);

    let sellers = await getActiveSellers();
    expect(sellers.some((s) => s.id === customerAId)).toBe(true);

    // Remove status de vendedora
    const newStatus2 = await toggleCustomerSeller(customerAId, false);
    expect(newStatus2).toBe(false);

    sellers = await getActiveSellers();
    expect(sellers.some((s) => s.id === customerAId)).toBe(false);
  });

  it('should record selected seller name as operatorName in counter sale', async () => {
    const sale = await processCounterSale({
      customerId: buyerId,
      purchaseAmount: 200.0,
      operatorName: 'Juliana Paes',
    });

    const tx = await prisma.cashbackTransaction.findFirst({
      where: { customerId: buyerId },
      orderBy: { createdAt: 'desc' },
    });

    expect(tx).toBeDefined();
    expect(tx?.operatorName).toBe('Juliana Paes');
  });
});
