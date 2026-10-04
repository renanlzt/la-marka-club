'use client';

import React, { useState } from 'react';
import { Sliders, Search, Check, AlertCircle, ShieldAlert } from 'lucide-react';

export default function AdminAjustesPage() {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [reason, setReason] = useState('');
  const [operatorName, setOperatorName] = useState('Dieizy');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;

    setSearching(true);
    setCustomer(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/balcao?q=${encodeURIComponent(phoneQuery.trim())}`);
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
      } else {
        setErrorMessage('Cliente não encontrada.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.')) || 0;

    if (numAmount <= 0) {
      setErrorMessage('Informe um valor maior que zero.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('A justificativa é obrigatória para qualquer ajuste manual.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalAmount = type === 'ADD' ? numAmount : -numAmount;

    try {
      const res = await fetch('/api/admin/ajustes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: finalAmount,
          reason: reason.trim(),
          operatorName: operatorName.trim() || 'Dieizy',
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setSuccessMessage(
          `Ajuste realizado com sucesso! Novo saldo da cliente: R$ ${data.result.newBalance.toFixed(2)}`
        );
        setCustomer({
          ...customer,
          balanceInfo: {
            ...customer.balanceInfo,
            availableBalance: data.result.newBalance,
          },
        });
        setAmount('');
        setReason('');
      } else {
        setErrorMessage(data.error || 'Erro ao processar ajuste.');
      }
    } catch (e: any) {
      setErrorMessage('Falha de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
          <Sliders className="w-3 h-3 text-[#DFB76C]" /> Auditoria & Ajustes
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
          Ajustes Manuais de Saldo
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Adicione créditos (bônus VIP, compensações) ou debite saldo (trocas, devoluções). Todo lançamento exige motivo registrado no histórico.
        </p>
      </div>

      {/* Busca da Cliente */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-lamarka-800 mb-3">
          1. Localizar Cliente para Ajuste
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            placeholder="Telefone ou Nome da cliente..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-lamarka-200 text-xs sm:text-sm focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {searching ? 'Buscando...' : 'Buscar Cliente'}
          </button>
        </form>

        {customer && (
          <div className="mt-4 p-4.5 rounded-2xl bg-lamarka-50/80 border border-lamarka-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-lamarka-500 tracking-wider block">Cliente Selecionada</span>
              <h3 className="text-base font-serif font-medium text-lamarka-900">{customer.name}</h3>
              <p className="text-xs text-lamarka-600 font-light mt-0.5">Tel: {customer.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-lamarka-500 tracking-wider block">Saldo Atual</span>
              <span className="text-xl font-serif font-semibold text-emerald-800">
                R$ {customer.balanceInfo.availableBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Formulário de Ajuste */}
      {customer && (
        <form
          onSubmit={handleAdjust}
          className="bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-lamarka-800 border-b border-lamarka-100 pb-2">
            2. Registrar Lançamento Manual
          </h2>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                Tipo de Ajuste *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('ADD')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'ADD'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-lamarka-200 text-lamarka-700 hover:bg-lamarka-50'
                  }`}
                >
                  + Adicionar Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setType('SUBTRACT')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'SUBTRACT'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-lamarka-200 text-lamarka-700 hover:bg-lamarka-50'
                  }`}
                >
                  − Debitar Saldo
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                Valor do Ajuste (R$) *
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3.5 py-2 rounded-xl border border-lamarka-200 text-xs font-bold focus:outline-none focus:border-lamarka-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Justificativa Obrigatória *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Devolução de vestido sem cupom / Bonificação especial Dieizy"
              className="w-full px-3.5 py-2 rounded-xl border border-lamarka-200 text-xs focus:outline-none focus:border-lamarka-500"
            />
            <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
              Este motivo ficará salvo no extrato da cliente e no log interno da loja.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Responsável pelo Lançamento
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-lamarka-200 text-xs focus:outline-none focus:border-lamarka-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold mt-2 transition-all shadow-sm"
          >
            {submitting ? 'Gravando Ajuste...' : 'Confirmar Ajuste no Saldo'}
          </button>
        </form>
      )}
    </div>
  );
}
