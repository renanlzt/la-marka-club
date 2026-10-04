import { describe, it, expect, beforeEach } from 'vitest';
import { createSessionToken, verifySessionToken } from '../src/lib/auth';
import { verifySessionTokenEdge, MAX_SESSION_AGE_MS } from '../src/lib/session-verifier';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../src/lib/rate-limiter';
import { grantCashback } from '../src/lib/fifo-engine';
import { processCounterSale } from '../src/lib/counter-service';
import { prisma } from '../src/lib/db';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';

describe('Auditoria e Blindagem de Segurança da Aplicação', () => {
  describe('1. Criptografia de Sessão & Prevenção contra Forjamento de Tokens', () => {
    it('deve validar com sucesso um token gerado legitimamente', async () => {
      const token = createSessionToken('user-123', 'dieizy', 'GESTAO');
      const verified = await verifySessionTokenEdge(token);

      expect(verified).not.toBeNull();
      expect(verified?.adminId).toBe('user-123');
      expect(verified?.username).toBe('dieizy');
      expect(verified?.role).toBe('GESTAO');
    });

    it('deve rejeitar tokens forjados ou com assinatura adulterada (prevenção contra bypass)', async () => {
      const legitToken = createSessionToken('user-123', 'balcao', 'BALCAO');
      // Tenta elevar privilégio para GESTAO adulterando o payload sem conhecer a chave
      const parts = legitToken.split(':');
      parts[2] = 'GESTAO'; // Elevação de privilégio
      const tamperedToken = parts.join(':');

      const result = await verifySessionTokenEdge(tamperedToken);
      expect(result).toBeNull();
    });

    it('deve rejeitar tokens com assinatura inexistente ou forjada', async () => {
      const fakeToken = 'user-999:hacker:GESTAO:1700000000000:deadbeefcafebabedeadbeefcafebabe';
      const result = await verifySessionTokenEdge(fakeToken);
      expect(result).toBeNull();
    });

    it('deve rejeitar sessões expiradas (> 7 dias)', async () => {
      const eightDaysAgo = Date.now() - (MAX_SESSION_AGE_MS + 1000);
      // Cria token com timestamp antigo
      const payload = `user-123:dieizy:GESTAO:${eightDaysAgo}`;
      const crypto = await import('crypto');
      const secret = process.env.SESSION_SECRET || 'la-marka-club-super-secret-key-2026';
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');
      const expiredToken = `${payload}:${signature}`;

      const result = await verifySessionTokenEdge(expiredToken);
      expect(result).toBeNull();
    });
  });

  describe('2. Proteção contra Ataques de Força Bruta (Rate Limiting)', () => {
    const testIp = '192.168.1.100';
    const testKey = `login:${testIp}:admin`;

    beforeEach(() => {
      resetRateLimit(testKey);
    });

    it('deve permitir tentativas legítimas dentro do limite permitido', () => {
      const check = checkRateLimit(testKey, 5);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(5);
    });

    it('deve bloquear após 5 tentativas consecutivas de falha', () => {
      // 5 tentativas incorretas
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testKey);
      }

      const blockedCheck = checkRateLimit(testKey, 5);
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.remaining).toBe(0);
      expect(blockedCheck.resetInSeconds).toBeGreaterThan(0);
    });

    it('deve resetar o contador após autenticação bem-sucedida', () => {
      recordFailedAttempt(testKey);
      recordFailedAttempt(testKey);
      expect(checkRateLimit(testKey, 5).remaining).toBe(3);

      resetRateLimit(testKey);
      expect(checkRateLimit(testKey, 5).remaining).toBe(5);
    });
  });

  describe('3. Blindagem de Cálculos Financeiros (Prevenção de Injeção de Valores Negativos)', () => {
    it('deve rejeitar concessão de cashback com valor zero ou negativo', async () => {
      await expect(grantCashback('cust-123', 0)).rejects.toThrow(
        /valor da compra deve ser um número positivo/i
      );
      await expect(grantCashback('cust-123', -50.0)).rejects.toThrow(
        /valor da compra deve ser um número positivo/i
      );
      await expect(grantCashback('cust-123', NaN)).rejects.toThrow(
        /valor da compra deve ser um número positivo/i
      );
    });

    it('deve rejeitar processCounterSale com valores inválidos', async () => {
      await expect(
        processCounterSale({
          customerId: 'cust-123',
          purchaseAmount: -100,
        })
      ).rejects.toThrow(/valor da compra deve ser um número positivo/i);

      await expect(
        processCounterSale({
          customerId: 'cust-123',
          purchaseAmount: 100,
          redeemAmount: -20,
        })
      ).rejects.toThrow(/valor de resgate não pode ser negativo/i);
    });
  });

  describe('4. Middleware de Segurança (Proteção de Rotas de API e Cabeçalhos)', () => {
    it('deve bloquear requisição desautenticada em rotas de API com status 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'POST',
      });

      const res = await middleware(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.error).toContain('Não autorizado');
    });

    it('deve bloquear usuário BALCAO de acessar APIs restritas de GESTAO com status 403', async () => {
      const balcaoToken = createSessionToken('user-balcao', 'atendente', 'BALCAO');
      const req = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'POST',
        headers: {
          cookie: `admin_session=${balcaoToken}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error).toContain('Acesso negado');
    });

    it('deve redirecionar requisição desautenticada em páginas de UI para /login', async () => {
      const req = new NextRequest('http://localhost:3000/admin/dashboard');

      const res = await middleware(req);
      expect(res.status).toBe(307); // Redirect Next.js
      expect(res.headers.get('location')).toContain('/login');
    });

    it('deve aplicar cabeçalhos de segurança HTTP em todas as respostas', async () => {
      const req = new NextRequest('http://localhost:3000/login');
      const res = await middleware(req);

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('deve bloquear requisições com origem externa fraudulenta (CSRF) com status 403', async () => {
      const adminToken = createSessionToken('user-admin', 'dieizy', 'GESTAO');
      const req = new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'POST',
        headers: {
          cookie: `admin_session=${adminToken}`,
          origin: 'https://site-malicioso-hacker.com',
          host: 'localhost:3000',
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('CSRF');
    });
  });

  describe('5. Prevenção contra XSS e Injeção de Tags (Sanitização de Entradas)', () => {
    it('deve remover tags script e elementos HTML maliciosos de textos e nomes', async () => {
      const { sanitizeText, sanitizeName, sanitizePhone } = await import('../src/lib/sanitize');

      const maliciousText = '<script>alert("hack")</script>Promoção VIP!';
      expect(sanitizeText(maliciousText)).toBe('alert(hack)Promoção VIP!');

      const maliciousHtml = '<img src=x onerror=alert(1)> Maria Clara';
      expect(sanitizeName(maliciousHtml)).toBe('Maria Clara');

      const dirtyPhone = '(49) 99926-6069<script>';
      expect(sanitizePhone(dirtyPhone)).toBe('49999266069');
    });
  });
});
