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
    <div className="w-full bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-lamarka-900">
            Identificar Cliente no Caixa
          </h2>
          <p className="text-xs text-lamarka-600 font-light mt-0.5">
            Digite o telefone ou nome da cliente para consultar saldo ou registrar compra.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickRegister}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lamarka-100 hover:bg-lamarka-200 text-lamarka-800 text-xs font-semibold transition-colors shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Nova Cliente (10s)
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lamarka-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotFoundMessage(false);
            }}
            placeholder="Telefone (DDD + Número) ou Nome..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-lamarka-200 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200 text-sm placeholder:text-lamarka-400"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={searching || isLoading || !query.trim()}
          className="px-5 py-3 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" />
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {notFoundMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
          <div className="text-xs text-amber-900">
            <span className="font-semibold block">Cliente não encontrada!</span>
            Deseja cadastrá-la agora em menos de 10 segundos para já ganhar cashback?
          </div>
          <button
            type="button"
            onClick={onOpenQuickRegister}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shrink-0 ml-3 shadow-sm transition-colors"
          >
            Cadastrar Agora
          </button>
        </div>
      )}
    </div>
  );
}
