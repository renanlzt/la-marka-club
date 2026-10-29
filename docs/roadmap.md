# 🗺️ Roadmap de Evolução: La Marka Club

---

## 🟢 Fases Concluídas (100% Entregues & Em Produção)

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
- [x] **Bateria de Testes Automatizados:** 68 testes no Vitest (16 arquivos de teste) 100% aprovados e build Next.js validado na Vercel.

---

## 🟡 Próximas Fases: Expansão Visual & Estratégica (Roadmap Aprovado)

### 🎨 Fase 4: Haute Couture UI & Encantamento Visual
*Refinamento estético inspirado nas melhores referências do varejo de luxo e fintechs modernas (Apple, Twenty CRM, Stampee).*

- [ ] **Iniciativa 4.1: Cartão VIP Matte & Barra de Progresso na Carteira (`/c/:token`)**
  - Design com acabamento fosco acetinado (*Matte Finish*) e bordas douradas sutis.
  - Gravação de identificador de membro em relevo visual elegante (`Membro Privilège • Nº 0418`).
  - Barra de progresso de fidelidade (*Gamificação Sofisticada*): indicador visual de quanto falta em compras para atingir a próxima categoria VIP.
  - Extrato financeiro estilo Apple Card / Nubank Ultravioleta com linha do tempo pontilhada e separadores mensais.
- [ ] **Iniciativa 4.2: Gaveta Lateral Deslizante 360º no Painel da Dieizy (`/admin/clientes`)**
  - Implementação de *Slide-over Drawer* estilo Twenty CRM com efeito translúcido (*glassmorphism*).
  - Ao clicar em qualquer cliente, abre o perfil 360º instantâneo: saldo atual, lotes a expirar, histórico de compras, vendedora habitual e atalho para WhatsApp sem recarregar ou trocar de página.
  - Microinterações de tabela com iluminação suave (*hover*) e badges em tons pastéis acetinados.
- [ ] **Iniciativa 4.3: Micro-celebração Visual no Caixa (`/balcao`)**
  - Animação comemorativa suave com partículas e brilho dourado (*sparkles*) no modal de fechamento de venda.
  - Layout otimizado para que a atendente possa virar a tela do tablet/smartphone para a cliente ver o crédito caindo na hora.

---

### 🚀 Fase 5: Inteligência de Recompra & Fidelização Avançada
*Mecanismos estratégicos inspirados no Voucherify e Formance Ledger para alavancar a receita e o engajamento da loja.*

- [ ] **Iniciativa 5.1: Níveis de Fidelidade VIP (Tiers Dinâmicos)**
  - Criação de categorias automáticas de clientes baseadas nas compras dos últimos 6 meses:
    - 🌸 **Membro Prata:** 1.0% de cashback (padrão)
    - ✨ **Membro Ouro:** 1.5% de cashback (para compras acumuladas acima de R$ X)
    - 👑 **Membro Diamante:** 2.0% de cashback (para clientes mais assíduas)
  - Aplicação automática do percentual de cashback no balcão de acordo com o nível da cliente.
- [ ] **Iniciativa 5.2: Segmentação Inteligente de Recompra no Painel**
  - Filtros rápidos com 1 clique para a Dieizy no menu de Clientes:
    - 🛍️ *Clientes VIPs inativas (sem compras há mais de 45 dias)*
    - ⚠️ *Clientes com saldo prestes a vencer neste mês*
    - 🎂 *Aniversariantes da próxima semana*
  - Ação em lote: geração do link de WhatsApp personalizado para cada cliente da lista filtrada.
- [ ] **Iniciativa 5.3: Passe Nativo para Apple Wallet & Google Wallet (`.pkpass`)**
  - Botão na carteira digital: *[ 📲 Adicionar à Carteira da Apple / Google ]*.
  - Cartão nativo salvo diretamente no aplicativo Carteira do smartphone da cliente.
  - Notificações automáticas na tela de bloqueio quando a cliente estiver nas proximidades da loja física.
