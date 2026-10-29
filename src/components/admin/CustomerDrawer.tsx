'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Wallet,
  ExternalLink,
  MessageCircle,
  Calendar,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
  Clock,
  PlusCircle,
  MinusCircle,
  Gift,
  UserCheck,
  Users,
  Copy,
  Check,
  Pencil,
  Sliders,
  ChevronRight,
  Store,
  RefreshCw,
  FileText,
  Cake,
  TrendingUp,
} from 'lucide-react';

export interface CustomerTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  description: string;
  createdAt: string | Date;
  operatorName?: string | null;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  notes: string | null;
  magicToken: string;
  isSeller?: boolean;
  createdAt: string;
  balanceInfo: {
    availableBalance: number;
    expiringAmount: number;
    expiringInDays: number | null;
    nextExpirationDate: string | null;
  };
  stats: {
    totalEarned: number;
    totalRedeemed: number;
    totalPurchases: number;
  };
}

export interface SellerInfo {
  id: string;
  name: string;
  phone?: string | null;
  code?: string | null;
  active?: boolean;
  customerId?: string | null;
}

export interface CustomerDrawerProps {
  customer: CustomerSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (customer: CustomerSummary) => void;
  sellers?: SellerInfo[];
}

/**
 * Utilitários exportados para reuso e testes unitários
 */
export function formatBRL(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function getCustomerInitials(name: string): string {
  if (!name || !name.trim()) return 'LM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getMonthName(m: number | null): string {
  if (!m) return '';
  const months = [
    '',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[m] || '';
}

/**
 * Gera mensagem carinhosa e acolhedora personalizada para a cliente no WhatsApp
 */
export function generateCustomerWhatsAppUrl(
  customer: CustomerSummary,
  originUrl = ''
): string {
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const firstName = customer.name.trim().split(/\s+/)[0] || 'Cliente';
  const saldo = formatBRL(customer.balanceInfo?.availableBalance || 0);
  const currentMonth = new Date().getMonth() + 1;
  const isBirthdayMonth = customer.birthMonth === currentMonth;
  const hasBalance = (customer.balanceInfo?.availableBalance || 0) > 0;
  const expiringDays = customer.balanceInfo?.expiringInDays;

  const walletUrl = originUrl
    ? `${originUrl.replace(/\/$/, '')}/c/${customer.magicToken}`
    : `https://lamarka.com.br/c/${customer.magicToken}`;

  let text = `Olá, ${firstName}! Tudo bem? ✨\n\nAqui é da equipe La Marka. `;

  if (isBirthdayMonth) {
    text += `Passando antes de tudo para te desejar um Feliz Aniversário! Que seu novo ciclo seja radiante, cheio de realizações e muito estilo! 🎂🎉\n\n`;
  }

  if (hasBalance) {
    text += `Passando para lembrar com carinho que você tem *R$ ${saldo}* de cashback acumulado na sua carteira digital do La Marka Club prontinho para usar em novas peças.\n\n`;
    if (expiringDays !== null && expiringDays !== undefined && expiringDays <= 15) {
      text += `⏳ *Atenção:* uma parte do seu saldo expira em ${expiringDays} dia${expiringDays !== 1 ? 's' : ''}.\n\n`;
    }
  } else {
    text += `Passando para agradecer pelo seu carinho conosco no La Marka Club e te convidar para conferir as novidades da nossa nova coleção!\n\n`;
  }

  text += `Consulte sua carteira digital VIP quando desejar:\n👉 ${walletUrl}\n\nEsperamos você para um café especial aqui na loja! 💖`;

  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Extrai a data da última compra a partir das transações ou fallback
 */
export function extractLastPurchaseDate(
  transactions: CustomerTransaction[],
  fallbackDate?: string | null
): { dateStr: string; isEstimated: boolean } {
  if (transactions && transactions.length > 0) {
    const purchaseTx = transactions.find(
      (t) =>
        t.type === 'EARN' ||
        t.description.toLowerCase().includes('compra') ||
        t.amount > 0
    );
    if (purchaseTx) {
      const d = new Date(purchaseTx.createdAt);
      if (!isNaN(d.getTime())) {
        return {
          dateStr: d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          isEstimated: false,
        };
      }
    }
  }

  if (fallbackDate) {
    const d = new Date(fallbackDate);
    if (!isNaN(d.getTime())) {
      return {
        dateStr: d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        isEstimated: true,
      };
    }
  }

  return { dateStr: 'Sem compras registradas', isEstimated: false };
}

/**
 * Detecta a vendedora habitual vinculada à cliente
 */
export function detectHabitualSeller(
  customer: CustomerSummary,
  sellers: SellerInfo[] = [],
  transactions: CustomerTransaction[] = []
): { name: string; isLinked: boolean; roleDescription: string } {
  // 1. Se a cliente é ela mesma vendedora
  if (customer.isSeller) {
    return {
      name: 'Própria Vendedora',
      isLinked: true,
      roleDescription: 'Membro da equipe La Marka',
    };
  }

  // 2. Se há vendedor formal vinculado ao customerId
  const linkedSeller = sellers.find((s) => s.customerId === customer.id);
  if (linkedSeller) {
    return {
      name: linkedSeller.name,
      isLinked: true,
      roleDescription: linkedSeller.code ? `Código ${linkedSeller.code}` : 'Vendedora habitual',
    };
  }

  // 3. Se há operador indicado nas notas
  if (customer.notes) {
    const match = customer.notes.match(/vendedora(?:\s+habitual)?[:\s]+([a-zA-ZÀ-ÿ]+(?:\s+[a-zA-ZÀ-ÿ]+)*)/i);
    if (match && match[1]) {
      return {
        name: match[1].trim(),
        isLinked: true,
        roleDescription: 'Indicada nas observações',
      };
    }
  }

  // 4. Se alguma transação possui operatorName específico
  if (transactions && transactions.length > 0) {
    const opTx = transactions.find(
      (t) => t.operatorName && t.operatorName !== 'Balcão' && !t.operatorName.includes('Sistema')
    );
    if (opTx && opTx.operatorName) {
      return {
        name: opTx.operatorName,
        isLinked: true,
        roleDescription: 'Último atendimento',
      };
    }
  }

  return {
    name: 'Balcão Geral',
    isLinked: false,
    roleDescription: 'Sem vendedora fixa vinculada',
  };
}

export default function CustomerDrawer({
  customer,
  isOpen,
  onClose,
  onEdit,
  sellers = [],
}: CustomerDrawerProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Trava scroll da página ao abrir drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Tecla ESC para fechar gaveta
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Busca mini histórico de movimentações da cliente
  useEffect(() => {
    if (!isOpen || !customer) {
      setTransactions([]);
      return;
    }

    let isMounted = true;
    const loadTransactions = async () => {
      setLoadingTx(true);
      setTxError(null);

      try {
        const res = await fetch(`/c/${customer.magicToken}`, {
          headers: { Accept: 'text/html' },
        });

        if (!res.ok) {
          throw new Error('Não foi possível carregar o extrato da cliente.');
        }

        const html = await res.text();
        if (!isMounted) return;

        let parsedTxs: CustomerTransaction[] = [];

        // 1. Tentar extrair do payload Next.js (RSC JSON em script)
        const jsonMatch = html.match(/"transactions":\s*(\[\{.*?\}\])/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const raw = JSON.parse(jsonMatch[1]);
            parsedTxs = raw.map((t: any) => ({
              id: t.id || Math.random().toString(),
              type: t.type || 'EARN',
              amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
              balanceAfter: t.balanceAfter,
              description: t.description || 'Movimentação no clube',
              createdAt: t.createdAt || new Date().toISOString(),
              operatorName: t.operatorName || null,
            }));
          } catch (e) {
            // Segue para fallback DOMParser
          }
        }

        // 2. Fallback: Parsear nós DOM do HTML renderizado
        if (parsedTxs.length === 0 && typeof window !== 'undefined') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const rows = doc.querySelectorAll('.divide-y > div');

          rows.forEach((row, idx) => {
            const descEl = row.querySelector('p.font-medium');
            const dateEl = row.querySelector('p.text-lamarka-500');
            const amountEl = row.querySelector('span.font-serif');

            if (descEl && amountEl) {
              const description = descEl.textContent?.trim() || 'Movimentação';
              const dateText = dateEl?.textContent?.trim() || '';
              const rawAmount = amountEl.textContent?.replace(/[^\d,-]/g, '').replace(',', '.') || '0';
              const isMinus = amountEl.textContent?.includes('-');
              const amount = isMinus ? -Math.abs(parseFloat(rawAmount)) : Math.abs(parseFloat(rawAmount));

              parsedTxs.push({
                id: `html-tx-${idx}`,
                type: isMinus ? 'REDEEM' : 'EARN',
                amount,
                description,
                createdAt: dateText || new Date().toISOString(),
              });
            }
          });
        }

        if (isMounted) {
          setTransactions(parsedTxs);
        }
      } catch (err: any) {
        if (isMounted) {
          setTxError(err.message || 'Erro ao carregar movimentações.');
        }
      } finally {
        if (isMounted) {
          setLoadingTx(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, customer]);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (!isOpen || !customer) return null;

  const initials = getCustomerInitials(customer.name);
  const isBirthday = customer.birthMonth === currentMonth;
  const hasExpiring =
    customer.balanceInfo.expiringInDays !== null &&
    customer.balanceInfo.expiringInDays <= 15;

  const { dateStr: lastPurchaseDate, isEstimated } = extractLastPurchaseDate(
    transactions,
    customer.stats.totalPurchases > 0 ? customer.createdAt : null
  );

  const habitualSeller = detectHabitualSeller(customer, sellers, transactions);
  const whatsAppUrl = generateCustomerWhatsAppUrl(customer, originUrl);

  const handleCopyLink = () => {
    const url = `${originUrl}/c/${customer.magicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(customer.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getTxIcon = (type: string, amount: number) => {
    if (type === 'BIRTHDAY' || type === 'BIRTHDAY_GIFT') {
      return <Gift className="w-4 h-4 text-rose-600" strokeWidth={1.5} />;
    }
    if (type === 'REDEEM' || amount < 0) {
      return <MinusCircle className="w-4 h-4 text-lamarka-800" strokeWidth={1.5} />;
    }
    if (type === 'EXPIRE') {
      return <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.5} />;
    }
    if (type === 'MANUAL_ADD') {
      return <PlusCircle className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />;
    }
    return <ShoppingBag className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />;
  };

  const formatTxDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop suave com blur e animação */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-lamarka-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out animate-in fade-in"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
        <aside className="w-screen max-w-lg lg:max-w-xl bg-white shadow-2xl border-l border-lamarka-200/90 flex flex-col pointer-events-auto transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
          
          {/* Header Superior Executivo (Twenty CRM inspired) */}
          <div className="px-6 py-4.5 border-b border-lamarka-200/80 bg-gradient-to-r from-lamarka-50/90 via-white to-lamarka-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.16em] border border-lamarka-300/50">
                <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Visão 360º da Cliente
              </span>
              {customer.isSeller && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                  <UserCheck className="w-3 h-3 text-amber-600" /> Vendedora
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  title="Editar dados da cliente"
                  className="p-2 rounded-xl text-lamarka-500 hover:text-lamarka-800 hover:bg-lamarka-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar gaveta"
                className="p-2 rounded-xl text-lamarka-400 hover:text-lamarka-800 hover:bg-lamarka-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo com rolagem suave */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {/* Perfil da Cliente com Avatar Rosa Seco / Terracota */}
            <div className="flex items-start gap-4 p-5 rounded-3xl bg-gradient-to-br from-lamarka-100/70 via-lamarka-50 to-white border border-lamarka-200/80 shadow-card">
              <div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EADBD7] via-[#DFC2BC] to-[#C59B94] text-[#5F3A36] border-2 border-[#DFC2BC] flex items-center justify-center shrink-0 font-serif font-bold text-xl shadow-luxury"
                aria-label={`Iniciais ${initials}`}
              >
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-serif font-semibold text-lamarka-900 tracking-tight leading-tight truncate">
                    {customer.name}
                  </h2>
                  {isBirthday && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300 shadow-2xs">
                      <Cake className="w-3.5 h-3.5 text-amber-600" /> Aniversariante do Mês
                    </span>
                  )}
                </div>

                {/* Telefone e Documentos */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-lamarka-700">
                  <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-lamarka-200/70">
                    <span className="font-medium">{formatPhone(customer.phone)}</span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      title="Copiar telefone"
                      className="text-lamarka-400 hover:text-lamarka-700 ml-1"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {customer.cpf && (
                    <span className="text-lamarka-500 font-light text-[11px]">
                      CPF: <strong className="font-medium text-lamarka-700">{customer.cpf}</strong>
                    </span>
                  )}

                  {customer.birthDay && customer.birthMonth && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-lamarka-600 font-light">
                      <Calendar className="w-3 h-3 text-lamarka-400" />
                      {customer.birthDay} de {getMonthName(customer.birthMonth)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ações Rápidas de Alto Impacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botão WhatsApp */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-luxury hover:shadow-luxury-lg transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" strokeWidth={1.5} />
                <span>Abrir Conversa no WhatsApp</span>
              </a>

              {/* Botão Ver Carteira Digital */}
              <Link
                href={`/c/${customer.magicToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-luxury hover:shadow-luxury-lg transition-all"
              >
                <Wallet className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.5} />
                <span>Abrir Carteira Digital</span>
                <ExternalLink className="w-3.5 h-3.5 text-lamarka-300 ml-0.5" strokeWidth={1.5} />
              </Link>
            </div>

            {/* Resumo Financeiro 360º (4 Cards Executivos) */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-lamarka-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#DFB76C]" /> Indicadores 360º da Cliente
                </h3>
                <span className="text-[11px] text-lamarka-500 font-light">La Marka Club</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Saldo Disponível */}
                <div className="p-4 rounded-2xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between text-lamarka-500 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Saldo em Carteira</span>
                    <Wallet className="w-3.5 h-3.5 text-[#DFB76C]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-serif font-bold text-lamarka-900">
                    R$ {formatBRL(customer.balanceInfo.availableBalance)}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-lamarka-100">
                    {hasExpiring ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 leading-tight">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        R$ {formatBRL(customer.balanceInfo.expiringAmount)} expira em {customer.balanceInfo.expiringInDays}d
                      </span>
                    ) : customer.balanceInfo.availableBalance > 0 ? (
                      <span className="text-[10px] text-emerald-700 font-medium leading-tight">
                        ✓ Saldo ativo sem expiração imediata
                      </span>
                    ) : (
                      <span className="text-[10px] text-lamarka-400 font-light leading-tight">
                        Sem saldo disponível no momento
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Total Acumulado Histórico */}
                <div className="p-4 rounded-2xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between text-lamarka-500 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Total Acumulado</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-serif font-bold text-lamarka-800">
                    R$ {formatBRL(customer.stats.totalEarned)}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-lamarka-100 text-[10px] text-lamarka-500 font-light flex items-center justify-between">
                    <span>Resgatou:</span>
                    <strong className="text-lamarka-700 font-medium">R$ {formatBRL(customer.stats.totalRedeemed)}</strong>
                  </div>
                </div>

                {/* 3. Data da Última Compra */}
                <div className="p-4 rounded-2xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between text-lamarka-500 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Última Compra</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-lamarka-600" />
                  </div>
                  <div className="text-sm sm:text-base font-serif font-semibold text-lamarka-900 leading-snug">
                    {lastPurchaseDate}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-lamarka-100 text-[10px] text-lamarka-500 font-light flex items-center justify-between">
                    <span>Compras no clube:</span>
                    <strong className="text-lamarka-700 font-medium">
                      {customer.stats.totalPurchases} compra{customer.stats.totalPurchases !== 1 ? 's' : ''}
                    </strong>
                  </div>
                </div>

                {/* 4. Vendedora Habitual Vinculada */}
                <div className="p-4 rounded-2xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between text-lamarka-500 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Vendedora Vinculada</span>
                    <Users className="w-3.5 h-3.5 text-lamarka-600" />
                  </div>
                  <div className="text-sm sm:text-base font-serif font-semibold text-lamarka-900 truncate" title={habitualSeller.name}>
                    {habitualSeller.name}
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-lamarka-100 text-[10px] text-lamarka-500 font-light truncate">
                    {habitualSeller.roleDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* Observações / Notas Internas */}
            <div className="p-4 rounded-2xl bg-white border border-lamarka-200/90 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-lamarka-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-lamarka-400" /> Observações & Preferências
                </span>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="text-[10px] text-lamarka-600 hover:text-lamarka-900 font-medium flex items-center gap-0.5"
                  >
                    <span>Editar notas</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-lamarka-600 font-light leading-relaxed whitespace-pre-wrap">
                {customer.notes ? customer.notes : 'Nenhuma observação interna cadastrada para esta cliente.'}
              </p>
            </div>

            {/* Mini Histórico de Movimentações / Compras */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-lamarka-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-lamarka-500" /> Extrato Recente da Carteira
                </h3>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar link direto da carteira"
                  className="inline-flex items-center gap-1 text-[11px] text-lamarka-600 hover:text-lamarka-900 transition-colors"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Link copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-card divide-y divide-lamarka-100 overflow-hidden">
                {loadingTx ? (
                  <div className="p-8 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-lamarka-600 border-t-transparent rounded-full animate-spin" />
                    <span>Carregando extrato da cliente...</span>
                  </div>
                ) : txError ? (
                  <div className="p-6 text-center text-xs text-lamarka-500">
                    <p>{txError}</p>
                    <Link
                      href={`/c/${customer.magicToken}`}
                      target="_blank"
                      className="text-[#5F3A36] underline font-semibold mt-1 inline-block"
                    >
                      Abrir carteira digital da cliente
                    </Link>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="w-7 h-7 text-lamarka-300" />
                    <span className="font-medium text-lamarka-700">Nenhuma movimentação registrada</span>
                    <p className="text-lamarka-400 font-light max-w-xs">
                      Esta cliente ainda não realizou compras com cashback registrado no clube.
                    </p>
                  </div>
                ) : (
                  transactions.slice(0, 8).map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-lamarka-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-lamarka-50 border border-lamarka-200/60 flex items-center justify-center shrink-0">
                            {getTxIcon(tx.type, tx.amount)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-lamarka-900 truncate">
                              {tx.description}
                            </p>
                            <p className="text-[10px] text-lamarka-400 font-light mt-0.5">
                              {formatTxDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-serif font-bold ${
                              isPositive ? 'text-emerald-700' : 'text-lamarka-900'
                            }`}
                          >
                            {isPositive ? '+' : '-'} R$ {formatBRL(Math.abs(tx.amount))}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Rodapé da Gaveta */}
          <div className="p-4 px-6 border-t border-lamarka-200/80 bg-lamarka-50/60 flex items-center justify-between gap-3 shrink-0">
            <Link
              href={`/admin/ajustes?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-lamarka-200 text-xs font-semibold text-lamarka-700 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-lamarka-500" />
              <span>Ajustar Saldo</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
            >
              Fechar Visualização
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
