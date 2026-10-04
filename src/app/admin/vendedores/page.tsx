'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Search,
  Check,
  X,
  Phone,
  Tag,
  Users,
  Edit2,
  Trash2,
  Sparkles,
  Store,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

interface SellerItem {
  id: string;
  name: string;
  phone: string | null;
  code: string | null;
  active: boolean;
  customerId: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

export default function AdminVendedoresPage() {
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerItem | null>(null);
  const [mode, setMode] = useState<'NEW' | 'LINK_CUSTOMER'>('LINK_CUSTOMER');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    code: '',
    customerId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Carregar dados
  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendedores');
      const data = await res.json();
      if (data.sellers) {
        setSellers(data.sellers);
      }
    } catch (err) {
      console.error('Erro ao buscar vendedoras:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOptions = async () => {
    try {
      const res = await fetch('/api/admin/clientes');
      const data = await res.json();
      if (data.customers) {
        setCustomers(
          data.customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao carregar clientes para vínculo:', err);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchCustomerOptions();
  }, []);

  // Formatação de telefone
  const formatPhone = (phone: string | null) => {
    if (!phone) return '—';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  // Filtragem
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.customer && s.customer.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterActive === 'ACTIVE') return s.active;
      if (filterActive === 'INACTIVE') return !s.active;
      return true;
    });
  }, [sellers, searchQuery, filterActive]);

  // Contadores
  const stats = useMemo(() => {
    const total = sellers.length;
    const activeCount = sellers.filter((s) => s.active).length;
    const linkedCount = sellers.filter((s) => s.customerId).length;
    return { total, activeCount, linkedCount };
  }, [sellers]);

  // Busca instantânea de clientes para transformar em vendedora
  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return customers.slice(0, 10);
    }
    const q = customerSearchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const qDigits = customerSearchQuery.replace(/\D/g, '');

    return customers
      .filter((c) => {
        const nameNorm = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchesName = nameNorm.includes(q);
        const matchesPhone = qDigits.length > 0 && c.phone.includes(qDigits);
        return matchesName || matchesPhone;
      })
      .slice(0, 30);
  }, [customers, customerSearchQuery]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === formData.customerId) || null;
  }, [customers, formData.customerId]);

  // Alternar status ativo
  const handleToggleActive = async (seller: SellerItem) => {
    try {
      const res = await fetch('/api/admin/vendedores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seller.id, active: !seller.active }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) => (s.id === seller.id ? { ...s, active: !s.active } : s))
        );
      }
    } catch (err) {
      console.error('Erro ao alternar status da vendedora:', err);
    }
  };

  // Excluir
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a vendedora "${name}"? Os registros de vendas anteriores serão preservados.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/vendedores?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSellers((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Erro ao excluir vendedora:', err);
    }
  };

  // Abrir modal novo
  const handleOpenNewModal = () => {
    setEditingSeller(null);
    setMode('LINK_CUSTOMER');
    setFormData({ name: '', phone: '', code: '', customerId: '' });
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Abrir modal editar
  const handleOpenEditModal = (seller: SellerItem) => {
    setEditingSeller(seller);
    setMode(seller.customerId ? 'LINK_CUSTOMER' : 'NEW');
    setFormData({
      name: seller.name,
      phone: seller.phone || '',
      code: seller.code || '',
      customerId: seller.customerId || '',
    });
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Quando escolhe cliente existente no seletor pesquisável
  const handleSelectCustomer = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        name: selected.name,
        phone: selected.phone,
      }));
      setCustomerSearchQuery('');
      setIsCustomerDropdownOpen(false);
    }
  };

  // Desvincular cliente para escolher outra
  const handleDeselectCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: '',
      name: '',
      phone: '',
    }));
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(true);
  };

  // Salvar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingSeller) {
        // Atualização
        const res = await fetch('/api/admin/vendedores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSeller.id,
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            code: formData.code.trim(),
            customerId: formData.customerId || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao atualizar vendedora.');
        }

        setSellers((prev) =>
          prev.map((s) => (s.id === editingSeller.id ? data.seller : s))
        );
        setIsModalOpen(false);
      } else {
        // Criação
        const res = await fetch('/api/admin/vendedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            code: formData.code.trim(),
            customerId: formData.customerId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao cadastrar vendedora.');
        }

        setSellers((prev) => [data.seller, ...prev]);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <UserCheck className="w-3 h-3 text-[#DFB76C]" /> Gestão de Equipe
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Equipe de Vendedoras
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            Cadastre e gerencie as consultoras de atendimento da loja. As vendedoras ativas aparecem diretamente no seletor do Caixa / Balcão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href="/balcao"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-lamarka-200 hover:bg-lamarka-100 text-lamarka-800 text-xs font-semibold shadow-2xs transition-all shrink-0 whitespace-nowrap"
          >
            <Store className="w-4 h-4 text-lamarka-600 shrink-0" strokeWidth={1.5} />
            <span>Ir para o Balcão</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-luxury hover:shadow-luxury-lg transition-all shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#DFB76C] shrink-0" strokeWidth={2} />
            <span>Nova Vendedora</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Total Cadastradas
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-lamarka-900">
            {stats.total}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Consultoras no sistema
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Ativas no Caixa
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-emerald-800">
            {stats.activeCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Aparecem no dropdown do balcão
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-lamarka-200/90 shadow-card">
          <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.15em] block mb-1">
            Vinculadas a Clientes
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-semibold text-purple-800">
            {stats.linkedCount}
          </div>
          <span className="text-[11px] text-lamarka-500 font-light">
            Possuem carteira de cliente vinculada
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-2xl border border-lamarka-200/90 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, código ou telefone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFilterActive('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterActive === 'ALL'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'text-lamarka-600 hover:bg-lamarka-100'
            }`}
          >
            Todas ({sellers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterActive === 'ACTIVE'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Ativas ({stats.activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterActive === 'INACTIVE'
                ? 'bg-zinc-800 text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Inativas ({stats.total - stats.activeCount})
          </button>
        </div>
      </div>

      {/* Tabela de Vendedoras */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-lamarka-600 border-t-transparent rounded-full animate-spin" />
            <span>Carregando vendedoras...</span>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="py-16 text-center text-xs text-lamarka-500 flex flex-col items-center justify-center gap-2">
            <UserCheck className="w-8 h-8 text-lamarka-300" />
            <span className="font-medium text-sm text-lamarka-700">Nenhuma vendedora encontrada</span>
            <p className="text-lamarka-400 font-light max-w-sm">
              Cadastre sua primeira consultora de vendas para registrar atendimentos no Caixa.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-lamarka-100">
            {filteredSellers.map((s) => {
              const initials = s.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={s.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-lamarka-50/40 transition-colors"
                >
                  {/* Dados Básicos */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-2xs ${
                        s.active
                          ? 'bg-lamarka-100 border-lamarka-200 text-lamarka-800'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                      }`}
                    >
                      {initials}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold text-lamarka-900 leading-tight">
                          {s.name}
                        </h2>

                        {s.code && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-lamarka-100 text-lamarka-700 text-[10px] font-mono font-medium border border-lamarka-200">
                            <Tag className="w-2.5 h-2.5 text-lamarka-500" />
                            {s.code}
                          </span>
                        )}

                        {s.customer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-200" title={`Vinculada à cliente: ${s.customer.name}`}>
                            <LinkIcon className="w-2.5 h-2.5 text-purple-500" />
                            Cliente Vinculada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                            Avulsa
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            s.active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {s.active ? '● Ativa no Balcão' : '○ Inativa'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-lamarka-600 font-light mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-lamarka-400" />
                          {formatPhone(s.phone)}
                        </span>
                        {s.customer && (
                          <span className="text-[11px] text-lamarka-500">
                            (Cadastro de cliente ativo)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Botão Alternar Ativo */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      title={s.active ? 'Desativar vendedora (não aparecerá no caixa)' : 'Ativar vendedora no caixa'}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors shadow-2xs ${
                        s.active
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {s.active ? 'Desativar' : 'Ativar'}
                    </button>

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(s)}
                      title="Editar dados da vendedora"
                      className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.name)}
                      title="Excluir vendedora"
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-lamarka-200 shadow-luxury-lg max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-lamarka-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-lamarka-100 text-lamarka-800">
                  <UserCheck className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-lamarka-900">
                  {editingSeller ? 'Editar Vendedora' : 'Nova Vendedora'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-lamarka-400 hover:text-lamarka-700 hover:bg-lamarka-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Seletor de Modo: Vincular Cliente ou Consultora Avulsa */}
              {!editingSeller && (
                <div className="flex rounded-xl bg-lamarka-100 p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LINK_CUSTOMER');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                      mode === 'LINK_CUSTOMER'
                        ? 'bg-white text-lamarka-900 shadow-2xs font-semibold'
                        : 'text-lamarka-600 hover:text-lamarka-800'
                    }`}
                  >
                    Vincular Cliente da Loja
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('NEW');
                      setFormData((prev) => ({ ...prev, customerId: '' }));
                      setIsCustomerDropdownOpen(false);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                      mode === 'NEW'
                        ? 'bg-white text-lamarka-900 shadow-2xs font-semibold'
                        : 'text-lamarka-600 hover:text-lamarka-800'
                    }`}
                  >
                    Consultora Avulsa
                  </button>
                </div>
              )}

              {/* Se estiver no modo Vincular Cliente */}
              {mode === 'LINK_CUSTOMER' && (
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider">
                    Pesquisar Cliente da Base *
                  </label>

                  {selectedCustomerObj ? (
                    <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-emerald-700" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                            Cliente Selecionada
                          </span>
                          <h4 className="text-xs font-bold text-emerald-950 truncate">
                            {selectedCustomerObj.name}
                          </h4>
                          <p className="text-[11px] text-emerald-700 font-light">
                            {formatPhone(selectedCustomerObj.phone)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeselectCustomer}
                        className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 transition-colors shadow-2xs shrink-0"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          onFocus={() => setIsCustomerDropdownOpen(true)}
                          placeholder="Digite o nome ou telefone da cliente..."
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400 bg-white shadow-2xs"
                          autoFocus
                        />
                        {customerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCustomerSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-lamarka-400 hover:text-lamarka-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isCustomerDropdownOpen && (
                        <div className="mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-lamarka-200 bg-white shadow-card divide-y divide-lamarka-100 z-30">
                          {filteredCustomerOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-lamarka-500 font-light">
                              Nenhuma cliente encontrada com "{customerSearchQuery}"
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-1.5 bg-lamarka-50 text-[10px] font-semibold text-lamarka-500 uppercase tracking-wider flex items-center justify-between">
                                <span>{customerSearchQuery ? `Resultados (${filteredCustomerOptions.length})` : 'Sugestões recentes'}</span>
                                <span className="font-light normal-case">Clique para selecionar</span>
                              </div>
                              {filteredCustomerOptions.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(c.id)}
                                  className="w-full text-left p-2.5 sm:px-3 hover:bg-lamarka-50 transition-colors flex items-center justify-between gap-2 group"
                                >
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-lamarka-900 block truncate group-hover:text-lamarka-800">
                                      {c.name}
                                    </span>
                                    <span className="text-[11px] text-lamarka-500 font-light block">
                                      {formatPhone(c.phone)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-lamarka-100 text-lamarka-700 group-hover:bg-lamarka-800 group-hover:text-white transition-colors shrink-0">
                                    Selecionar
                                  </span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider mb-1.5">
                  Nome da Vendedora *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp (opcional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400"
                />
              </div>

              {/* Código Interno */}
              <div>
                <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider mb-1.5">
                  Código Interno (opcional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: VEND-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-lamarka-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-lamarka-200 text-lamarka-700 text-xs font-semibold hover:bg-lamarka-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-luxury disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingSeller ? 'Salvar Alterações' : 'Cadastrar Vendedora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
