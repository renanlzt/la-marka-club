'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Phone, Sparkles } from 'lucide-react';
import { CounterCustomerSummary } from '@/lib/counter-service';

interface CustomerSearchProps {
  onSelectCustomer: (customer: CounterCustomerSummary) => void;
  onOpenQuickRegister: () => void;
  isLoading: boolean;
}

export function CustomerSearch({
  onSelectCustomer,
  onOpenQuickRegister,
  isLoading,
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setNotFoundMessage(false);

    try {
      const res = await fetch(`/api/balcao?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (data.customer) {
        onSelectCustomer(data.customer);
      } else {
        setNotFoundMessage(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-lamarka-500 block mb-1">
            Frente de Caixa Rápida
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-lamarka-900">
            Identificar Cliente no Caixa
          </h2>
          <p className="text-xs text-lamarka-600 font-light mt-0.5">
            Consulte saldo ou registre compras pelo telefone ou nome da cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickRegister}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-lamarka-100/90 hover:bg-lamarka-200 text-lamarka-800 text-xs font-semibold transition-all shrink-0 self-start sm:self-auto border border-lamarka-200/80 shadow-2xs hover:shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5 text-lamarka-700" strokeWidth={1.5} />
          Nova Cliente (10s)
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lamarka-400">
            <Phone className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotFoundMessage(false);
            }}
            placeholder="Telefone (DDD + Número) ou Nome..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-lamarka-200 focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400 bg-white shadow-2xs transition-all"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={searching || isLoading || !query.trim()}
          className="px-6 py-3 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md shrink-0"
        >
          <Search className="w-4 h-4" strokeWidth={1.5} />
          {searching ? 'Buscando...' : 'Buscar Cliente'}
        </button>
      </form>

      {notFoundMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="text-xs text-amber-950 font-light">
            <span className="font-semibold block text-amber-900">Cliente não encontrada!</span>
            Deseja cadastrá-la agora em menos de 10 segundos para já acumular cashback nesta compra?
          </div>
          <button
            type="button"
            onClick={onOpenQuickRegister}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            Cadastrar Agora
          </button>
        </div>
      )}
    </div>
  );
}
