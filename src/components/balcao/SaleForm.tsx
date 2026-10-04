'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Coins, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { CounterCustomerSummary, CounterSaleResult } from '@/lib/counter-service';

interface SaleFormProps {
  customer: CounterCustomerSummary;
  settings?: {
    defaultCashbackPercentage: number;
    defaultExpirationDays: number;
  };
  activeCampaign?: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
  onClearCustomer: () => void;
  onSaleComplete: (result: CounterSaleResult) => void;
}

export function SaleForm({
  customer,
  settings,
  activeCampaign,
  onClearCustomer,
  onSaleComplete,
}: SaleFormProps) {
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [useCashback, setUseCashback] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [operatorName, setOperatorName] = useState('Balcão / Caixa Geral');
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/balcao/vendedoras')
      .then((res) => res.json())
      .then((data) => {
        if (data.sellers && Array.isArray(data.sellers)) {
          setSellers(data.sellers);
          if (data.sellers.length > 0 && operatorName === 'Balcão / Caixa Geral') {
            setOperatorName(data.sellers[0].name);
          }
        }
      })
      .catch((err) => console.error('Erro ao carregar vendedoras:', err));
  }, []);

  const availableBalance = customer.balanceInfo.availableBalance;
  const numPurchase = parseFloat(purchaseAmount.replace(',', '.')) || 0;
  const numRedeem = useCashback
    ? Math.min(
        availableBalance,
        parseFloat(redeemAmount.replace(',', '.')) || 0
      )
    : 0;

  const netPayable = Math.max(0, numPurchase - numRedeem);

  // Percentual efetivo baseado nas configurações ou campanha ativa
  let effectivePercentage = settings?.defaultCashbackPercentage ?? 5.0;
  if (activeCampaign) {
    if (activeCampaign.type === 'PERCENTAGE_OVERRIDE') {
      effectivePercentage = activeCampaign.value;
    } else if (activeCampaign.type === 'MULTIPLIER') {
      effectivePercentage = Number((effectivePercentage * activeCampaign.value).toFixed(2));
    }
  }

  const estimatedCashback = Number(((netPayable * effectivePercentage) / 100).toFixed(2));

  const handleToggleCashback = (checked: boolean) => {
    setUseCashback(checked);
    if (checked) {
      // Preenche sugestão com o saldo total disponível ou valor total da compra
      const maxPossible = Math.min(availableBalance, numPurchase > 0 ? numPurchase : availableBalance);
      setRedeemAmount(maxPossible > 0 ? maxPossible.toFixed(2) : '');
    } else {
      setRedeemAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numPurchase <= 0) {
      setError('Informe um valor de compra válido.');
      return;
    }

    if (useCashback && numRedeem > availableBalance) {
      setError('O valor de resgate não pode exceder o saldo disponível.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/balcao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sale',
          data: {
            customerId: customer.id,
            purchaseAmount: numPurchase,
            redeemAmount: numRedeem,
            operatorName: operatorName.trim() || 'Balcão',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        onSaleComplete(data.result);
      } else {
        setError(data.error || 'Erro ao processar venda.');
      }
    } catch (err: any) {
      setError('Falha de conexão ao processar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
      {/* Resumo da Cliente Selecionada */}
      <div className="flex items-center justify-between pb-5 border-b border-lamarka-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-lamarka-100/80 border border-lamarka-200 text-lamarka-800 flex items-center justify-center font-serif font-bold text-base shrink-0 shadow-2xs">
            {customer.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] font-semibold text-lamarka-500 uppercase tracking-[0.18em] block">
              Cliente no Caixa
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-medium text-lamarka-900 leading-tight">
              {customer.name}
            </h3>
            <p className="text-xs text-lamarka-600 font-light mt-0.5">
              Tel: {customer.phone} {customer.birthDay && `• Aniversário: ${customer.birthDay}/${customer.birthMonth}`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-lamarka-500 uppercase tracking-wider block">
            Saldo Disponível
          </span>
          <span className="text-xl sm:text-2xl font-serif font-semibold text-emerald-800 block">
            R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <button
            type="button"
            onClick={onClearCustomer}
            className="text-[11px] text-lamarka-400 hover:text-lamarka-800 block mt-0.5 underline transition-colors"
          >
            Trocar cliente
          </button>
        </div>
      </div>

      {customer.balanceInfo.expiringAmount > 0 && customer.balanceInfo.expiringInDays && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" strokeWidth={1.5} />
          <span className="font-light">
            Atenção: <strong className="font-semibold text-amber-900">R$ {customer.balanceInfo.expiringAmount.toFixed(2)}</strong> de cashback expiram em {customer.balanceInfo.expiringInDays} {customer.balanceInfo.expiringInDays === 1 ? 'dia' : 'dias'}! Excelente momento para a cliente abater hoje.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Formulário de Registro de Venda */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4.5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1.5">
            Valor Total da Compra (R$) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-base font-serif text-lamarka-400 font-medium">
              R$
            </span>
            <input
              type="text"
              required
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-lamarka-200 text-xl font-serif font-bold text-lamarka-900 focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 bg-white shadow-2xs transition-all placeholder:text-lamarka-300"
              autoFocus
            />
          </div>
        </div>

        {/* Opção de Resgate de Saldo */}
        {availableBalance > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-lamarka-50/80 border border-lamarka-200/90 flex flex-col gap-3 shadow-2xs">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCashback}
                onChange={(e) => handleToggleCashback(e.target.checked)}
                className="w-4 h-4 rounded text-lamarka-800 focus:ring-lamarka-400"
              />
              <span className="text-xs font-semibold text-lamarka-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-lamarka-600" strokeWidth={1.5} />
                Deseja utilizar cashback nesta compra? (Saldo: R$ {availableBalance.toFixed(2)})
              </span>
            </label>

            {useCashback && (
              <div className="pt-2.5 border-t border-lamarka-200/70 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-xs text-lamarka-700 shrink-0">
                  Valor a abater:
                </span>
                <div className="flex items-center gap-2 flex-1 w-full">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-lamarka-400">
                      R$
                    </span>
                    <input
                      type="text"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-lamarka-300 text-xs font-bold text-lamarka-900 focus:outline-none focus:border-lamarka-600 bg-white shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRedeemAmount(
                        Math.min(availableBalance, numPurchase > 0 ? numPurchase : availableBalance).toFixed(2)
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-lamarka-200 hover:bg-lamarka-300 text-lamarka-800 text-[11px] font-semibold transition-colors shadow-2xs shrink-0 whitespace-nowrap"
                  >
                    Usar Máximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumo da Operação */}
        {numPurchase > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                Valor a Pagar no Caixa:
              </span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-950">
                R$ {netPayable.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                Novo Cashback a Ganhar ({effectivePercentage}%):
              </span>
              <span className="text-base sm:text-lg font-serif font-bold text-emerald-700 flex items-center gap-1 justify-end">
                <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
                + R$ {estimatedCashback.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Seleção de Vendedora */}
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-lamarka-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-lamarka-600 shrink-0" strokeWidth={1.5} />
              <span>Vendedora Responsável:</span>
            </label>
            <a
              href="/admin/vendedores"
              target="_blank"
              className="text-[10px] text-lamarka-500 hover:text-lamarka-800 underline shrink-0"
            >
              Gerenciar vendedoras
            </a>
          </div>

          <div className="relative">
            <select
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-lamarka-200 text-xs font-semibold text-lamarka-900 bg-white focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
            >
              <option value="Balcão / Caixa Geral">Balcão / Caixa Geral</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.name}>
                  ✨ {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || numPurchase <= 0}
          className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-luxury hover:shadow-luxury-lg mt-2 text-center"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{submitting ? 'Lançando Venda...' : 'Finalizar Venda & Conceder Cashback'}</span>
        </button>
      </form>
    </div>
  );
}
