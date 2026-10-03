# Especificação de Design: La Marka Club

**Data:** 03/10/2026  
**Status:** Em Revisão  
**Gestora do Projeto:** Dieizy  
**Escopo:** Sistema Completo de Fidelidade e Carteira Digital de Cashback da Loja La Marka  

---

## 1. Visão Geral e Propósito

O **La Marka Club** é a plataforma proprietária de fidelidade e relacionamento da loja de moda feminina **La Marka**, sob a gestão de **Dieizy**. 

O objetivo central não é dar descontos genéricos ou pontos abstratos, mas criar um ciclo virtuoso e tangível de recompra baseado em **cashback em reais**:
$$\text{Cliente compra} \longrightarrow \text{Ganha cashback em R\$} \longrightarrow \text{Acompanha saldo transparente} \longrightarrow \text{Tem motivo concreto para retornar} \longrightarrow \text{Realiza nova compra}$$

### Princípios Norteadores
1. **Simplicidade para a Cliente:** Zero atrito. Sem necessidade de baixar aplicativo em loja (App Store/Google Play), sem senhas difíceis. Notificações diretas no WhatsApp e visualização da carteira via Magic Link seguro com 1 toque.
2. **Velocidade Extrema no Balcão:** O atendimento no caixa não pode ter fila. Registro de venda e consulta de saldo em menos de 10 segundos, com feedback visual imediato do valor ganho para encantar a cliente no fechamento.
3. **Independência Operacional com Conciliação:** O clube opera de forma autônoma em relação ao software comercial/emissor fiscal da loja, permitindo conciliação e auditoria posterior sem travar a venda.
4. **Flexibilidade para a Gestão (Dieizy):** Controle total sobre percentuais, campanhas temporárias, presentes de aniversário, ajustes manuais com justificativa e personalização de mensagens.

---

## 2. Perfis de Usuário e Experiência (UX)

### 2.1. A Cliente La Marka (`/c/:token`)
- **Acesso:** Recebe um link seguro exclusivo no WhatsApp (`https://club.lamarka.com.br/c/tk_...`).
- **Autenticação:** Magic Token de alta entropia. Ao clicar, a carteira abre instantaneamente em formato web responsivo (PWA), sem exigir senha. Dados sensíveis (como CPF) são ofuscados para segurança.
- **Interface da Carteira:**
  - Card de destaque com o **Saldo Disponível** em reais.
  - Alerta inteligente de vencimento (ex: *"R$ 18,00 expiram em 12 dias"*).
  - Extrato detalhado e cronológico de movimentações: compras com cashback ganho (+), resgates utilizados (−), bônus de aniversário (+) e créditos expirados (−).
  - Identidade visual sofisticada e acolhedora, alinhada à estética da La Marka.

### 2.2. A Atendente no Balcão / Caixa (`/balcao`)
- **Tela de Atendimento Ágil:**
  - Busca instantânea de clientes por Telefone, Nome ou CPF com autocomplete.
  - Cadastro relâmpago de nova cliente em 10 segundos caso ainda não exista (Nome, Telefone, Data de Aniversário; CPF opcional).
  - Consulta imediata de saldo existente e aviso de créditos prestes a expirar.
  - Campo simples de lançamento do valor da compra.
  - Checkbox para resgate de saldo acumulado (total ou parcial) com abatimento automático no valor a pagar.
  - Card visual comemorativo na tela com o valor exato ganho na hora:
    > ✨ **Você ganhou R$ 15,00 de cashback nesta compra!**  
    > **Novo saldo total: R$ 37,00 (válido até 18/11)**
  - Botão destacado **[ 💬 Enviar WhatsApp ]** que abre a conversa no WhatsApp com texto acolhedor já montado e o link da carteira. Permite à atendente visualizar e personalizar o texto antes do envio, se desejar.

### 2.3. A Gestora Dieizy (`/admin`)
- **Painel Geral e Métricas (`/admin/dashboard`):** Total de clientes, volume financeiro movimentado pelo clube, saldo em circulação, taxa de retorno (quantas clientes voltaram após ganhar cashback) e aniversariantes do período.
- **Campanhas Sazonais (`/admin/campanhas`):** Criação e ativação de campanhas temporárias (multiplicador 2x, percentual promocional, bônus fixo para compras acima de R$ X).
- **Módulo de Aniversário (`/admin/aniversarios`):** Parametrização do presente (valor em R$, dias de antecedência e dias de validade) e lista de disparos semanais.
- **Editor de Mensagens (`/admin/configuracoes`):** Customização de templates de WhatsApp com tags dinâmicas (`{primeiro_nome}`, `{cashback_ganho}`, `{saldo_total}`, `{validade}`, `{link_carteira}`), com restauração para o modelo padrão da La Marka (fallback).
- **Ajustes Manuais e Auditoria (`/admin/ajustes`):** Adição ou dedução manual de créditos (trocas, devoluções, cortesias VIP), exigindo justificativa obrigatória.
- **Conciliação de Vendas (`/admin/conciliacao`):** Importação de planilhas/relatórios do sistema de caixa comercial para auditoria e cruzamento de vendas.

---

## 3. Arquitetura do Sistema e Stack Tecnológica

### 3.1. Arquitetura de Software
- **Modelo:** Monolito full-stack moderno com Next.js (App Router) em TypeScript.
- **Estilização & Componentes:** Tailwind CSS, Radix UI primitives e ícones Lucide, com paleta de cores refinada para moda feminina (tons acolhedores, off-white, rosé/nude e dourado sutil).
- **Banco de Dados:** Prisma ORM conectado a SQLite (para desenvolvimento e execução local rápida) ou PostgreSQL (para nuvem com múltiplos caixas).
- **Arquitetura PWA:** Suporte a manifesto e service-worker para instalação em tablets ou computadores da loja com 1 clique.

### 3.2. Estrutura de Diretórios Proposta
```
src/
├── app/
│   ├── balcao/              # Interface do Caixa / Atendente
│   │   └── page.tsx
│   ├── admin/               # Painel da Gestora Dieizy
│   │   ├── dashboard/
│   │   ├── campanhas/
│   │   ├── aniversarios/
│   │   ├── conciliacao/
│   │   ├── ajustes/
│   │   └── configuracoes/
│   ├── c/
│   │   └── [token]/         # Carteira Digital da Cliente
│   │       └── page.tsx
│   ├── api/                 # Endpoints REST e Webhooks auxiliares
│   │   ├── cron/            # Rotina de expiração diária e aniversários
│   │   └── whatsapp/        # Adapter para envio automático
│   └── layout.tsx
├── components/              # Componentes de UI reutilizáveis
│   ├── balcao/
│   ├── admin/
│   ├── carteira/
│   └── ui/
├── lib/
│   ├── db.ts                # Conexão Prisma Client
│   ├── fifo-engine.ts       # Motor de cálculo FIFO e lotes de cashback
│   ├── whatsapp.ts          # Formatador de mensagens e fallback de templates
│   └── reconciliation.ts    # Motor de conciliação de cupons
└── types/
```

---

## 4. Modelo de Dados (Prisma Schema)

```prisma
datasource db {
  provider = "sqlite" // ou "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Customer {
  id           String            @id @default(cuid())
  name         String
  phone        String            @unique
  cpf          String?
  birthDay     Int?              // Dia do aniversário (1-31)
  birthMonth   Int?              // Mês do aniversário (1-12)
  magicToken   String            @unique // Token para acesso à carteira
  notes        String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  credits      CashbackCredit[]
  transactions CashbackTransaction[]
}

enum CreditStatus {
  ACTIVE
  FULLY_USED
  EXPIRED
}

enum CreditOrigin {
  PURCHASE
  BIRTHDAY
  CAMPAIGN
  MANUAL_BONUS
}

model CashbackCredit {
  id             String       @id @default(cuid())
  customerId     String
  customer       Customer     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  initialAmount  Float        // Valor original concedido (ex: 15.00)
  currentBalance Float        // Saldo restante deste lote específico (ex: 10.00)
  expiresAt      DateTime     // Data e hora de expiração
  status         CreditStatus @default(ACTIVE)
  origin         CreditOrigin @default(PURCHASE)
  purchaseValue  Float?       // Valor da compra de origem, se houver
  campaignId     String?
  campaign       Campaign?    @relation(fields: [campaignId], references: [id])
  createdAt      DateTime     @default(now())
}

enum TransactionType {
  EARN             // Cashback ganho em compra
  REDEEM           // Utilização de saldo em compra
  EXPIRE           // Crédito expirado por validade
  MANUAL_ADD       // Ajuste manual positivo pela Dieizy
  MANUAL_SUBTRACT  // Ajuste manual negativo pela Dieizy
  BIRTHDAY_GIFT    // Presente de aniversário
}

model CashbackTransaction {
  id             String          @id @default(cuid())
  customerId     String
  customer       Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type           TransactionType
  amount         Float           // Positivo para créditos (+), negativo para débitos (-)
  balanceAfter   Float           // Saldo total da cliente imediatamente após a transação
  description    String          // Ex: "Compra de R$ 300,00", "Bônus de Aniversário"
  operatorName   String?         // Nome da atendente ou Dieizy
  reason         String?         // Justificativa para ajustes manuais
  createdAt      DateTime        @default(now())
}

enum CampaignType {
  PERCENTAGE_OVERRIDE  // Ex: 10% em vez de 5%
  MULTIPLIER           // Ex: 2x cashback (10%)
  FIXED_BONUS          // Ex: Bônus fixo de R$ 20
  MIN_PURCHASE_BONUS   // Ex: +R$ 30 para compras acima de R$ 400
}

model Campaign {
  id          String         @id @default(cuid())
  name        String         // Ex: "Semana da Cliente", "Outubro Rosa"
  description String?
  type        CampaignType
  value       Float          // Valor da regra (percentual ou valor em reais)
  minPurchase Float?         // Valor mínimo de compra elegível
  startsAt    DateTime
  endsAt      DateTime
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  
  credits     CashbackCredit[]
}

model StoreSetting {
  id                         String   @id @default("default")
  storeName                  String   @default("La Marka")
  defaultCashbackPercentage  Float    @default(5.0) // 5%
  defaultExpirationDays      Int      @default(45)  // 45 dias
  birthdayBonusAmount        Float    @default(30.0)// R$ 30,00
  birthdayBonusValidityDays  Int      @default(30)  // 30 dias de validade
  birthdayBonusDaysBefore    Int      @default(7)   // Liberado 7 dias antes
  updatedAt                  DateTime @updatedAt
}

model MessageTemplate {
  id           String   @id // ex: "EARN_PURCHASE", "REDEEM", "BIRTHDAY", "EXPIRATION_ALERT"
  title        String
  content      String   // Texto com tags ({primeiro_nome}, {cashback_ganho}, etc.)
  isCustomized Boolean  @default(false)
  updatedAt    DateTime @updatedAt
}

model SalesReconciliation {
  id               String   @id @default(cuid())
  saleIdentifier   String   // Código do cupom ou venda fiscal
  saleDate         DateTime
  grossAmount      Float
  customerPhone    String?
  customerName     String?
  status           String   // "MATCHED", "CLUB_ONLY", "ERP_ONLY"
  transactionId    String?
  notes            String?
  importedAt       DateTime @default(now())
}
```

---

## 5. Regras de Negócio e Motor Financeiro (FIFO)

### 5.1. Concessão de Cashback
- **Cálculo Base:**  
  $$\text{Cashback} = \text{Valor Líquido Pago da Compra} \times \left(\frac{\text{Percentual Ativo}}{100}\right)$$
  *(Se houver campanha vigente, aplica-se a regra promocional).*
- O crédito gera um registro em `CashbackCredit` com `expiresAt = hoje + diasDeValidade`.
- Gera um evento no histórico `CashbackTransaction` do tipo `EARN`.

### 5.2. Consumo de Saldo (FIFO - First In, First Out)
- Quando a cliente utiliza saldo (resgate parcial ou total):
  1. O sistema busca os lotes de crédito (`CashbackCredit`) da cliente com `status = ACTIVE` e ordena por `expiresAt ASC` (mais próximos de vencer primeiro).
  2. Abate do primeiro lote. Se o lote for zerado, muda para `FULLY_USED`.
  3. Se ainda restar valor a abater, passa para o próximo lote sucessivamente.
  4. Gera um evento no histórico `CashbackTransaction` do tipo `REDEEM` com o valor negativo correspondente e grava o novo saldo consolidado.

### 5.3. Expiração Automática
- Uma rotina agendada (ou verificador executado na consulta de saldo) verifica lotes ativos com `expiresAt < now()` e `currentBalance > 0`.
- O saldo remanescente do lote é zerado, o lote muda para `EXPIRED`, e uma transação `EXPIRE` é registrada para manter o histórico transparente no extrato da cliente.

### 5.4. Motor de Aniversário
- Na rotina diária ou consulta de aniversariantes da semana:
  - Clientes que fazem aniversário nos próximos `birthdayBonusDaysBefore` dias recebem automaticamente um lote `CashbackCredit` de origem `BIRTHDAY` com o valor estipulado (ex: R$ 30,00) e validade de `birthdayBonusValidityDays` dias.
  - Uma transação do tipo `BIRTHDAY_GIFT` é registrada.

---

## 6. Motor de Comunicação WhatsApp e Templates

### 6.1. Tags Dinâmicas Suportadas
- `{nome}`: Nome completo da cliente cadastrada.
- `{primeiro_nome}`: Primeiro nome para abordagem calorosa e amigável.
- `{valor_compra}`: Valor formatado em R$ da compra realizada.
- `{cashback_ganho}`: Valor formatado em R$ do crédito ganho na compra.
- `{saldo_utilizado}`: Valor de saldo abatido na compra (quando houver).
- `{saldo_total}`: Saldo consolidado total da cliente em R$.
- `{validade}`: Data limite do próximo lote a expirar (ex: 15/11/2026).
- `{dias_para_expirar}`: Quantidade de dias restantes até o vencimento.
- `{link_carteira}`: Link exclusivo com o token da cliente (`https://.../c/token`).

### 6.2. Templates Padrão (Fallback Oficial da La Marka)
Caso Dieizy não personalize o texto nas configurações, os seguintes padrões acolhedores são utilizados:

1. **Compra com Ganho de Cashback:**
   > *Olá, {primeiro_nome}! Que prazer ter você aqui na La Marka hoje! ✨*  
   > *Na sua compra de hoje você ganhou **{cashback_ganho} de cashback**.*  
   > *Seu saldo disponível agora é de **{saldo_total}**.*  
   > *Acompanhe sua carteira e extrato quando quiser:*  
   > *👉 {link_carteira}*

2. **Compra com Resgate de Saldo:**
   > *Olá, {primeiro_nome}! Adoramos sua visita à La Marka hoje! 💕*  
   > *Você utilizou **{saldo_utilizado}** do seu cashback nesta compra.*  
   > *Você ainda possui **{saldo_total}** de saldo disponível.*  
   > *Consulte seu extrato atualizado:*  
   > *👉 {link_carteira}*

3. **Presente de Aniversário:**
   > *Parabéns, {primeiro_nome}! A La Marka comemora o seu dia com você! 🎁✨*  
   > *Você acabou de ganhar um presente especial de **{cashback_ganho} de bônus** para escolher o seu look de aniversário!*  
   > *Veja seu presente na sua carteira digital:*  
   > *👉 {link_carteira}*

4. **Alerta de Expiração Próxima:**
   > *Olá, {primeiro_nome}! Passando para lembrar que você tem **{saldo_total}** de cashback disponível na La Marka, e parte desse valor expira em breve (em {dias_para_expirar} dias)!*  
   > *Que tal nos visitar e garantir aquele look que você amou? 💕*  
   > *Confira seu saldo aqui: {link_carteira}*

---

## 7. Módulo de Conciliação Independente de Vendas

### 7.1. Fluxo de Trabalho
1. **No dia a dia:** As atendentes operam no `/balcao`, concedendo cashback e resgates em tempo real.
2. **Na conferência periódica:** Dieizy acessa `/admin/conciliacao` e faz o upload de uma planilha (CSV ou Excel) ou cola o relatório de vendas do sistema fiscal da loja.
3. **Mecanismo de Cruzamento:**
   - O sistema cruza data/hora e valor (com margem de tolerância configurável) ou telefone da cliente.
   - Status atribuídos:
     - **Conciliado (Verde):** Venda do PDV fiscal bate com lançamento no La Marka Club.
     - **Não Lançado no Clube (Amarelo):** Venda no PDV fiscal sem registro no clube. Exibe botão `[ Lançar Cashback ]` caso Dieizy queira creditar manualmente para uma cliente que esqueceu de ser cadastrada.
     - **Lançado Apenas no Clube (Azul):** Registro no clube sem cupom fiscal correspondente na planilha importada.

---

## 8. Segurança, Privacidade e Tolerância a Falhas

- **Magic Link Seguro:** Os tokens são gerados com tamanho mínimo de 24 caracteres aleatórios (`nanoid`), tornando inviável qualquer tentativa de adivinhação por força bruta.
- **Proteção de Dados Pessoais (LGPD):** A carteira pública não exibe CPF completo nem endereço; exibe apenas o primeiro nome, saldo, prazos e histórico de movimentações.
- **Transações Atômicas:** Todas as operações de crédito, débito e alteração de saldo são executadas em transações atômicas de banco de dados (`prisma.$transaction`), impossibilitando saldo inconsistente em caso de falha de conexão.
- **Auditoria Completa:** Nenhuma linha do extrato é apagada. Ajustes manuais exigem identificação do operador e motivo.

---

## 9. Plano de Testes e Validação

- **Testes Unitários:**
  - Lógica do motor FIFO: debitar de múltiplos lotes com datas de validade distintas na ordem cronológica correta.
  - Regra de expiração automática de saldo.
  - Substituição de tags e fallback dos templates de mensagem de WhatsApp.
  - Aplicação correta de campanhas sazonais sobre o valor líquido da venda.
- **Testes de Integração e Ponta a Ponta:**
  - Fluxo completo do balcão: busca -> cadastro de nova cliente -> compra -> feedback imediato -> geração do link WhatsApp.
  - Fluxo da carteira da cliente: abertura via token -> validação de saldo -> visualização de alerta de expiração.
  - Fluxo da Dieizy: alteração de percentuais, criação de campanha e conciliação de relatório CSV.
