import { describe, it, expect, beforeEach } from 'vitest';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/db';
import { lookupCustomerWallet } from '../src/lib/customer-service';
import { POST as postConsultaRoute } from '../src/app/api/consulta/route';

describe('Customer Wallet Multi-Criteria Lookup Engine (/consulta)', () => {
  let customer1Id: string;
  let customer1Token: string;
  let customer1Phone: string;
  let customer1Suffix: string;
  let customer2Id: string;
  let customer2Token: string;
  let customer2Phone: string;
  let customer2Suffix: string;

  beforeEach(async () => {
    // Cria clientes com telefones únicos, sufixos únicos e aniversários específicos
    customer1Token = nanoid(24);
    customer2Token = nanoid(24);
    customer1Phone = `499${Math.floor(10000000 + Math.random() * 89999999)}`;
    customer2Phone = `499${Math.floor(10000000 + Math.random() * 89999999)}`;
    customer1Suffix = nanoid(6).toLowerCase();
    customer2Suffix = nanoid(6).toLowerCase();

    const c1 = await prisma.customer.create({
      data: {
        name: `Cláudia Maria Silveira ${customer1Suffix}`,
        phone: customer1Phone,
        birthDay: 15,
        birthMonth: 5,
        magicToken: customer1Token,
      },
    });
    customer1Id = c1.id;

    const c2 = await prisma.customer.create({
      data: {
        name: `Juliana Ramos ${customer2Suffix}`,
        phone: customer2Phone,
        birthDay: 28,
        birthMonth: 10,
        magicToken: customer2Token,
      },
    });
    customer2Token = c2.magicToken;
    customer2Id = c2.id;
  });

  describe('1. Validação de Mínimo de 2 Critérios', () => {
    it('deve rejeitar consulta se apenas 1 campo for fornecido (somente telefone)', async () => {
      const result = await lookupCustomerWallet({
        phone: customer1Phone,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('pelo menos 2');
    });

    it('deve rejeitar consulta se apenas 1 campo for fornecido (somente nome)', async () => {
      const result = await lookupCustomerWallet({
        name: 'Cláudia',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('pelo menos 2');
    });

    it('deve rejeitar consulta se apenas aniversário for fornecido', async () => {
      const result = await lookupCustomerWallet({
        birthDay: 15,
        birthMonth: 5,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('pelo menos 2');
    });

    it('deve rejeitar se nenhum campo for fornecido', async () => {
      const result = await lookupCustomerWallet({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('pelo menos 2');
    });
  });

  describe('2. Combinações Válidas de 2 e 3 Critérios', () => {
    it('deve localizar com sucesso por Telefone + Aniversário (Dia e Mês)', async () => {
      // Testa telefone com máscara brasileira (49) 9xxxx-xxxx
      const formattedPhone = `(${customer1Phone.slice(0, 2)}) ${customer1Phone.slice(2, 7)}-${customer1Phone.slice(7)}`;
      const result = await lookupCustomerWallet({
        phone: formattedPhone,
        birthDay: 15,
        birthMonth: 5,
      });
      expect(result.success).toBe(true);
      expect(result.magicToken).toBe(customer1Token);
      expect(result.customerName).toContain('Cláudia Maria Silveira');
    });

    it('deve localizar com sucesso por Telefone + Nome (incluindo nome parcial sem acento)', async () => {
      const result = await lookupCustomerWallet({
        phone: customer1Phone,
        name: 'claudia', // sem acento e em minúsculas
      });
      expect(result.success).toBe(true);
      expect(result.magicToken).toBe(customer1Token);
      expect(result.customerName).toContain('Cláudia');
    });

    it('deve localizar com sucesso por Nome Parcial + Aniversário', async () => {
      const result = await lookupCustomerWallet({
        name: customer1Suffix, // parte única do nome da cliente
        birthDay: 15,
        birthMonth: 5,
      });
      expect(result.success).toBe(true);
      expect(result.magicToken).toBe(customer1Token);
    });

    it('deve localizar com sucesso quando os 3 campos forem preenchidos', async () => {
      const result = await lookupCustomerWallet({
        phone: customer2Phone,
        name: 'Juliana',
        birthDay: 28,
        birthMonth: 10,
      });
      expect(result.success).toBe(true);
      expect(result.magicToken).toBe(customer2Token);
      expect(result.customerName).toContain('Juliana Ramos');
    });
  });

  describe('3. Casos de Incompatibilidade e Múltiplos Cadastros', () => {
    it('deve retornar erro amigável se nenhum registro for encontrado', async () => {
      const result = await lookupCustomerWallet({
        phone: '49999990000',
        birthDay: 1,
        birthMonth: 1,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nenhuma carteira foi localizada');
    });

    it('deve retornar erro amigável se o telefone não bater com o aniversário', async () => {
      const result = await lookupCustomerWallet({
        phone: customer1Phone,
        birthDay: 28, // aniversário da cliente 2, mas telefone da cliente 1
        birthMonth: 10,
      });
      expect(result.success).toBe(false);
    });

    it('deve solicitar telefone se encontrar múltiplos cadastros com mesmo nome e aniversário', async () => {
      const sharedName = `Duplicada ${nanoid(6)}`;
      await prisma.customer.createMany({
        data: [
          {
            name: `${sharedName} Silva`,
            phone: `499${Math.floor(10000000 + Math.random() * 89999999)}`,
            birthDay: 12,
            birthMonth: 8,
            magicToken: nanoid(24),
          },
          {
            name: `${sharedName} Santos`,
            phone: `499${Math.floor(10000000 + Math.random() * 89999999)}`,
            birthDay: 12,
            birthMonth: 8,
            magicToken: nanoid(24),
          },
        ],
      });

      const result = await lookupCustomerWallet({
        name: sharedName,
        birthDay: 12,
        birthMonth: 8,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('mais de um cadastro correspondente');
    });
  });

  describe('4. Rota de API POST /api/consulta', () => {
    it('deve retornar 400 se menos de 2 critérios forem enviados', async () => {
      const req = new NextRequest('http://localhost:3000/api/consulta', {
        method: 'POST',
        body: JSON.stringify({
          phone: customer1Phone,
        }),
      });

      const res = await postConsultaRoute(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('pelo menos 2');
    });

    it('deve retornar 200 com redirectUrl e token quando critérios forem atendidos', async () => {
      const formattedPhone = `(${customer2Phone.slice(0, 2)}) ${customer2Phone.slice(2, 7)}-${customer2Phone.slice(7)}`;
      const req = new NextRequest('http://localhost:3000/api/consulta', {
        method: 'POST',
        body: JSON.stringify({
          phone: formattedPhone,
          birthDay: 28,
          birthMonth: 10,
        }),
      });

      const res = await postConsultaRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.magicToken).toBe(customer2Token);
      expect(data.redirectUrl).toBe(`/c/${customer2Token}`);
      expect(data.customerName).toContain('Juliana Ramos');
    });
  });
});
