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
  UserCheck,
  Clock,
  Filter,
} from 'lucide-react';

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  notes: string | null;
  magicToken: string;
  isSeller: boolean;
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

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WITH_BALANCE' | 'EXPIRING' | 'BIRTHDAYS' | 'SELLERS'>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'BALANCE_DESC' | 'NAME_ASC' | 'PURCHASES_DESC'>('RECENT');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [togglingSellerId, setTogglingSellerId] = useState<string | null>(null);

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

  const handleToggleSeller = async (customerId: string, currentStatus: boolean) => {
    setTogglingSellerId(customerId);
    try {
      const res = await fetch('/api/admin/clientes/vendedora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, isSeller: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, isSeller: data.isSeller } : c))
        );
      }
    } finally {
      setTogglingSellerId(null);
    }
  };

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

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
    const sellersCount = customers.filter((c) => c.isSeller).length;

    return { totalCount, totalBalance, withBalanceCount, birthdaysCount, sellersCount };
  }, [customers, currentMonth]);

  // Filtragem e ordenação
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (activeFilter === 'WITH_BALANCE') {
      result = result.filter((c) => c.balanceInfo.availableBalance > 0);
    } else if (activeFilter === 'EXPIRING') {
      result = result.filter(
        (c) => c.balanceInfo.expiringInDays !== null && c.balanceInfo.expiringInDays <= 15
      );
    } else if (activeFilter === 'BIRTHDAYS') {
      result = result.filter((c) => c.birthMonth === currentMonth);
    } else if (activeFilter === 'SELLERS') {
      result = result.filter((c) => c.isSeller);
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
  }, [customers, activeFilter, sortBy, currentMonth]);

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

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-lamarka-200/80 text-lamarka-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-lamarka-600" /> Base de Clientes
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-lamarka-900">
            Clientes & Carteiras Digitais
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            Consulte a carteira de cada cliente, saldos de cashback em tempo real e links diretos de acesso.
          </p>
        </div>

        <Link
          href="/balcao"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Sparkles className="w-4 h-4 text-lamarka-300" />
          Novo Cadastro no Balcão
        </Link>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-lamarka-200/90 shadow-2xs">
          <span className="text-[11px] text-lamarka-500 font-medium uppercase tracking-wider block mb-1">
            Total Cadastradas
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-lamarka-900">
            {metrics.totalCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Clientes no clube
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-lamarka-200/90 shadow-2xs">
          <span className="text-[11px] text-lamarka-500 font-medium uppercase tracking-wider block mb-1">
            Saldo em Circulação
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-lamarka-800">
            R$ {formatBRL(metrics.totalBalance)}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Total disponível em R$
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-lamarka-200/90 shadow-2xs">
          <span className="text-[11px] text-lamarka-500 font-medium uppercase tracking-wider block mb-1">
            Com Saldo Ativo
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-800">
            {metrics.withBalanceCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Prontas para resgatar
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-lamarka-200/90 shadow-2xs">
          <span className="text-[11px] text-lamarka-500 font-medium uppercase tracking-wider block mb-1">
            Aniversariantes
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-amber-800">
            {metrics.birthdaysCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            No mês atual
          </span>
        </div>
      </div>

      {/* Barra de Pesquisa, Filtros e Ordenação */}
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

        {/* Abas de Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-lamarka-100">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Todas ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('WITH_BALANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'WITH_BALANCE'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Com Saldo Ativo ({metrics.withBalanceCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('EXPIRING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'EXPIRING'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Próximos do Vencimento (&le; 15 dias)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('BIRTHDAYS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'BIRTHDAYS'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Aniversariantes do Mês ({metrics.birthdaysCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SELLERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'SELLERS'
                ? 'bg-purple-800 text-white shadow-2xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            ✨ Vendedoras ({metrics.sellersCount})
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-lamarka-600 border-t-transparent rounded-full animate-spin" />
            <span>Buscando clientes no clube...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-lamarka-300" />
            <span className="font-medium text-sm text-lamarka-700">Nenhuma cliente encontrada</span>
            <p className="text-lamarka-400 font-light max-w-sm">
              Tente buscar por outro termo ou cadastre novas clientes no balcão de vendas.
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

              return (
                <div
                  key={c.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-lamarka-50/40 transition-colors"
                >
                  {/* Dados Básicos da Cliente */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-lamarka-100 border border-lamarka-200 text-lamarka-800 flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-2xs">
                      {initials}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold text-lamarka-900 leading-tight">
                          {c.name}
                        </h2>

                        {c.isSeller && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-semibold border border-purple-200">
                            ✨ Vendedora
                          </span>
                        )}

                        {c.birthMonth === currentMonth && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                            🎂 Aniversariante do Mês
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-lamarka-600 font-light">
                        <span>Tel: <strong>{formatPhone(c.phone)}</strong></span>
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
                          R$ {formatBRL(c.balanceInfo.expiringAmount)} expira em {c.balanceInfo.expiringInDays}d
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
                      {/* Botão Copiar Link da Carteira */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(c.magicToken)}
                        title="Copiar link da carteira digital"
                        className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors"
                      >
                        {copiedToken === c.magicToken ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Botão WhatsApp */}
                      <a
                        href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Conversar no WhatsApp"
                        className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Botão Ver Carteira Digital */}
                      <Link
                        href={`/c/${c.magicToken}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Wallet className="w-3.5 h-3.5 text-lamarka-300" />
                        <span>Ver Carteira</span>
                        <ExternalLink className="w-3 h-3 text-lamarka-400" />
                      </Link>

                      {/* Botão Ajustar Saldo */}
                      <Link
                        href={`/admin/ajustes?customerId=${c.id}`}
                        title="Ajustar saldo manualmente"
                        className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors"
                      >
                        <Sliders className="w-4 h-4" />
                      </Link>

                      {/* Botão Tornar/Remover Vendedora */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeller(c.id, c.isSeller)}
                        disabled={togglingSellerId === c.id}
                        title={
                          c.isSeller
                            ? 'Remover status de vendedora desta cliente'
                            : 'Marcar esta cliente como vendedora da loja'
                        }
                        className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                          c.isSeller
                            ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                            : 'border-lamarka-200 text-lamarka-500 hover:bg-lamarka-100 hover:text-lamarka-800'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
