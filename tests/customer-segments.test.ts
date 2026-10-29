import { describe, it, expect, beforeEach } from 'vitest';
import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/db';
import {
  formatBRL,
  calculateDaysInactive,
  isInactiveCustomer,
  isExpiringCustomer,
  getUpcomingBirthdayDays,
  isBirthdayInUpcomingDays,
  isTopTierCustomer,
  formatSegmentWhatsAppMessage,
  generateSegmentWhatsAppUrl,
  getCustomerSegments,
  getCustomerSegmentCounts,
  CustomerSegmentType,
} from '../src/lib/customer-service';
import { GET as getSegmentsRoute } from '../src/app/api/admin/clientes/segmentos/route';

describe('Smart Customer Segments & Retention Engine', () => {
  const refDate = new Date('2026-10-29T12:00:00Z');

  describe('1. Regras de Segmentação de Inatividade (INACTIVE_45D)', () => {
    it('deve calcular corretamente os dias inativos a partir da última compra', () => {
      const lastPurchase = new Date('2026-09-01T12:00:00Z'); // 58 dias antes de 2026-10-29
      const createdAt = new Date('2026-08-01T12:00:00Z');
      const days = calculateDaysInactive(lastPurchase, createdAt, refDate);
      expect(days).toBe(58);
    });

    it('deve calcular dias inativos a partir do cadastro se nunca comprou', () => {
      const createdAt = new Date('2026-09-14T12:00:00Z'); // 45 dias antes de 2026-10-29
      const days = calculateDaysInactive(null, createdAt, refDate);
      expect(days).toBe(45);
    });

    it('deve classificar como inativa cliente com compra há mais de 45 dias', () => {
      const purchase50DaysAgo = new Date(refDate.getTime() - 50 * 24 * 60 * 60 * 1000);
      const isInactive = isInactiveCustomer(purchase50DaysAgo, new Date('2026-01-01'), 45, refDate);
      expect(isInactive).toBe(true);
    });

    it('NÃO deve classificar como inativa cliente que comprou recentemente (10 dias)', () => {
      const purchase10DaysAgo = new Date(refDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const isInactive = isInactiveCustomer(purchase10DaysAgo, new Date('2026-01-01'), 45, refDate);
      expect(isInactive).toBe(false);
    });

    it('deve classificar cliente cadastrada há 60 dias sem compras como inativa', () => {
      const created60DaysAgo = new Date(refDate.getTime() - 60 * 24 * 60 * 60 * 1000);
      const isInactive = isInactiveCustomer(null, created60DaysAgo, 45, refDate);
      expect(isInactive).toBe(true);
    });

    it('NÃO deve classificar cliente recém-cadastrada (5 dias) sem compras como inativa', () => {
      const created5DaysAgo = new Date(refDate.getTime() - 5 * 24 * 60 * 60 * 1000);
      const isInactive = isInactiveCustomer(null, created5DaysAgo, 45, refDate);
      expect(isInactive).toBe(false);
    });
  });

  describe('2. Regras de Saldo Prestes a Expirar (EXPIRING_15D)', () => {
    it('deve identificar cliente com saldo ativo prestes a vencer em 5 dias', () => {
      const balanceInfo = {
        availableBalance: 45.0,
        expiringInDays: 5,
        expiringAmount: 45.0,
      };
      expect(isExpiringCustomer(balanceInfo, 15)).toBe(true);
    });

    it('deve identificar cliente com saldo no limite de 15 dias', () => {
      const balanceInfo = {
        availableBalance: 20.0,
        expiringInDays: 15,
        expiringAmount: 20.0,
      };
      expect(isExpiringCustomer(balanceInfo, 15)).toBe(true);
    });

    it('NÃO deve identificar cliente cujo saldo vence apenas após 15 dias (ex: 20 dias)', () => {
      const balanceInfo = {
        availableBalance: 100.0,
        expiringInDays: 20,
        expiringAmount: 50.0,
      };
      expect(isExpiringCustomer(balanceInfo, 15)).toBe(false);
    });

    it('NÃO deve identificar cliente que possui expiringInDays mas saldo zerado (0.00)', () => {
      const balanceInfo = {
        availableBalance: 0,
        expiringInDays: 3,
        expiringAmount: 0,
      };
      expect(isExpiringCustomer(balanceInfo, 15)).toBe(false);
    });

    it('NÃO deve identificar cliente sem créditos prestes a vencer (expiringInDays = null)', () => {
      const balanceInfo = {
        availableBalance: 50.0,
        expiringInDays: null,
      };
      expect(isExpiringCustomer(balanceInfo, 15)).toBe(false);
    });
  });

  describe('3. Regras de Aniversariantes da Semana (BIRTHDAYS_WEEK)', () => {
    // refDate é 2026-10-29 (Outubro = mês 10, dia 29)
    it('deve identificar aniversariante de hoje (dia 29/10)', () => {
      expect(isBirthdayInUpcomingDays(29, 10, 7, refDate)).toBe(true);
    });

    it('deve identificar aniversariante daqui a 2 dias (dia 31/10)', () => {
      expect(isBirthdayInUpcomingDays(31, 10, 7, refDate)).toBe(true);
    });

    it('deve identificar aniversariante daqui a 5 dias com virada de mês (03/11)', () => {
      // 29/10 + 5 dias = 03/11
      expect(isBirthdayInUpcomingDays(3, 11, 7, refDate)).toBe(true);
    });

    it('deve identificar aniversariante no limite de 7 dias (05/11)', () => {
      // 29/10 + 7 dias = 05/11
      expect(isBirthdayInUpcomingDays(5, 11, 7, refDate)).toBe(true);
    });

    it('NÃO deve identificar cliente cujo aniversário é após a janela de 7 dias (ex: 06/11)', () => {
      expect(isBirthdayInUpcomingDays(6, 11, 7, refDate)).toBe(false);
    });

    it('NÃO deve identificar aniversariante de ontem (dia 28/10)', () => {
      expect(isBirthdayInUpcomingDays(28, 10, 7, refDate)).toBe(false);
    });

    it('deve retornar false quando dia ou mês forem nulos', () => {
      expect(isBirthdayInUpcomingDays(null, 10, 7, refDate)).toBe(false);
      expect(isBirthdayInUpcomingDays(29, null, 7, refDate)).toBe(false);
      expect(isBirthdayInUpcomingDays(null, null, 7, refDate)).toBe(false);
    });

    it('deve gerenciar corretamente a virada de ano em dezembro', () => {
      const yearEndDate = new Date('2026-12-30T10:00:00Z');
      // Próximos 7 dias incluem 30/12, 31/12, 01/01, 02/01, 03/01, 04/01, 05/01, 06/01
      expect(isBirthdayInUpcomingDays(1, 1, 7, yearEndDate)).toBe(true);
      expect(isBirthdayInUpcomingDays(5, 1, 7, yearEndDate)).toBe(true);
      expect(isBirthdayInUpcomingDays(7, 1, 7, yearEndDate)).toBe(false);
    });
  });

  describe('4. Regras de Clientes VIP / Fidelidade (TOP_TIER)', () => {
    it('deve classificar cliente com 2 ou mais compras como TOP_TIER', () => {
      expect(isTopTierCustomer({ totalEarned: 25.0, totalPurchases: 2 })).toBe(true);
      expect(isTopTierCustomer({ totalEarned: 80.0, totalPurchases: 5 })).toBe(true);
    });

    it('deve classificar cliente com alto volume acumulado (>= R$ 100 cashback) como TOP_TIER', () => {
      expect(isTopTierCustomer({ totalEarned: 150.0, totalPurchases: 1 })).toBe(true);
    });

    it('NÃO deve classificar cliente novato com apenas 1 compra pequena como TOP_TIER', () => {
      expect(isTopTierCustomer({ totalEarned: 15.0, totalPurchases: 1 })).toBe(false);
      expect(isTopTierCustomer({ totalEarned: 0, totalPurchases: 0 })).toBe(false);
    });
  });

  describe('5. Formatação de Mensagens Contextualizadas de WhatsApp', () => {
    const customerMock = {
      name: 'Camila Alcantara',
      firstName: 'Camila',
      availableBalance: 35.5,
      expiringAmount: 35.5,
      expiringInDays: 5,
      magicToken: 'tk_test_camila_123',
    };

    it('deve gerar mensagem contextualizada exata para clientes inativas (INACTIVE_45D)', () => {
      const msg = formatSegmentWhatsAppMessage('INACTIVE_45D', customerMock);

      // Validação da mensagem exigida na especificação
      expect(msg).toContain(
        'Olá, Camila! Sentimos sua falta aqui na La Marka... você tem R$ 35,50 de saldo esperando por você!'
      );
      expect(msg).toContain('https://lamarka.com.br/c/tk_test_camila_123');
    });

    it('deve gerar mensagem contextualizada exata para clientes com cashback vencendo (EXPIRING_15D)', () => {
      const msg = formatSegmentWhatsAppMessage('EXPIRING_15D', customerMock);

      // Validação da mensagem exigida na especificação
      expect(msg).toContain(
        'Olá, Camila! Seu cashback de R$ 35,50 expira em breve...'
      );
      expect(msg).toContain('em 5 dias');
      expect(msg).toContain('Não deixe seu saldo expirar!');
      expect(msg).toContain('https://lamarka.com.br/c/tk_test_camila_123');
    });

    it('deve gerar mensagem carinhosa para aniversariantes da semana (BIRTHDAYS_WEEK)', () => {
      const msg = formatSegmentWhatsAppMessage('BIRTHDAYS_WEEK', customerMock);

      expect(msg).toContain('Olá, Camila! Parabéns pelo seu aniversário nesta semana!');
      expect(msg).toContain('R$ 35,50 de saldo especial');
    });

    it('deve gerar mensagem de prestígio para clientes VIP (TOP_TIER)', () => {
      const msg = formatSegmentWhatsAppMessage('TOP_TIER', customerMock);

      expect(msg).toContain('Olá, Camila! Como uma de nossas clientes VIP mais especiais da La Marka');
      expect(msg).toContain('R$ 35,50');
    });

    it('deve gerar URL do WhatsApp com DDI 55 e encode correto', () => {
      const url = generateSegmentWhatsAppUrl('INACTIVE_45D', {
        ...customerMock,
        phone: '(49) 99876-5432',
      });

      expect(url.startsWith('https://wa.me/5549998765432?text=')).toBe(true);
      expect(url).toContain(encodeURIComponent('Sentimos sua falta aqui na La Marka'));
    });
  });

  describe('6. Integração com Banco de Dados e Endpoint de Segmentos', () => {
    let inactiveCustId: string;
    let expiringCustId: string;
    let birthdayCustId: string;
    let topTierCustId: string;

    beforeEach(async () => {
      // 1. Cliente Inativa: criada há 60 dias, com compra realizada há 55 dias
      const inactiveCust = await prisma.customer.create({
        data: {
          name: 'Renata Inativa',
          phone: `1198${Math.floor(1000000 + Math.random() * 9000000)}`,
          magicToken: `tk_${nanoid(20)}`,
          createdAt: new Date(refDate.getTime() - 60 * 24 * 60 * 60 * 1000),
        },
      });
      inactiveCustId = inactiveCust.id;

      // Compra há 55 dias
      await prisma.cashbackCredit.create({
        data: {
          customerId: inactiveCustId,
          initialAmount: 25.0,
          currentBalance: 25.0,
          expiresAt: new Date(refDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          origin: 'PURCHASE',
          purchaseValue: 500.0,
          createdAt: new Date(refDate.getTime() - 55 * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.cashbackTransaction.create({
        data: {
          customerId: inactiveCustId,
          type: 'EARN',
          amount: 25.0,
          balanceAfter: 25.0,
          description: 'Compra antiga',
          createdAt: new Date(refDate.getTime() - 55 * 24 * 60 * 60 * 1000),
        },
      });

      // 2. Cliente Vencendo em 15d: crédito ativo com expiração em 7 dias
      const expiringCust = await prisma.customer.create({
        data: {
          name: 'Beatriz Vencendo',
          phone: `1197${Math.floor(1000000 + Math.random() * 9000000)}`,
          magicToken: `tk_${nanoid(20)}`,
          createdAt: new Date(refDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      });
      expiringCustId = expiringCust.id;

      await prisma.cashbackCredit.create({
        data: {
          customerId: expiringCustId,
          initialAmount: 50.0,
          currentBalance: 50.0,
          expiresAt: new Date(refDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          origin: 'PURCHASE',
          purchaseValue: 1000.0,
          createdAt: new Date(refDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.cashbackTransaction.create({
        data: {
          customerId: expiringCustId,
          type: 'EARN',
          amount: 50.0,
          balanceAfter: 50.0,
          description: 'Compra recente',
          createdAt: new Date(refDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      });

      // 3. Cliente Aniversariante da Semana: aniversário em 31/10 (2 dias após 29/10)
      const birthdayCust = await prisma.customer.create({
        data: {
          name: 'Luciana Aniversariante',
          phone: `1196${Math.floor(1000000 + Math.random() * 9000000)}`,
          birthDay: 31,
          birthMonth: 10,
          magicToken: `tk_${nanoid(20)}`,
          createdAt: new Date(refDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      });
      birthdayCustId = birthdayCust.id;

      // 4. Cliente Top Tier: 3 compras realizadas
      const topTierCust = await prisma.customer.create({
        data: {
          name: 'Fernanda VIP Top Tier',
          phone: `1195${Math.floor(1000000 + Math.random() * 9000000)}`,
          magicToken: `tk_${nanoid(20)}`,
          createdAt: new Date(refDate.getTime() - 20 * 24 * 60 * 60 * 1000),
        },
      });
      topTierCustId = topTierCust.id;

      for (let i = 1; i <= 3; i++) {
        await prisma.cashbackTransaction.create({
          data: {
            customerId: topTierCustId,
            type: 'EARN',
            amount: 40.0,
            balanceAfter: 40.0 * i,
            description: `Compra VIP ${i}`,
            createdAt: new Date(refDate.getTime() - (20 - i * 3) * 24 * 60 * 60 * 1000),
          },
        });
      }
    });

    it('deve listar clientes e contagens com getCustomerSegments', async () => {
      const resultInactive = await getCustomerSegments('INACTIVE_45D', refDate);
      expect(resultInactive.counts.INACTIVE_45D).toBeGreaterThanOrEqual(1);
      const foundInactive = resultInactive.customers.find((c) => c.id === inactiveCustId);
      expect(foundInactive).toBeDefined();
      expect(foundInactive?.name).toBe('Renata Inativa');
      expect(foundInactive?.segmentContext.suggestedWhatsAppMessage).toContain(
        'Sentimos sua falta aqui na La Marka'
      );

      const resultExpiring = await getCustomerSegments('EXPIRING_15D', refDate);
      expect(resultExpiring.counts.EXPIRING_15D).toBeGreaterThanOrEqual(1);
      const foundExpiring = resultExpiring.customers.find((c) => c.id === expiringCustId);
      expect(foundExpiring).toBeDefined();
      expect(foundExpiring?.name).toBe('Beatriz Vencendo');
      expect(foundExpiring?.segmentContext.suggestedWhatsAppMessage).toContain(
        'expira em breve'
      );

      const resultBirthday = await getCustomerSegments('BIRTHDAYS_WEEK', refDate);
      expect(resultBirthday.counts.BIRTHDAYS_WEEK).toBeGreaterThanOrEqual(1);
      const foundBirthday = resultBirthday.customers.find((c) => c.id === birthdayCustId);
      expect(foundBirthday).toBeDefined();
      expect(foundBirthday?.name).toBe('Luciana Aniversariante');

      const resultTop = await getCustomerSegments('TOP_TIER', refDate);
      expect(resultTop.counts.TOP_TIER).toBeGreaterThanOrEqual(1);
      const foundTop = resultTop.customers.find((c) => c.id === topTierCustId);
      expect(foundTop).toBeDefined();
      expect(foundTop?.name).toBe('Fernanda VIP Top Tier');
    });

    it('deve responder via rota de API GET /api/admin/clientes/segmentos com query type', async () => {
      // Teste com ?type=INACTIVE_45D
      const reqInactive = new NextRequest('http://localhost:3000/api/admin/clientes/segmentos?type=INACTIVE_45D');
      const resInactive = await getSegmentsRoute(reqInactive);
      const dataInactive = await resInactive.json();

      expect(resInactive.status).toBe(200);
      expect(dataInactive.success).toBe(true);
      expect(dataInactive.segment).toBe('INACTIVE_45D');
      expect(dataInactive.count).toBeGreaterThanOrEqual(1);
      expect(dataInactive.counts).toBeDefined();
      expect(typeof dataInactive.counts.INACTIVE_45D).toBe('number');

      // Teste com ?type=EXPIRING_15D
      const reqExpiring = new NextRequest('http://localhost:3000/api/admin/clientes/segmentos?type=EXPIRING_15D');
      const resExpiring = await getSegmentsRoute(reqExpiring);
      const dataExpiring = await resExpiring.json();

      expect(resExpiring.status).toBe(200);
      expect(dataExpiring.segment).toBe('EXPIRING_15D');
      expect(dataExpiring.count).toBeGreaterThanOrEqual(1);

      // Teste sem tipo (retorna contagens de todos os segmentos)
      const reqAll = new NextRequest('http://localhost:3000/api/admin/clientes/segmentos');
      const resAll = await getSegmentsRoute(reqAll);
      const dataAll = await resAll.json();

      expect(resAll.status).toBe(200);
      expect(dataAll.segment).toBe('ALL');
      expect(dataAll.counts.INACTIVE_45D).toBeDefined();
      expect(dataAll.counts.EXPIRING_15D).toBeDefined();
      expect(dataAll.counts.BIRTHDAYS_WEEK).toBeDefined();
      expect(dataAll.counts.TOP_TIER).toBeDefined();

      // Teste com tipo inválido (deve retornar 400 Bad Request)
      const reqInvalid = new NextRequest('http://localhost:3000/api/admin/clientes/segmentos?type=INVALID_SEGMENT');
      const resInvalid = await getSegmentsRoute(reqInvalid);
      const dataInvalid = await resInvalid.json();

      expect(resInvalid.status).toBe(400);
      expect(dataInvalid.error).toContain('Segmento inválido');
    });
  });
});
