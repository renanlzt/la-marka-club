import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  getAllSellers,
  createSeller,
  updateSeller,
  deleteSeller,
  getActiveSellers,
} from '../src/lib/admin-service';

describe('Gestão de Vendedores (Seller Entity)', () => {
  beforeEach(async () => {
    // Limpa a tabela de vendedores e clientes de teste
    await prisma.seller.deleteMany();
    await prisma.cashbackTransaction.deleteMany();
    await prisma.cashbackCredit.deleteMany();
    await prisma.customer.deleteMany();
  });

  it('deve cadastrar uma vendedora avulsa com sucesso', async () => {
    const seller = await createSeller({
      name: 'Mariana Silva',
      phone: '11988887777',
      code: 'VEND-01',
    });

    expect(seller.id).toBeDefined();
    expect(seller.name).toBe('Mariana Silva');
    expect(seller.phone).toBe('11988887777');
    expect(seller.code).toBe('VEND-01');
    expect(seller.active).toBe(true);
    expect(seller.customerId).toBeNull();
  });

  it('deve cadastrar uma vendedora vinculada a uma cliente existente', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Camila Pitanga',
        phone: '11977776666',
        magicToken: 'camila-token-123',
      },
    });

    const seller = await createSeller({
      name: 'Camila Pitanga',
      customerId: customer.id,
    });

    expect(seller.customerId).toBe(customer.id);
    expect(seller.name).toBe('Camila Pitanga');

    const all = await getAllSellers();
    expect(all.length).toBe(1);
    expect(all[0].customer?.name).toBe('Camila Pitanga');
  });

  it('deve retornar apenas vendedoras ativas em getActiveSellers()', async () => {
    const s1 = await createSeller({ name: 'Vendedora Ativa' });
    const s2 = await createSeller({ name: 'Vendedora Inativa' });

    await updateSeller(s2.id, { active: false });

    const activeList = await getActiveSellers();
    expect(activeList.length).toBe(1);
    expect(activeList[0].id).toBe(s1.id);
    expect(activeList[0].name).toBe('Vendedora Ativa');
  });

  it('deve atualizar dados e alternar status de ativação da vendedora', async () => {
    const seller = await createSeller({ name: 'Juliana Paes' });

    const updated = await updateSeller(seller.id, {
      name: 'Juliana Paes Modificada',
      active: false,
    });

    expect(updated.name).toBe('Juliana Paes Modificada');
    expect(updated.active).toBe(false);
  });

  it('deve excluir a vendedora mantendo a cliente vinculada intacta', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Cliente Segura',
        phone: '11955554444',
        magicToken: 'token-seguro-123',
      },
    });

    const seller = await createSeller({
      name: 'Vendedora Deletável',
      customerId: customer.id,
    });

    await deleteSeller(seller.id);

    const sellers = await getAllSellers();
    expect(sellers.length).toBe(0);

    const customerStillExists = await prisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(customerStillExists).not.toBeNull();
    expect(customerStillExists?.name).toBe('Cliente Segura');
  });
});
