import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { getAllCustomersWithBalance, updateCustomer } from '../src/lib/admin-service';
import { grantCashback } from '../src/lib/fifo-engine';
import { nanoid } from 'nanoid';
import {
  getCustomerInitials,
  formatPhone,
  formatBRL,
  getMonthName,
  generateCustomerWhatsAppUrl,
  extractLastPurchaseDate,
  detectHabitualSeller,
  CustomerSummary,
} from '../src/components/admin/CustomerDrawer';

describe('Admin Customers Management', () => {
  let customerId: string;
  let testPhone: string;

  beforeEach(async () => {
    await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: { defaultCashbackPercentage: 5.0 },
      create: { id: 'default', defaultCashbackPercentage: 5.0 },
    });

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
    const updatedPhone = `1198${Math.floor(1000000 + Math.random() * 9000000)}`;
    const updated = await updateCustomer(customerId, {
      name: 'Camila Alcantara Santos',
      phone: updatedPhone,
      cpf: '987.654.321-00',
      birthDay: 25,
      birthMonth: 12,
      notes: 'Prefere vestidos floridos e tamanho M',
    });

    expect(updated.name).toBe('Camila Alcantara Santos');
    expect(updated.phone).toBe(updatedPhone);
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

  describe('Customer 360º Drawer Support & Formatting', () => {
    it('should correctly format initials for the Rosa Seco/Terracotta avatar', () => {
      expect(getCustomerInitials('Camila Alcantara')).toBe('CA');
      expect(getCustomerInitials('Dieizy')).toBe('DI');
      expect(getCustomerInitials('Maria Eduarda Santos')).toBe('MS');
      expect(getCustomerInitials('')).toBe('LM');
    });

    it('should format Brazilian phone numbers consistently', () => {
      expect(formatPhone('49999266069')).toBe('(49) 99926-6069');
      expect(formatPhone('1188887777')).toBe('(11) 8888-7777');
      expect(formatPhone('')).toBe('');
    });

    it('should format BRL currency amounts accurately', () => {
      expect(formatBRL(15)).toBe('15,00');
      expect(formatBRL(1234.5)).toBe('1.234,50');
      expect(formatBRL(0)).toBe('0,00');
    });

    it('should return Portuguese month names for birthday badge', () => {
      expect(getMonthName(7)).toBe('Julho');
      expect(getMonthName(10)).toBe('Outubro');
      expect(getMonthName(null)).toBe('');
    });

    it('should generate a personalized welcoming WhatsApp link with balance and magic token', () => {
      const mockCustomer: CustomerSummary = {
        id: customerId,
        name: 'Camila Alcantara',
        phone: '11999998888',
        cpf: '12345678901',
        birthDay: 18,
        birthMonth: 7,
        notes: 'Gosta de alfaiataria',
        magicToken: 'tk_test_magic_123',
        createdAt: new Date().toISOString(),
        balanceInfo: {
          availableBalance: 45.5,
          expiringAmount: 20.0,
          expiringInDays: 5,
          nextExpirationDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
        stats: {
          totalEarned: 100.0,
          totalRedeemed: 54.5,
          totalPurchases: 3,
        },
      };

      const waUrl = generateCustomerWhatsAppUrl(mockCustomer, 'https://lamarka.com.br');

      expect(waUrl).toContain('https://wa.me/5511999998888?text=');
      const decodedText = decodeURIComponent(waUrl.replace('https://wa.me/5511999998888?text=', ''));

      expect(decodedText).toContain('Olá, Camila!');
      expect(decodedText).toContain('R$ 45,50');
      expect(decodedText).toContain('La Marka Club');
      expect(decodedText).toContain('expira em 5 dias');
      expect(decodedText).toContain('https://lamarka.com.br/c/tk_test_magic_123');
    });

    it('should extract the last purchase date from transactions', () => {
      const mockTxs = [
        {
          id: 'tx-1',
          type: 'EARN',
          amount: 15.0,
          description: 'Compra no balcão de R$ 300,00',
          createdAt: '2026-10-25T14:30:00.000Z',
        },
        {
          id: 'tx-2',
          type: 'EARN',
          amount: 10.0,
          description: 'Compra de R$ 200,00',
          createdAt: '2026-10-10T10:00:00.000Z',
        },
      ];

      const { dateStr, isEstimated } = extractLastPurchaseDate(mockTxs);
      expect(dateStr).toBe('25/10/2026');
      expect(isEstimated).toBe(false);

      const emptyRes = extractLastPurchaseDate([]);
      expect(emptyRes.dateStr).toBe('Sem compras registradas');
    });

    it('should accurately detect linked habitual sellers', () => {
      const mockCustomer: CustomerSummary = {
        id: 'cust-101',
        name: 'Ana Paula',
        phone: '49999112233',
        cpf: null,
        birthDay: null,
        birthMonth: null,
        notes: 'Vendedora habitual: Mariana',
        magicToken: 'tk_ana',
        createdAt: new Date().toISOString(),
        balanceInfo: {
          availableBalance: 0,
          expiringAmount: 0,
          expiringInDays: null,
          nextExpirationDate: null,
        },
        stats: { totalEarned: 0, totalRedeemed: 0, totalPurchases: 0 },
      };

      const fromNotes = detectHabitualSeller(mockCustomer, []);
      expect(fromNotes.name).toBe('Mariana');
      expect(fromNotes.isLinked).toBe(true);

      const sellerCustomer: CustomerSummary = {
        ...mockCustomer,
        isSeller: true,
      };
      const fromRole = detectHabitualSeller(sellerCustomer, []);
      expect(fromRole.name).toBe('Própria Vendedora');

      const unlinkedCustomer: CustomerSummary = {
        ...mockCustomer,
        notes: null,
      };
      const unlinked = detectHabitualSeller(unlinkedCustomer, []);
      expect(unlinked.name).toBe('Balcão Geral');
      expect(unlinked.isLinked).toBe(false);
    });
  });
});
