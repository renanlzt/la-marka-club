import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { getAllCustomersWithBalance, updateCustomer } from '../src/lib/admin-service';
import { grantCashback } from '../src/lib/fifo-engine';
import { nanoid } from 'nanoid';

describe('Admin Customers Management', () => {
  let customerId: string;
  let testPhone: string;

  beforeEach(async () => {
    testPhone = `1199${Math.floor(1000000 + Math.random() * 9000000)}`;
    const cust = await prisma.customer.create({
      data: {
        name: 'Camila Alcantara',
        phone: testPhone,
        cpf: '12345678901',
        birthDay: 18,
        birthMonth: 7,
        magicToken: `tk_${nanoid(20)}`,
      },
    });
    customerId = cust.id;
  });

  it('should list customers with active balance, expiring info and transaction stats', async () => {
    // Concede cashback para Camila: compra de R$ 300 -> R$ 15 (5%)
    await grantCashback(customerId, 300.0, 'Balcão');

    const list = await getAllCustomersWithBalance();
    const found = list.find((c) => c.id === customerId);

    expect(found).toBeDefined();
    expect(found?.name).toBe('Camila Alcantara');
    expect(found?.phone).toBe(testPhone);
    expect(found?.balanceInfo.availableBalance).toBe(15.0);
    expect(found?.balanceInfo.expiringAmount).toBe(15.0);
    expect(found?.stats.totalEarned).toBe(15.0);
    expect(found?.stats.totalPurchases).toBe(1);
  });

  it('should filter customers by search query (name, phone or cpf)', async () => {
    const listByName = await getAllCustomersWithBalance('Camila');
    expect(listByName.some((c) => c.id === customerId)).toBe(true);

    const listByPhone = await getAllCustomersWithBalance(testPhone);
    expect(listByPhone.some((c) => c.id === customerId)).toBe(true);

    const listByCpf = await getAllCustomersWithBalance('12345678901');
    expect(listByCpf.some((c) => c.id === customerId)).toBe(true);

    const listNonExistent = await getAllCustomersWithBalance('ClienteInexistenteXYZ999');
    expect(listNonExistent.length).toBe(0);
  });

  it('should update customer data successfully', async () => {
    const updated = await updateCustomer(customerId, {
      name: 'Camila Alcantara Santos',
      phone: '(11) 98888-7777',
      cpf: '987.654.321-00',
      birthDay: 25,
      birthMonth: 12,
      notes: 'Prefere vestidos floridos e tamanho M',
    });

    expect(updated.name).toBe('Camila Alcantara Santos');
    expect(updated.phone).toBe('11988887777');
    expect(updated.cpf).toBe('98765432100');
    expect(updated.birthDay).toBe(25);
    expect(updated.birthMonth).toBe(12);
    expect(updated.notes).toBe('Prefere vestidos floridos e tamanho M');
  });

  it('should prevent updating customer phone to an already taken phone', async () => {
    const otherPhone = `1198${Math.floor(1000000 + Math.random() * 9000000)}`;
    await prisma.customer.create({
      data: {
        name: 'Outra Cliente',
        phone: otherPhone,
        magicToken: `tk_${nanoid(20)}`,
      },
    });

    await expect(
      updateCustomer(customerId, {
        phone: otherPhone,
      })
    ).rejects.toThrow('Já existe outra cliente cadastrada com este número de telefone.');
  });
});
