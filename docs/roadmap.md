# 🗺️ Roadmap de Evolução: La Marka Club

---

## 🟢 Fases Concluídas (100% Entregues, Testadas & Em Produção na Vercel)

### Fase 1: Fundação, Core Financeiro & Experiência Base
- [x] **Motor Contábil FIFO (`fifo-engine.ts`):** Lotes de crédito por compra, consumo cronológico automático, saldo atômico com isolamento contábil e ledger imutável.
- [x] **Terminal de Balcão / Caixa Ágil (`/balcao`):** Atendimento em menos de 10 segundos, busca instantânea por telefone/nome/CPF, cadastro expresso e feedback do cashback ganho.
- [x] **Formatador de WhatsApp & Comunicação:** Disparo de mensagens acolhedoras com 1 toque, suporte a tags dinâmicas e fallback padrão oficial da marca.
- [x] **Carteira Digital VIP da Cliente (`/c/:token`):** Acesso Magic Link sem senhas, cartão comemorativo *La Marka Privilège*, alerta de expiração e extrato detalhado.
- [x] **Painel de Gestão da Dieizy (`/admin/*`):** Dashboard com KPIs, gestão de clientes, campanhas promocionais, aniversários, ajustes manuais com justificativa e conciliação de cupons.

### Fase 2: Escala, Nuvem & Equipe
- [x] **Banco de Produção em Nuvem:** Migração e sincronização para Turso LibSQL (datacenter em São Paulo).
- [x] **Importação da Base Real:** Carga e saneamento de mais de 1.250 clientes reais do ERP/Excel da loja.
- [x] **Gestão de Vendedoras (`/admin/vendedores`):** Cadastro de vendedoras com busca inteligente de clientes da base e seletor dedicado no balcão.
- [x] **Controle de Acessos & Usuários (RBAC):** Separação estrita entre perfil `GESTAO` (acesso total) e `BALCAO` (frente de caixa), com tela `/admin/usuarios` e portal seletor `/portal`.
- [x] **Refinamento Tipográfico:** Conexão nativa das fontes Google *Cormorant Garamond* (títulos de boutique) e *Plus Jakarta Sans* (textos e dados com máxima clareza).

### Fase 3: Blindagem & Segurança Multicamadas
- [x] **Proteção Anti-Força Bruta:** Bloqueio temporário de 15 minutos após 5 erros consecutivos de senha no login.
- [x] **Verificação de Sessão Criptográfica:** Validação HMAC-SHA256 no Edge com expiração estrita de 7 dias e invalidação de tokens adulterados.
- [x] **Proteção contra CSRF:** Bloqueio no middleware para requisições com origem externa fraudulenta.
- [x] **Sanitização contra XSS:** Filtro rigoroso contra injeção de scripts e tags maliciosas em cadastros e observações (`sanitize.ts`).
- [x] **Cabeçalhos Globais de Segurança HTTP:** Injeção de `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` e remoção do `X-Powered-By`.
- [x] **Bateria de Testes Automatizados:** Suíte abrangente com Vitest cobrindo todos os cenários de segurança e validações contábeis.

### 🎨 Fase 4: Haute Couture UI & Encantamento Visual (Onda 1)
- [x] **Iniciativa 4.1: Cartão VIP Matte & Barra de Progresso na Carteira (`/c/:token`):**
  - Cartão com acabamento fosco acetinado em terracota escuro e bordas em dourado champagne.
  - Gravação em baixo-relevo visual de *LA MARKA PRIVILÈGE* e chip boutique com selo *MEMBRO PRIVILÈGE • VIP*.
  - Barra de progresso de fidelidade com jornada visual (*Prata ➔ Ouro ➔ Diamante*).
  - Extrato estilo Apple Card / Nubank Ultravioleta com agrupamento diário e formatação `pt-BR`.
- [x] **Iniciativa 4.2: Gaveta Lateral Deslizante 360º no Painel da Dieizy (`/admin/clientes`):**
  - *Slide-over Drawer* estilo Twenty CRM com abertura instantânea ao clicar na cliente.
  - Avatar terracota, resumo em 4 cards (saldo, acumulado na vida, última compra, vendedora habitual) e link direto para WhatsApp com mensagem acolhedora pré-formatada.
- [x] **Iniciativa 4.3: Micro-celebração Visual no Caixa (`/balcao`):**
  - Efeito suave de partículas e brilho dourado (*CelebrationSparkles*) ao concluir a venda com texto comemorativo do cashback ganho.

### 🚀 Fase 5: Inteligência de Recompra & Fidelização Avançada (Onda 2 & 3)
- [x] **Iniciativa 5.1: Níveis de Fidelidade VIP Dinâmicos:**
  - Níveis calculados automaticamente com base nas compras dos últimos 6 meses:
    - 🥈 **Membro Prata (< R$ 500):** 1.0% de cashback
    - ✨ **Membro Ouro (R$ 500 a R$ 1.500):** 1.5% de cashback
    - 👑 **Membro Diamante (>= R$ 1.500):** 2.0% de cashback
  - Aplicação automática da alíquota VIP na frente de caixa (`/balcao`) combinada com multiplicadores de campanhas ativas.
- [x] **Iniciativa 5.2: Segmentação Inteligente de Recompra no Painel:**
  - Barra de inteligência com contadores em tempo real para *Inativas há 45d*, *Vencendo em 15d*, *Aniversariantes da Semana* e *Clientes Top Tier*.
  - Botão de 1 clique para WhatsApp com mensagem personalizada e contextualizada para cada situação.
- [x] **Iniciativa 5.3: Passe Nativo para Apple Wallet & Google Wallet (`.pkpass` & Google Pay):**
  - Endpoints `/api/wallet/apple/[token]` e `/api/wallet/google/[token]`.
  - Componente `WalletPassButton` na carteira digital permitindo adicionar o cartão nativo no iPhone e Android com 1 toque.
  - QR Code dinâmico do passe para leitura instantânea no balcão.

---

### 🧪 Status Atual de Qualidade e Confiabilidade:
- **Testes Automatizados:** **19 arquivos de teste, 133 testes 100% aprovados** no Vitest.
- **Build de Produção:** **35 rotas compiladas com sucesso** no Next.js 15.
- **Deploy:** Commit `86b46cd` ativo em produção na Vercel ([lamarkaclub.vercel.app](https://lamarkaclub.vercel.app)).
