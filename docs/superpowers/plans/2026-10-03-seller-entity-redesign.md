# Plano de Implementação: Entidade Dedicada de Vendedores & Aba de Gestão

> **Para agentes de execução:** HABILIDADE SUB-REQUERIDA: Use superpowers:subagent-driven-development ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Transformar o conceito de "Vendedora" em uma entidade própria (`Seller`) no banco de dados e criar uma aba dedicada no Painel de Gestão (`/admin/vendedores`), permitindo vincular opcionalmente clientes como vendedoras através de sua chave estrangeira, ao mesmo tempo em que remove o botão avulso de marcar qualquer cliente como vendedora na tela de clientes.

**Arquitetura:** Criação da tabela `Seller` no Prisma com vínculo 1-para-1 opcional com `Customer`. A gestão da equipe de vendas passa a ocorrer exclusivamente na nova aba `/admin/vendedores`, com CRUD completo (cadastro direto ou por importação de cliente, edição e ativação/inativação). A tela de clientes (`/admin/clientes`) é limpa, e o terminal de balcão (`/balcao`) consome as vendedoras ativas da nova tabela `Seller`.

**Tech Stack:** Next.js 15 (App Router), Prisma ORM com SQLite, Tailwind CSS, Lucide Icons, Vitest.

---

## Restrições Globais

1. **Integridade Financeira e FIFO:** Nenhuma alteração nas regras de cashback, expiração de lotes FIFO ou cálculos da carteira.
2. **Terminal de Balcão Inalterado:** O seletor de vendedoras em `/balcao` continua recebendo `{ id, name }`, registrando o nome da vendedora no campo `operatorName` da transação.
3. **Padrão Estético de Luxo:** Todas as novas telas e modais devem seguir a paleta da La Marka (Terracota, Ouro Champanhe, Rosa Seco e Bege Creme), tipografia Cormorant Garamond e Plus Jakarta Sans com sombras suaves.
4. **Testes Contínuos:** Todos os testes automatizados devem permanecer verdes (100% de aprovação).

---

## Foco de Revisão (Review Focus)

1. Vendedora cadastrada avulsa (sem cliente vinculada) funciona normalmente no balcão e registra vendas.
2. Vendedora vinculada a uma cliente existente puxa o nome/telefone da cliente e armazena `customerId`.
3. Vendedora inativada (`active: false`) não deve mais aparecer no menu dropdown do balcão de vendas.
4. Remoção do botão de alternar vendedora na tela `/admin/clientes` sem quebrar o layout, filtros ou testes.
5. Vendedora desvinculada ou excluída não pode causar exclusão em cascata (onDelete: SetNull) da cliente compradora.

---

### Tarefa 1: Modelagem da Entidade `Seller` no Prisma

**Arquivos:**
- Modificar: `prisma/schema.prisma:10-26`
- Modificar: `prisma/schema.prisma:27-36`

**Interfaces:**
- Produz: Modelo `Seller` com campos `id`, `name`, `phone`, `code`, `active`, `customerId`, `createdAt`, `updatedAt`, e relação opcional `customer Customer?`.

- [ ] **Passo 1: Adicionar modelo `Seller` e relação em `Customer` no `prisma/schema.prisma`**
  ```prisma
  model Customer {
    id           String            @id @default(cuid())
    name         String
    phone        String            @unique
    cpf          String?
    birthDay     Int?
    birthMonth   Int?
    magicToken   String            @unique
    notes        String?
    createdAt    DateTime          @default(now())
    updatedAt    DateTime          @updatedAt
    
    seller       Seller?           // Vínculo opcional se esta cliente for vendedora
    credits      CashbackCredit[]
    transactions CashbackTransaction[]
  }

  model Seller {
    id         String    @id @default(cuid())
    name       String
    phone      String?
    code       String?   // Código interno opcional (ex: VEND-01)
    active     Boolean   @default(true)
    customerId String?   @unique
    customer   Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
    createdAt  DateTime  @default(now())
    updatedAt  DateTime  @updatedAt
  }
  ```

- [ ] **Passo 2: Executar migração do banco SQLite e gerar cliente Prisma**
  Run: `npx prisma db push` e `npx prisma generate`
  Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Passo 3: Commit das alterações do schema**
  ```bash
  git add prisma/schema.prisma
  git commit -m "feat(db): add Seller entity with optional customer relation"
  ```

---

### Tarefa 2: Serviços de Backend e Rotas de API para Vendedores

**Arquivos:**
- Modificar: `src/lib/admin-service.ts`
- Criar: `src/app/api/admin/vendedores/route.ts`
- Modificar: `src/app/api/balcao/vendedoras/route.ts`
- Testar: `tests/sellers.test.ts`

**Interfaces:**
- Produz:
  - `getAllSellers(): Promise<SellerWithCustomer[]>`
  - `createSeller(data: { name: string; phone?: string; code?: string; customerId?: string }): Promise<Seller>`
  - `updateSeller(id: string, data: { name?: string; phone?: string; code?: string; active?: boolean; customerId?: string | null }): Promise<Seller>`
  - `deleteSeller(id: string): Promise<void>`
  - `getActiveSellers(): Promise<Array<{ id: string; name: string; phone: string | null }>>`

- [ ] **Passo 1: Escrever teste automatizado para o novo CRUD de Vendedoras**
  Atualizar `tests/sellers.test.ts` com criação direta, criação com cliente vinculada, inativação e listagem no balcão.

- [ ] **Passo 2: Rodar teste para verificar falha inicial**
  Run: `npx vitest run tests/sellers.test.ts`
  Expected: FAIL (funções ainda não adaptadas para a tabela `Seller`).

- [ ] **Passo 3: Implementar funções do serviço em `src/lib/admin-service.ts`**
  Implementar `getAllSellers`, `createSeller`, `updateSeller`, `deleteSeller`, e atualizar `getActiveSellers` para consultar `prisma.seller.findMany({ where: { active: true }, orderBy: { name: 'asc' } })`.

- [ ] **Passo 4: Criar rota de API `/api/admin/vendedores/route.ts`**
  - `GET`: retorna `{ sellers }`
  - `POST`: cria vendedora
  - `PUT`: atualiza dados ou alterna `active`
  - `DELETE`: remove a vendedora

- [ ] **Passo 5: Atualizar rota `/api/balcao/vendedoras/route.ts`**
  Garantir que retorne `{ sellers }` consumindo `getActiveSellers()`.

- [ ] **Passo 6: Rodar testes para verificar aprovação**
  Run: `npx vitest run tests/sellers.test.ts`
  Expected: PASS

- [ ] **Passo 7: Commit**
  ```bash
  git add src/lib/admin-service.ts src/app/api/admin/vendedores/route.ts src/app/api/balcao/vendedoras/route.ts tests/sellers.test.ts
  git commit -m "feat(api): implement dedicated Seller service and management API"
  ```

---

### Tarefa 3: Limpeza da Tela de Clientes (`/admin/clientes`)

**Arquivos:**
- Modificar: `src/app/admin/clientes/page.tsx`
- Remover/Substituir: `src/app/api/admin/clientes/vendedora/route.ts`

**Interfaces:**
- Consumes: `CustomerSummary` sem o botão de alternância de vendedora.

- [ ] **Passo 1: Remover botão de vendedora e filtro exclusivo da tela de clientes**
  - Remover o botão `<button onClick={() => handleToggleSeller...} title="Tornar/Remover Vendedora">` da lista de ações da cliente.
  - Remover o botão de filtro `✨ Vendedoras` da barra de filtros rápidos.
  - Manter apenas uma badge indicativa elegante `✨ Vendedora da Loja` se a cliente estiver vinculada a um registro de vendedora ativo.

- [ ] **Passo 2: Verificar comportamento e compilação**
  Run: `npx vitest run tests/admin-customers.test.ts`
  Expected: PASS

- [ ] **Passo 3: Commit**
  ```bash
  git add src/app/admin/clientes/page.tsx
  git commit -m "refactor(admin): remove seller toggle button from customer list"
  ```

---

### Tarefa 4: Criação da Aba e Interface de Gestão de Vendedoras (`/admin/vendedores`)

**Arquivos:**
- Modificar: `src/components/admin/AdminSidebar.tsx`
- Criar: `src/app/admin/vendedores/page.tsx`
- Modificar: `src/components/balcao/SaleForm.tsx` (link para gerenciar vendedoras apontando para `/admin/vendedores`)

**Interfaces:**
- Produz: Nova página `/admin/vendedores` no Painel de Gestão com listagem, busca, modal de cadastro e modal de edição.

- [ ] **Passo 1: Adicionar item de navegação no `AdminSidebar.tsx`**
  Adicionar rota `/admin/vendedores` no menu com o ícone `UserCheck` e label "Vendedoras & Equipe".

- [ ] **Passo 2: Construir a página `/admin/vendedores/page.tsx`**
  - Cabeçalho de alta costura com badge "Equipe & Atendimento" e título "Vendedoras da Loja".
  - Cards de métricas rápidas: Total de Vendedoras, Vendedoras Ativas, Vendedoras Vinculadas a Clientes.
  - Botão "+ Nova Vendedora":
    - Abre modal elegante permitindo cadastrar o Nome e Telefone diretamente, OU selecionar uma cliente cadastrada em um dropdown/busca com autopreenchimento e vínculo.
  - Tabela/Cards das vendedoras:
    - Nome, telefone, status ativo/inativo (badge verde/cinza), indicação se é cliente da loja com link para a carteira.
    - Ações por linha: Alternar Ativa/Inativa (toggle rápido), Editar dados, Desvincular cliente.

- [ ] **Passo 3: Atualizar link do Balcão de Vendas**
  Em `src/components/balcao/SaleForm.tsx`, atualizar o link `"Gerenciar vendedoras"` para direcionar para `/admin/vendedores`.

- [ ] **Passo 4: Commit**
  ```bash
  git add src/components/admin/AdminSidebar.tsx src/app/admin/vendedores/page.tsx src/components/balcao/SaleForm.tsx
  git commit -m "feat(admin): create dedicated Vendedoras management view and navigation"
  ```

---

### Tarefa 5: Preparação para Publicação em Nuvem (Vercel + Turso / Zero Cold-Start)

**Arquivos:**
- Modificar: `src/lib/db.ts`
- Modificar: `src/lib/counter-service.ts:165-170`
- Modificar: `.env` e `.env.example`
- Modificar: `package.json`

**Interfaces:**
- Produz: Suporte híbrido transparente para SQLite local (desenvolvimento) e Turso LibSQL (nuvem/produção), além de resolução automática de URLs públicas da Vercel (`VERCEL_URL`) para envio de WhatsApp sem necessidade de domínio pago.

- [ ] **Passo 1: Instalar dependências do adaptador Turso LibSQL**
  Run: `npm install @libsql/client @prisma/adapter-libsql`
  Expected: Dependências instaladas com sucesso no `package.json`.

- [ ] **Passo 2: Habilitar Driver Adapters no `prisma/schema.prisma`**
  Adicionar `previewFeatures = ["driverAdapters"]` no bloco `generator client`.
  Atualizar o cliente Prisma: `npx prisma generate`.

- [ ] **Passo 3: Configurar inicialização híbrida do Prisma em `src/lib/db.ts`**
  ```typescript
  import { PrismaClient } from '@prisma/client';
  import { PrismaLibSQL } from '@prisma/adapter-libsql';
  import { createClient } from '@libsql/client';

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  function createPrismaClient() {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && (url.startsWith('libsql:') || authToken)) {
      const libsql = createClient({ url, authToken });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter });
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  export const prisma = globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```

- [ ] **Passo 4: Resolver dinamicamente a URL pública da Vercel em `src/lib/counter-service.ts`**
  ```typescript
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  ```

- [ ] **Passo 5: Atualizar `.env.example` com instruções de deploy**
  Incluir variáveis documentadas:
  - `DATABASE_URL="file:./dev.db"`
  - `TURSO_DATABASE_URL=""`
  - `TURSO_AUTH_TOKEN=""`
  - `NEXT_PUBLIC_APP_URL="http://localhost:3000"`

- [ ] **Passo 6: Commit**
  ```bash
  git add src/lib/db.ts src/lib/counter-service.ts prisma/schema.prisma .env.example package.json
  git commit -m "feat(cloud): add hybrid Turso LibSQL support and dynamic Vercel URL resolution"
  ```

---

### Tarefa 6: Verificação Global e Testes de Ponta a Ponta

**Arquivos:**
- Todos os arquivos do projeto.

- [ ] **Passo 1: Rodar a suíte completa de testes automatizados**
  Run: `npm test`
  Expected: Todas as 14+ suítes de teste aprovadas (100% PASS).

- [ ] **Passo 2: Executar build de produção do Next.js**
  Run: `npm run build`
  Expected: Compilação de produção com 0 erros.

- [ ] **Passo 3: Commit final e guia de publicação pronto**
  ```bash
  git commit -m "chore: complete seller overhaul and cloud readiness setup"
  ```

