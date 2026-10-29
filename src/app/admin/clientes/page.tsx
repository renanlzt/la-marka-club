'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Wallet,
  ExternalLink,
  MessageCircle,
  Sliders,
  Sparkles,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  ShoppingBag,
  Copy,
  Check,
  User,
  Clock,
  Filter,
  Pencil,
  X,
  Eye,
  Gift,
  Crown,
} from 'lucide-react';
import CustomerDrawer, { SellerInfo } from '@/components/admin/CustomerDrawer';

export type SmartSegmentType =
  | 'INACTIVE_45D'
  | 'EXPIRING_15D'
  | 'BIRTHDAYS_WEEK'
  | 'TOP_TIER';

interface CustomerSummary {
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
    lastPurchaseDate?: string | null;
  };
  segmentContext?: {
    daysInactive?: number;
    daysUntilExpiration?: number | null;
    isBirthdayWeek?: boolean;
    tier?: string;
    suggestedWhatsAppMessage?: string;
    whatsAppUrl?: string;
  };
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WITH_BALANCE' | 'EXPIRING' | 'BIRTHDAYS'>('ALL');
  const [activeSegment, setActiveSegment] = useState<SmartSegmentType | null>(null);
  const [segmentCounts, setSegmentCounts] = useState({
    INACTIVE_45D: 0,
    EXPIRING_15D: 0,
    BIRTHDAYS_WEEK: 0,
    TOP_TIER: 0,
  });
  const [segmentCustomersMap, setSegmentCustomersMap] = useState<Partial<Record<SmartSegmentType, CustomerSummary[]>>>({});
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [sortBy, setSortBy] = useState<'RECENT' | 'BALANCE_DESC' | 'NAME_ASC' | 'PURCHASES_DESC'>('RECENT');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Estado para Gaveta Lateral 360º de Clientes
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sellers, setSellers] = useState<SellerInfo[]>([]);

  // Estado para Edição de Cliente
  const [editingCustomer, setEditingCustomer] = useState<CustomerSummary | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    birthDay: '',
    birthMonth: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchSegmentCounts = async () => {
    try {
      const res = await fetch('/api/admin/clientes/segmentos');
      const data = await res.json();
      if (data.counts) {
        setSegmentCounts(data.counts);
      }
    } catch (err) {
      console.error('Erro ao buscar contagens de segmentos:', err);
    }
  };

  const fetchSegmentCustomers = async (type: SmartSegmentType) => {
    if (segmentCustomersMap[type]) return;
    setLoadingSegment(true);
    try {
      const res = await fetch(`/api/admin/clientes/segmentos?type=${type}`);
      const data = await res.json();
      if (data.customers) {
        setSegmentCustomersMap((prev) => ({
          ...prev,
          [type]: data.customers,
        }));
      }
      if (data.counts) {
        setSegmentCounts(data.counts);
      }
    } catch (err) {
      console.error(`Erro ao carregar clientes do segmento ${type}:`, err);
    } finally {
      setLoadingSegment(false);
    }
  };

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    try {
      const url = query.trim()
        ? `/api/admin/clientes?q=${encodeURIComponent(query.trim())}`
        : '/api/admin/clientes';
      const res = await fetch(url);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
      fetchSegmentCounts();
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch('/api/admin/vendedores')
      .then((res) => res.json())
      .then((data) => {
        if (data.sellers) {
          setSellers(data.sellers);
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar vendedoras para a visão 360º:', err);
      });
    fetchSegmentCounts();
  }, []);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const today = useMemo(() => new Date(), []);

  // Regras de detecção em memória para clientes
  const isInactive = (c: CustomerSummary) => {
    if (c.segmentContext?.daysInactive !== undefined) {
      return c.segmentContext.daysInactive >= 45;
    }
    const lastPurchase = c.stats?.lastPurchaseDate ? new Date(c.stats.lastPurchaseDate) : null;
    const baseDate = lastPurchase || new Date(c.createdAt);
    const diffDays = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 45;
  };

  const isExpiring = (c: CustomerSummary) => {
    return (
      (c.balanceInfo?.availableBalance || 0) > 0 &&
      c.balanceInfo?.expiringInDays !== null &&
      c.balanceInfo?.expiringInDays !== undefined &&
      c.balanceInfo.expiringInDays <= 15
    );
  };

  const isBirthdayWeek = (c: CustomerSummary) => {
    if (c.segmentContext?.isBirthdayWeek !== undefined) {
      return c.segmentContext.isBirthdayWeek;
    }
    if (!c.birthDay || !c.birthMonth) return false;
    for (let i = 0; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (d.getMonth() + 1 === c.birthMonth && d.getDate() === c.birthDay) {
        return true;
      }
    }
    return false;
  };

  const isTopTier = (c: CustomerSummary) => {
    return (c.stats?.totalPurchases || 0) >= 2 || (c.stats?.totalEarned || 0) >= 100;
  };

  const handleToggleSegment = (seg: SmartSegmentType) => {
    if (activeSegment === seg) {
      setActiveSegment(null);
    } else {
      setActiveSegment(seg);
      setActiveFilter('ALL');
      fetchSegmentCustomers(seg);
    }
  };

  // Métricas agregadas
  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const totalBalance = customers.reduce(
      (acc, c) => acc + (c.balanceInfo.availableBalance || 0),
      0
    );
    const withBalanceCount = customers.filter(
      (c) => c.balanceInfo.availableBalance > 0
    ).length;
    const birthdaysCount = customers.filter(
      (c) => c.birthMonth === currentMonth
    ).length;

    return { totalCount, totalBalance, withBalanceCount, birthdaysCount };
  }, [customers, currentMonth]);

  // Filtragem e ordenação
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (activeSegment) {
      if (segmentCustomersMap[activeSegment]) {
        result = [...segmentCustomersMap[activeSegment]!];
      } else {
        if (activeSegment === 'INACTIVE_45D') {
          result = result.filter(isInactive);
        } else if (activeSegment === 'EXPIRING_15D') {
          result = result.filter(isExpiring);
        } else if (activeSegment === 'BIRTHDAYS_WEEK') {
          result = result.filter(isBirthdayWeek);
        } else if (activeSegment === 'TOP_TIER') {
          result = result.filter(isTopTier);
        }
      }
    } else {
      if (activeFilter === 'WITH_BALANCE') {
        result = result.filter((c) => c.balanceInfo.availableBalance > 0);
      } else if (activeFilter === 'EXPIRING') {
        result = result.filter(
          (c) => c.balanceInfo.expiringInDays !== null && c.balanceInfo.expiringInDays <= 15
        );
      } else if (activeFilter === 'BIRTHDAYS') {
        result = result.filter((c) => c.birthMonth === currentMonth);
      }
    }

    // Filtro de busca textual caso esteja ativo
    if (searchQuery.trim() && activeSegment) {
      const q = searchQuery.toLowerCase().trim();
      const digits = q.replace(/\D/g, '');
      result = result.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneMatch = digits.length >= 3 && c.phone.includes(digits);
        const cpfMatch = c.cpf && digits.length >= 3 && c.cpf.includes(digits);
        return nameMatch || phoneMatch || cpfMatch;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'BALANCE_DESC') {
        return b.balanceInfo.availableBalance - a.balanceInfo.availableBalance;
      }
      if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name, 'pt-BR');
      }
      if (sortBy === 'PURCHASES_DESC') {
        return (b.stats?.totalPurchases || 0) - (a.stats?.totalPurchases || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [
    customers,
    activeSegment,
    segmentCustomersMap,
    activeFilter,
    searchQuery,
    sortBy,
    currentMonth,
    today,
  ]);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const handleCopyLink = (magicToken: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/c/${magicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(magicToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getMonthName = (m: number | null) => {
    if (!m) return '';
    const months = [
      '',
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return months[m] || '';
  };

  /**
   * Constrói link contextualizado do WhatsApp de acordo com o segmento ativo ou situação da cliente
   */
  const buildWhatsAppUrl = (
    c: CustomerSummary,
    targetSegment?: SmartSegmentType | null
  ) => {
    const cleanPhone = c.phone.replace(/\D/g, '');
    const fullPhone =
      cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const firstName = c.name.trim().split(/\s+/)[0] || 'Cliente';
    const saldo = `R$ ${formatBRL(c.balanceInfo?.availableBalance || 0)}`;
    const expiringAmt = c.balanceInfo?.expiringAmount || c.balanceInfo?.availableBalance || 0;
    const expiringSaldo = `R$ ${formatBRL(expiringAmt)}`;
    const days = c.balanceInfo?.expiringInDays;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://lamarka.com.br';
    const walletUrl = `${origin}/c/${c.magicToken}`;

    const seg = targetSegment || activeSegment;

    if (seg === 'INACTIVE_45D') {
      const text = `Olá, ${firstName}! Sentimos sua falta aqui na La Marka... você tem ${saldo} de saldo esperando por você! ✨\n\nVenha nos visitar e conferir as novidades da nossa nova coleção:\n👉 ${walletUrl}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    }

    if (seg === 'EXPIRING_15D') {
      const text = `Olá, ${firstName}! Seu cashback de ${expiringSaldo} expira em breve...${
        days !== null && days !== undefined ? ` (em ${days} dia${days !== 1 ? 's' : ''})!` : ''
      } Não deixe seu saldo expirar! Venha escolher suas peças favoritas na La Marka 💕\n\nConfira seu extrato aqui:\n👉 ${walletUrl}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    }

    if (seg === 'BIRTHDAYS_WEEK') {
      const text = `Olá, ${firstName}! Parabéns pelo seu aniversário nesta semana! A La Marka comemora o seu dia com você! 🎂✨\nVocê tem ${saldo} de saldo especial esperando por você para escolher o seu presente!\n\nConfira sua carteira digital:\n👉 ${walletUrl}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    }

    if (seg === 'TOP_TIER') {
      const text = `Olá, ${firstName}! Como uma de nossas clientes VIP mais especiais da La Marka, preparamos novidades exclusivas para você! ✨\nVocê tem ${saldo} de saldo disponível para novas peças.\n\nVeja sua carteira VIP:\n👉 ${walletUrl}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    }

    // Se a cliente possui cashback prestes a expirar no fluxo padrão
    if (
      c.balanceInfo?.expiringInDays !== null &&
      c.balanceInfo?.expiringInDays !== undefined &&
      c.balanceInfo.expiringInDays <= 15 &&
      c.balanceInfo.availableBalance > 0
    ) {
      const text = `Olá, ${firstName}! Seu cashback de ${expiringSaldo} expira em breve... Não deixe seu saldo expirar! Venha escolher suas peças favoritas na La Marka 💕\n\nConfira seu extrato aqui:\n👉 ${walletUrl}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    }

    return `https://wa.me/${fullPhone}`;
  };

  const handleOpenEditModal = (customer: CustomerSummary) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      cpf: customer.cpf || '',
      birthDay: customer.birthDay ? String(customer.birthDay) : '',
      birthMonth: customer.birthMonth ? String(customer.birthMonth) : '',
      notes: customer.notes || '',
    });
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingCustomer(null);
    setEditError(null);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer.id,
          name: editFormData.name,
          phone: editFormData.phone,
          cpf: editFormData.cpf || null,
          birthDay: editFormData.birthDay ? parseInt(editFormData.birthDay, 10) : null,
          birthMonth: editFormData.birthMonth ? parseInt(editFormData.birthMonth, 10) : null,
          notes: editFormData.notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar alterações');
      }

      await fetchCustomers(searchQuery);

      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer((prev) =>
          prev
            ? {
                ...prev,
                name: editFormData.name,
                phone: editFormData.phone.replace(/\D/g, ''),
                cpf: editFormData.cpf ? editFormData.cpf.replace(/\D/g, '') : null,
                birthDay: editFormData.birthDay ? parseInt(editFormData.birthDay, 10) : null,
                birthMonth: editFormData.birthMonth ? parseInt(editFormData.birthMonth, 10) : null,
                notes: editFormData.notes || null,
              }
            : null
        );
      }

      setEditingCustomer(null);
    } catch (err: any) {
      setEditError(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <Users className="w-3 h-3 text-[#DFB76C]" /> Base de Clientes
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Clientes & Carteiras Digitais
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            Consulte a carteira de cada cliente, saldos de cashback em tempo real e links diretos de acesso.
          </p>
        </div>

        <Link
          href="/balcao"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4.5 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-luxury hover:shadow-luxury-lg transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.5} />
          Novo Cadastro no Balcão
        </Link>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Total Cadastradas
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-lamarka-900">
            {metrics.totalCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Clientes no clube
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Saldo em Circulação
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-lamarka-800">
            R$ {formatBRL(metrics.totalBalance)}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Total disponível em R$
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Com Saldo Ativo
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-emerald-800">
            {metrics.withBalanceCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Prontas para resgatar
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Aniversariantes
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-amber-800">
            {metrics.birthdaysCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            No mês atual
          </span>
        </div>
      </div>

      {/* Barra Elegante de Filtros Rápidos de Inteligência & Recompra */}
      <div className="bg-gradient-to-r from-[#FAF6F0] via-white to-[#FAF6F0] rounded-3xl border border-[#DFB76C]/35 p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DFB76C]/20 border border-[#DFB76C]/40 flex items-center justify-center text-[#9A7328] shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#B89648]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-serif font-semibold text-lamarka-900 leading-tight">
                  Inteligência de Recompra & Retenção
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#DFB76C]/20 text-[#8C6219] border border-[#DFB76C]/30">
                  Ações Rápidas
                </span>
              </div>
              <p className="text-xs text-lamarka-600 font-light mt-0.5">
                Segmentação preditiva para ações de fidelização com disparos contextuais de WhatsApp prontos em 1 clique.
              </p>
            </div>
          </div>

          {activeSegment && (
            <button
              type="button"
              onClick={() => setActiveSegment(null)}
              className="text-xs text-lamarka-600 hover:text-lamarka-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lamarka-200 bg-white hover:bg-lamarka-100 transition-colors shadow-2xs self-start sm:self-auto font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver Todas as Clientes</span>
            </button>
          )}
        </div>

        {/* Badges de Filtros Rápidos com Contadores em Tempo Real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* [🛍️ Inativas há 45d] */}
          <button
            type="button"
            onClick={() => handleToggleSegment('INACTIVE_45D')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 ${
              activeSegment === 'INACTIVE_45D'
                ? 'bg-amber-900 text-white border-amber-950 shadow-md ring-2 ring-amber-700/50'
                : 'bg-white hover:bg-amber-50/60 border-amber-200/90 text-lamarka-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🛍️</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSegment === 'INACTIVE_45D'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-300/80'
                }`}
              >
                {segmentCounts.INACTIVE_45D}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">Inativas há 45d</div>
              <div
                className={`text-[10px] font-light mt-0.5 ${
                  activeSegment === 'INACTIVE_45D' ? 'text-amber-200' : 'text-lamarka-500'
                }`}
              >
                Reativar com saldo disponível
              </div>
            </div>
          </button>

          {/* [⚠️ Vencendo em 15d] */}
          <button
            type="button"
            onClick={() => handleToggleSegment('EXPIRING_15D')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 ${
              activeSegment === 'EXPIRING_15D'
                ? 'bg-rose-900 text-white border-rose-950 shadow-md ring-2 ring-rose-700/50'
                : 'bg-white hover:bg-rose-50/60 border-rose-200/90 text-lamarka-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">⚠️</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSegment === 'EXPIRING_15D'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-100 text-rose-900 border border-rose-300/80'
                }`}
              >
                {segmentCounts.EXPIRING_15D}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">Vencendo em 15d</div>
              <div
                className={`text-[10px] font-light mt-0.5 ${
                  activeSegment === 'EXPIRING_15D' ? 'text-rose-200' : 'text-lamarka-500'
                }`}
              >
                Evitar perda de cashback
              </div>
            </div>
          </button>

          {/* [🎂 Aniversariantes da Semana] */}
          <button
            type="button"
            onClick={() => handleToggleSegment('BIRTHDAYS_WEEK')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 ${
              activeSegment === 'BIRTHDAYS_WEEK'
                ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-700/50'
                : 'bg-white hover:bg-purple-50/60 border-purple-200/90 text-lamarka-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🎂</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSegment === 'BIRTHDAYS_WEEK'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 text-purple-900 border border-purple-300/80'
                }`}
              >
                {segmentCounts.BIRTHDAYS_WEEK}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">Aniversariantes (7d)</div>
              <div
                className={`text-[10px] font-light mt-0.5 ${
                  activeSegment === 'BIRTHDAYS_WEEK' ? 'text-purple-200' : 'text-lamarka-500'
                }`}
              >
                Parabenizar & enviar presente
              </div>
            </div>
          </button>

          {/* [👑 VIP / Top Tier] */}
          <button
            type="button"
            onClick={() => handleToggleSegment('TOP_TIER')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 ${
              activeSegment === 'TOP_TIER'
                ? 'bg-lamarka-900 text-white border-lamarka-950 shadow-md ring-2 ring-[#DFB76C]/60'
                : 'bg-white hover:bg-[#FAF6F0] border-[#DFB76C]/50 text-lamarka-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">👑</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSegment === 'TOP_TIER'
                    ? 'bg-[#DFB76C]/30 text-amber-200'
                    : 'bg-[#DFB76C]/20 text-[#8C6219] border border-[#DFB76C]/40'
                }`}
              >
                {segmentCounts.TOP_TIER}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">Clientes VIP / Top</div>
              <div
                className={`text-[10px] font-light mt-0.5 ${
                  activeSegment === 'TOP_TIER' ? 'text-amber-200' : 'text-lamarka-500'
                }`}
              >
                Maior fidelidade & volume
              </div>
            </div>
          </button>
        </div>

        {/* Banner Informativo do Segmento Selecionado */}
        {activeSegment && (
          <div className="mt-4 pt-3.5 border-t border-lamarka-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-lamarka-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#DFB76C] animate-ping" />
              {activeSegment === 'INACTIVE_45D' && (
                <span>
                  Exibindo clientes sem compras há mais de 45 dias. Use o botão <strong>Recompra WhatsApp</strong> para incentivá-las a retornar aproveitando seu saldo.
                </span>
              )}
              {activeSegment === 'EXPIRING_15D' && (
                <span>
                  Exibindo clientes com cashback vencendo nos próximos 15 dias. Use o botão <strong>Avisar Vencimento</strong> para lembrá-las antes de perderem o saldo.
                </span>
              )}
              {activeSegment === 'BIRTHDAYS_WEEK' && (
                <span>
                  Exibindo aniversariantes dos próximos 7 dias. Envie uma mensagem carinhosa de parabéns pelo WhatsApp!
                </span>
              )}
              {activeSegment === 'TOP_TIER' && (
                <span>
                  Exibindo clientes de maior fidelidade e volume de compras no clube La Marka.
                </span>
              )}
            </div>

            <span className="text-[11px] text-lamarka-500 shrink-0 font-light">
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} no segmento
            </span>
          </div>
        )}
      </div>

      {/* Barra de Pesquisa, Filtros Clássicos e Ordenação */}
      <div className="bg-white rounded-2xl border border-lamarka-200/90 p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400"
            />
          </div>

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-lamarka-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-3 rounded-xl border border-lamarka-200 bg-white text-lamarka-800 focus:outline-none focus:ring-2 focus:ring-lamarka-400"
            >
              <option value="RECENT">Mais Recentes</option>
              <option value="BALANCE_DESC">Maior Saldo (R$)</option>
              <option value="NAME_ASC">Nome (A - Z)</option>
              <option value="PURCHASES_DESC">Mais Compras</option>
            </select>
          </div>
        </div>

        {/* Abas de Filtros Clássicos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-lamarka-100">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('ALL');
              setActiveSegment(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'ALL' && !activeSegment
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Todas ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('WITH_BALANCE');
              setActiveSegment(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'WITH_BALANCE' && !activeSegment
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Com Saldo Ativo ({metrics.withBalanceCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('EXPIRING');
              setActiveSegment(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'EXPIRING' && !activeSegment
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Próximos do Vencimento (&le; 15 dias)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('BIRTHDAYS');
              setActiveSegment(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'BIRTHDAYS' && !activeSegment
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Aniversariantes do Mês ({metrics.birthdaysCount})
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-sm overflow-hidden">
        {loading || loadingSegment ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-lamarka-600 border-t-transparent rounded-full animate-spin" />
            <span>Buscando clientes no clube...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-lamarka-300" />
            <span className="font-medium text-sm text-lamarka-700">Nenhuma cliente encontrada</span>
            <p className="text-lamarka-400 font-light max-w-sm">
              {activeSegment
                ? 'Não há clientes correspondentes a este segmento inteligente no momento.'
                : 'Tente buscar por outro termo ou cadastre novas clientes no balcão de vendas.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-lamarka-100">
            {filteredCustomers.map((c) => {
              const initials = c.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              const hasExpiring =
                c.balanceInfo.expiringInDays !== null && c.balanceInfo.expiringInDays <= 15;
              const customerIsInactive = isInactive(c);
              const customerIsBirthdayWeek = isBirthdayWeek(c);
              const customerIsTopTier = isTopTier(c);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsDrawerOpen(true);
                  }}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer transition-all duration-150 border-l-4 group ${
                    selectedCustomer?.id === c.id && isDrawerOpen
                      ? 'bg-lamarka-100/70 border-l-lamarka-800 shadow-2xs'
                      : 'border-l-transparent hover:border-l-lamarka-500/80 hover:bg-lamarka-50/70'
                  }`}
                >
                  {/* Dados Básicos da Cliente */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-lamarka-100 border border-lamarka-200 text-lamarka-800 flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-2xs group-hover:border-lamarka-300 group-hover:bg-[#EADBD7] transition-colors">
                      {initials}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold text-lamarka-900 leading-tight group-hover:text-lamarka-950 transition-colors">
                          {c.name}
                        </h2>

                        {/* Badges de Inteligência de Segmentos */}
                        {customerIsBirthdayWeek ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-semibold border border-purple-200">
                            🎂 Aniversariante (7d)
                          </span>
                        ) : c.birthMonth === currentMonth ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                            🎂 Aniversariante do Mês
                          </span>
                        ) : null}

                        {hasExpiring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-semibold border border-rose-200">
                            ⚠️ Expira em {c.balanceInfo.expiringInDays}d
                          </span>
                        )}

                        {customerIsInactive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                            🛍️ Inativa &gt;45d
                          </span>
                        )}

                        {customerIsTopTier && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DFB76C]/20 text-[#8C6219] text-[10px] font-semibold border border-[#DFB76C]/40">
                            👑 VIP
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-lamarka-600 font-light">
                        <span>
                          Tel: <strong>{formatPhone(c.phone)}</strong>
                        </span>
                        {c.cpf && <span>CPF: {c.cpf}</span>}
                        {c.birthDay && c.birthMonth && (
                          <span className="inline-flex items-center gap-1 text-lamarka-500">
                            <Calendar className="w-3 h-3 text-lamarka-400" />
                            {c.birthDay} de {getMonthName(c.birthMonth)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Saldo e Vencimento */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 self-start lg:self-auto">
                    {/* Saldo Atual */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-lamarka-500 font-medium uppercase tracking-wider">
                        Saldo Disponível
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-serif font-bold text-lamarka-900">
                          R$ {formatBRL(c.balanceInfo.availableBalance)}
                        </span>
                      </div>

                      {/* Aviso de Vencimento se houver */}
                      {hasExpiring ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          R$ {formatBRL(c.balanceInfo.expiringAmount)} expira em{' '}
                          {c.balanceInfo.expiringInDays}d
                        </span>
                      ) : c.balanceInfo.availableBalance > 0 ? (
                        <span className="text-[11px] text-lamarka-500 font-light">
                          Válido em carteira
                        </span>
                      ) : (
                        <span className="text-[11px] text-lamarka-400 font-light">
                          Sem saldo acumulado
                        </span>
                      )}
                    </div>

                    {/* Resumo de Compras */}
                    <div className="hidden sm:flex flex-col text-right lg:text-left border-l border-lamarka-100 pl-4">
                      <span className="text-[10px] text-lamarka-500 font-medium uppercase tracking-wider">
                        Histórico
                      </span>
                      <span className="text-xs text-lamarka-700 font-medium">
                        {c.stats.totalPurchases} compra{c.stats.totalPurchases !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] text-lamarka-500 font-light">
                        Resgatou R$ {formatBRL(c.stats.totalRedeemed)}
                      </span>
                    </div>

                    {/* Ações com a Cliente */}
                    <div className="flex items-center gap-2 ml-auto lg:ml-0">
                      {/* Botão Contextual de WhatsApp para Ações de Retenção */}
                      {activeSegment === 'INACTIVE_45D' ? (
                        <a
                          href={buildWhatsAppUrl(c, 'INACTIVE_45D')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Enviar WhatsApp de recompra: 'Olá, {primeiro_nome}! Sentimos sua falta aqui na La Marka... você tem {saldo_total} de saldo esperando por você!'"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all border border-amber-700"
                        >
                          <MessageCircle className="w-4 h-4 text-amber-100" strokeWidth={1.5} />
                          <span>Recompra WhatsApp</span>
                        </a>
                      ) : activeSegment === 'EXPIRING_15D' ? (
                        <a
                          href={buildWhatsAppUrl(c, 'EXPIRING_15D')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Enviar aviso de vencimento: 'Olá, {primeiro_nome}! Seu cashback de {saldo_total} expira em breve...'"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all border border-rose-700"
                        >
                          <MessageCircle className="w-4 h-4 text-rose-100" strokeWidth={1.5} />
                          <span>Avisar Vencimento</span>
                        </a>
                      ) : activeSegment === 'BIRTHDAYS_WEEK' ? (
                        <a
                          href={buildWhatsAppUrl(c, 'BIRTHDAYS_WEEK')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Enviar parabéns de aniversário via WhatsApp"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all border border-purple-700"
                        >
                          <MessageCircle className="w-4 h-4 text-purple-100" strokeWidth={1.5} />
                          <span>Parabéns WhatsApp</span>
                        </a>
                      ) : activeSegment === 'TOP_TIER' ? (
                        <a
                          href={buildWhatsAppUrl(c, 'TOP_TIER')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Enviar mensagem VIP no WhatsApp"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all border border-lamarka-950"
                        >
                          <MessageCircle className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.5} />
                          <span>VIP WhatsApp</span>
                        </a>
                      ) : (
                        <a
                          href={buildWhatsAppUrl(c, null)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Conversar no WhatsApp com mensagem personalizada"
                          className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                        >
                          <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                        </a>
                      )}

                      {/* Botão Ver Detalhes 360º (Twenty CRM) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                          setIsDrawerOpen(true);
                        }}
                        title="Abrir Visão 360º da Cliente (Twenty CRM)"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lamarka-100 hover:bg-lamarka-200 text-lamarka-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all border border-lamarka-300/60"
                      >
                        <Eye className="w-3.5 h-3.5 text-lamarka-700" strokeWidth={1.5} />
                        <span>360º</span>
                      </button>

                      {/* Botão Copiar Link da Carteira */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(c.magicToken);
                        }}
                        title="Copiar link da carteira digital"
                        className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors shadow-2xs"
                      >
                        {copiedToken === c.magicToken ? (
                          <Check className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                        ) : (
                          <Copy className="w-4 h-4" strokeWidth={1.5} />
                        )}
                      </button>

                      {/* Botão Ver Carteira Digital */}
                      <Link
                        href={`/c/${c.magicToken}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5 text-[#DFB76C]" strokeWidth={1.5} />
                        <span>Ver Carteira</span>
                        <ExternalLink className="w-3 h-3 text-lamarka-300" strokeWidth={1.5} />
                      </Link>

                      {/* Botão Editar Dados */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(c);
                        }}
                        title="Editar dados da cliente"
                        className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors shadow-2xs"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>

                      {/* Botão Ajustar Saldo */}
                      <Link
                        href={`/admin/ajustes?customerId=${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Ajustar saldo manualmente"
                        className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors shadow-2xs"
                      >
                        <Sliders className="w-4 h-4" strokeWidth={1.5} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição de Cliente */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-lamarka-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-lamarka-100 flex items-center justify-between bg-lamarka-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#DFB76C]/15 border border-[#DFB76C]/30 flex items-center justify-center text-lamarka-800">
                  <Pencil className="w-4 h-4 text-[#B89648]" />
                </div>
                <div>
                  <h3 className="font-serif font-medium text-lamarka-900 text-lg">Editar Dados da Cliente</h3>
                  <p className="text-xs text-lamarka-500">Altere informações cadastrais e de contato</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="text-lamarka-400 hover:text-lamarka-700 p-1.5 rounded-lg hover:bg-lamarka-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Nome da cliente"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="(49) 99999-9999"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                    CPF (opcional)
                  </label>
                  <input
                    type="text"
                    value={editFormData.cpf}
                    onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  Data de Nascimento (Aniversário)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={editFormData.birthDay}
                      onChange={(e) => setEditFormData({ ...editFormData, birthDay: e.target.value })}
                      placeholder="Dia (1 a 31)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                    />
                  </div>
                  <div>
                    <select
                      value={editFormData.birthMonth}
                      onChange={(e) => setEditFormData({ ...editFormData, birthMonth: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                    >
                      <option value="">Selecione o mês...</option>
                      <option value="1">01 - Janeiro</option>
                      <option value="2">02 - Fevereiro</option>
                      <option value="3">03 - Março</option>
                      <option value="4">04 - Abril</option>
                      <option value="5">05 - Maio</option>
                      <option value="6">06 - Junho</option>
                      <option value="7">07 - Julho</option>
                      <option value="8">08 - Agosto</option>
                      <option value="9">09 - Setembro</option>
                      <option value="10">10 - Outubro</option>
                      <option value="11">11 - Novembro</option>
                      <option value="12">12 - Dezembro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  Observações / Notas Internas
                </label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Preferências de estilo, tamanhos de roupa, observações de atendimento..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-lamarka-100">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-xl border border-lamarka-200 text-xs font-semibold text-lamarka-700 hover:bg-lamarka-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gaveta Lateral Deslizante (Slide-over Drawer) 360º de Clientes inspirada no Twenty CRM */}
      <CustomerDrawer
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCustomer(null);
        }}
        onEdit={(customerToEdit) => handleOpenEditModal(customerToEdit)}
        sellers={sellers}
      />
    </div>
  );
}
