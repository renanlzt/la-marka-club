# La Marka Club Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a plataforma completa do La Marka Club (Next.js full-stack), englobando a carteira digital da cliente (`/c/:token`), o terminal de atendimento rápido no caixa (`/balcao`), o painel gerencial da Dieizy (`/admin`), o motor de cashback FIFO e o sistema de mensagens para WhatsApp.

**Architecture:** Monolito full-stack em Next.js (App Router) com TypeScript, Tailwind CSS, Prisma ORM e SQLite/PostgreSQL. A lógica contábil de cashback é desacoplada em um motor transacional FIFO isolado (`src/lib/fifo-engine.ts`) com testes unitários rigorosos.

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Prisma ORM, SQLite / PostgreSQL, Vitest.

**Spec:** [docs/superpowers/specs/2026-10-03-la-marka-club-design.md](file:///c:/Users/renan/Documents/antigravity/La%20Marka%20Club/docs/superpowers/specs/2026-10-03-la-marka-club-design.md)

## Global Constraints

- Gestora oficial do projeto: Dieizy.
- Identidade visual elegante e feminina, alinhada à marca La Marka.
- Acesso da cliente estritamente via Magic Link seguro com alta entropia (`/c/:token`), sem exigir senha nem download de app.
- Cadastro ágil no balcão em até 10 segundos com campos mínimos (Nome, Telefone, Aniversário; CPF opcional).
- Cálculo de cashback baseado no valor líquido pago da compra com taxa padrão de 5% e validade padrão de 45 dias (configuráveis).
- Consumo de saldo estritamente FIFO (debitar primeiro os lotes mais próximos de expirar).
- Mensagens de WhatsApp personalizáveis com fallback padrão elegante.
- Conciliação independente de vendas para auditoria sem travar o caixa.

## Review Focus

- Resgate parcial com múltiplos lotes de crédito com vencimentos diferentes consumidos na ordem exata de vencimento (FIFO).
- Tentativa de resgate com valor superior ao saldo disponível (deve rejeitar e não permitir saldo negativo).
- Expiração de lotes parciais (somente o saldo remanescente do lote expira, gerando evento `EXPIRE`).
- Compra com aplicação simultânea de resgate de cashback e nova concessão de cashback sobre o saldo líquido pago.
- Substituição de tags no formatador de WhatsApp quando campos opcionais estiverem ausentes.

---

### Task 1: Scaffolding do Projeto, Configuração do Vitest e UI Base

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: Ambiente Next.js funcional com suporte a TypeScript, Tailwind e suíte de testes Vitest.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Setup & Environment', () => {
  it('should verify test runner works', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/setup.test.ts`  
Expected: FAIL (vitest not yet installed/configured)

- [ ] **Step 3: Initialize Next.js project with Tailwind, Vitest and Lucide React**

Configure `package.json` with scripts (`dev`, `build`, `test`), install dependencies (`next`, `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`, `nanoid`, `prisma`, `@prisma/client`, `vitest`), and setup `vitest.config.ts` and `tailwind.config.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/setup.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts src/ tests/
git commit -m "chore: scaffold Next.js project with Tailwind CSS and Vitest"
```

---

### Task 2: Modelagem Prisma e Inicialização do Banco de Dados

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `prisma/seed.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: Configuração do Prisma ORM.
- Produces: `prisma` client tipado em `src/lib/db.ts` exportando os modelos `Customer`, `CashbackCredit`, `CashbackTransaction`, `Campaign`, `StoreSetting`, `MessageTemplate` e `SalesReconciliation`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/db.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';

describe('Database Connection & Seed Models', () => {
  it('should find store default settings', async () => {
    const settings = await prisma.storeSetting.findUnique({ where: { id: 'default' } });
    expect(settings?.storeName).toBe('La Marka');
    expect(settings?.defaultCashbackPercentage).toBe(5.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db.test.ts`  
Expected: FAIL (`src/lib/db` not defined or database not migrated)

- [ ] **Step 3: Implement `prisma/schema.prisma`, run migration and implement `src/lib/db.ts` and `prisma/seed.ts`**

Generate SQLite schema with all entities from the design spec, run `npx prisma db push`, and seed default settings and default message templates.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/db.ts tests/db.test.ts
git commit -m "feat(db): setup Prisma schema, migrations and initial seed"
```

---

### Task 3: Motor de Cashback FIFO e Ledger Transacional (`src/lib/fifo-engine.ts`)

**Files:**
- Create: `src/lib/fifo-engine.ts`
- Test: `tests/fifo-engine.test.ts`

**Interfaces:**
- Consumes: `prisma` de `src/lib/db.ts`.
- Produces:
  - `grantCashback(customerId: string, purchaseAmount: number, operatorName?: string): Promise<{ credit: CashbackCredit, transaction: CashbackTransaction }>`
  - `redeemCashback(customerId: string, redeemAmount: number, operatorName?: string): Promise<{ redeemed: number, newBalance: number }>`
  - `getCustomerBalance(customerId: string): Promise<{ availableBalance: number, expiringAmount: number, expiringInDays: number | null, nextExpirationDate: Date | null }>`
  - `expireOutdatedCredits(): Promise<number>`
  - `grantBirthdayGift(customerId: string, amount: number, validityDays: number): Promise<CashbackCredit>`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/fifo-engine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { grantCashback, redeemCashback, getCustomerBalance, expireOutdatedCredits } from '../src/lib/fifo-engine';
import { prisma } from '../src/lib/db';

describe('FIFO Cashback Engine', () => {
  it('should grant cashback and consume oldest batch first on redeem', async () => {
    // Implement unit test exercising grant 15.00, grant 20.00, redeem 20.00, check balance is 15.00
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/fifo-engine.test.ts`  
Expected: FAIL (`grantCashback` not implemented)

- [ ] **Step 3: Implement FIFO algorithms and ledger in `src/lib/fifo-engine.ts`**

Implement FIFO batch consumption, balance calculation, transactional atomic updates (`prisma.$transaction`), and expiration handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/fifo-engine.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/fifo-engine.ts tests/fifo-engine.test.ts
git commit -m "feat(engine): implement transactional FIFO cashback ledger"
```

---

### Task 4: Formatador de Mensagens e Templates de WhatsApp (`src/lib/whatsapp.ts`)

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `tests/whatsapp.test.ts`

**Interfaces:**
- Consumes: Dados de clientes e transações.
- Produces:
  - `formatWhatsAppMessage(type: string, data: MessageVariables): Promise<string>`
  - `generateWhatsAppLink(phone: string, text: string): string`
  - `DEFAULT_TEMPLATES: Record<string, string>`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/whatsapp.test.ts
import { describe, it, expect } from 'vitest';
import { formatWhatsAppMessage, generateWhatsAppLink } from '../src/lib/whatsapp';

describe('WhatsApp Message Formatter', () => {
  it('should replace dynamic variables with fallback template', async () => {
    const text = await formatWhatsAppMessage('EARN_PURCHASE', {
      primeiro_nome: 'Mariana',
      cashback_ganho: 'R$ 15,00',
      saldo_total: 'R$ 37,00',
      link_carteira: 'https://club.lamarka.com.br/c/tk_123',
    });
    expect(text).toContain('Mariana');
    expect(text).toContain('R$ 15,00');
    expect(text).toContain('https://club.lamarka.com.br/c/tk_123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/whatsapp.test.ts`  
Expected: FAIL (`formatWhatsAppMessage` not implemented)

- [ ] **Step 3: Implement `src/lib/whatsapp.ts` with template replacement, fallback and `wa.me` generator**

Implement template interpolation replacing `{primeiro_nome}`, `{valor_compra}`, `{cashback_ganho}`, `{saldo_total}`, `{validade}`, `{link_carteira}` with default fallback text.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/whatsapp.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts tests/whatsapp.test.ts
git commit -m "feat(whatsapp): implement template generator with fallback and wa.me links"
```

---

### Task 5: Carteira Digital da Cliente (`/c/:token`)

**Files:**
- Create: `src/app/c/[token]/page.tsx`
- Create: `src/components/carteira/WalletHeader.tsx`, `src/components/carteira/BalanceCard.tsx`, `src/components/carteira/ExpirationBadge.tsx`, `src/components/carteira/TransactionHistory.tsx`
- Test: `tests/wallet-view.test.ts`

**Interfaces:**
- Consumes: `getCustomerBalance`, `magicToken` from `Customer` e histórico de transações.
- Produces: Página da cliente responsiva mobile-first com extrato transparente e dados pessoais ofuscados.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/wallet-view.test.ts
import { describe, it, expect } from 'vitest';
// Test ensuring token resolver returns correct masked customer and balance
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wallet-view.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `/c/[token]` and wallet UI components**

Build luxury aesthetic matching La Marka's branding, showing available balance, expiration urgency warning, and styled timeline of transactions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wallet-view.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/c/[token]/ src/components/carteira/ tests/wallet-view.test.ts
git commit -m "feat(wallet): build public customer digital wallet interface"
```

---

### Task 6: Terminal de Balcão / Caixa Rápido (`/balcao`)

**Files:**
- Create: `src/app/balcao/page.tsx`
- Create: `src/components/balcao/CustomerSearch.tsx`, `src/components/balcao/QuickRegisterModal.tsx`, `src/components/balcao/SaleForm.tsx`, `src/components/balcao/RewardSuccessModal.tsx`
- Create: `src/app/api/balcao/route.ts`
- Test: `tests/counter-flow.test.ts`

**Interfaces:**
- Consumes: `src/lib/fifo-engine.ts`, `src/lib/whatsapp.ts`.
- Produces: Interface de 10 segundos para atendentes registrarem vendas, aplicarem resgates e gerarem link de WhatsApp em 1 clique.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/counter-flow.test.ts
import { describe, it, expect } from 'vitest';
// Test verifying counter API: search customer, register sale, return earned cashback and WhatsApp payload
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/counter-flow.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `/balcao` UI and API route**

Include real-time phone/name search, express registration (name, phone, birthdate), purchase input, redemption toggle, instant celebration modal ("Você ganhou R$ 15,00!"), and WhatsApp preview & launch button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/counter-flow.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/balcao/ src/components/balcao/ src/app/api/balcao/ tests/counter-flow.test.ts
git commit -m "feat(counter): build high-speed checkout and reward terminal"
```

---

### Task 7: Painel Gerencial da Dieizy e Configurações (`/admin/dashboard`, `/admin/configuracoes`)

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/admin/configuracoes/page.tsx`
- Create: `src/components/admin/StatsCards.tsx`, `src/components/admin/TemplateEditor.tsx`, `src/components/admin/SettingsForm.tsx`
- Create: `src/app/api/admin/settings/route.ts`
- Test: `tests/admin-settings.test.ts`

**Interfaces:**
- Consumes: `StoreSetting`, `MessageTemplate`, agregadores de vendas e retorno.
- Produces: Dashboard com taxa de retorno de clientes e tela de configuração de regras e editor de templates com fallback.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/admin-settings.test.ts
import { describe, it, expect } from 'vitest';
// Test verifying settings update and message template save with reset to default
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/admin-settings.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Admin Dashboard and Settings interface**

Implement KPI metrics cards (total clients, cashback in circulation, repeat-purchase rate), settings form (percentage, expiration days, birthday bonus), and interactive WhatsApp template editor with dynamic tag buttons and reset button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/admin-settings.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/ src/components/admin/ src/app/api/admin/ tests/admin-settings.test.ts
git commit -m "feat(admin): build management dashboard, settings and template editor"
```

---

### Task 8: Gestão de Campanhas, Aniversários e Ajustes Manuais (`/admin/campanhas`, `/admin/aniversarios`, `/admin/ajustes`)

**Files:**
- Create: `src/app/admin/campanhas/page.tsx`, `src/app/admin/aniversarios/page.tsx`, `src/app/admin/ajustes/page.tsx`
- Create: `src/components/admin/CampaignModal.tsx`, `src/components/admin/BirthdayList.tsx`, `src/components/admin/ManualAdjustModal.tsx`
- Create: `src/app/api/admin/campanhas/route.ts`, `src/app/api/admin/aniversarios/route.ts`, `src/app/api/admin/ajustes/route.ts`
- Test: `tests/campaigns-and-adjustments.test.ts`

**Interfaces:**
- Consumes: `Campaign`, `Customer`, `fifo-engine.ts`.
- Produces: CRUD de campanhas promocionais ativas no cálculo, lista de aniversariantes da semana com disparo de parabéns, e ferramenta de auditoria de ajuste manual com justificativa obrigatória.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/campaigns-and-adjustments.test.ts
import { describe, it, expect } from 'vitest';
// Test creating double-cashback campaign and applying it to sale calculation, and manual adjustment with reason
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/campaigns-and-adjustments.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Campaign, Birthday and Adjustments management**

Connect campaign multiplier to calculation engine, list upcoming birthdays with WhatsApp action, and provide adjustment form enforcing operator name and reason.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/campaigns-and-adjustments.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/campanhas/ src/app/admin/aniversarios/ src/app/admin/ajustes/ tests/campaigns-and-adjustments.test.ts
git commit -m "feat(admin): build campaigns, birthdays and manual balance adjustments"
```

---

### Task 9: Módulo de Conciliação Independente de Vendas (`/admin/conciliacao`)

**Files:**
- Create: `src/lib/reconciliation.ts`
- Create: `src/app/admin/conciliacao/page.tsx`
- Create: `src/components/admin/ReconciliationUploader.tsx`, `src/components/admin/ReconciliationTable.tsx`
- Create: `src/app/api/admin/conciliacao/route.ts`
- Test: `tests/reconciliation.test.ts`

**Interfaces:**
- Consumes: Arquivos CSV / texto colado de relatórios de vendas do PDV comercial e registros do `CashbackTransaction`.
- Produces: Cruzamento automatizado com badges de status ("Conciliado", "Não Lançado no Clube", "Lançado Apenas no Clube") e ação de crédito retroativo com 1 clique.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/reconciliation.test.ts
import { describe, it, expect } from 'vitest';
import { matchSalesWithClub } from '../src/lib/reconciliation';

describe('Sales Reconciliation Matcher', () => {
  it('should identify matched sales and unmatched fiscal sales', () => {
    // Test reconciliation algorithm
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/reconciliation.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement CSV parser and reconciliation matcher in `src/lib/reconciliation.ts` and UI**

Build file drag-and-drop / paste box, match by value/date/phone, and display table with audit badges and manual credit action.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/reconciliation.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/reconciliation.ts src/app/admin/conciliacao/ src/components/admin/Reconciliation* tests/reconciliation.test.ts
git commit -m "feat(reconciliation): implement independent sales audit and matcher module"
```

---

### Task 10: Teste de Integração de Ponta a Ponta, PWA Manifest e Polimento Visual

**Files:**
- Create: `public/manifest.json`, `src/app/manifest.ts`
- Modify: `src/app/layout.tsx`
- Test: `tests/e2e-workflow.test.ts`

**Interfaces:**
- Consumes: Todas as interfaces e motores.
- Produces: Aplicação 100% integrada, pronta para PWA e testada de ponta a ponta.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/e2e-workflow.test.ts
import { describe, it, expect } from 'vitest';

describe('E2E Full Lifecycle Flow', () => {
  it('should execute full cycle: register -> earn -> check wallet -> redeem -> statement audit', async () => {
    // End-to-end integration test
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/e2e-workflow.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement complete lifecycle test, setup PWA manifest and finalize responsive polish**

Tie all components together, add PWA manifest for desktop/tablet installation, refine typography and colors.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/e2e-workflow.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json src/app/manifest.ts tests/e2e-workflow.test.ts
git commit -m "feat: complete end-to-end lifecycle verification and PWA setup"
```
