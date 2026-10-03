'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Coins, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { CounterCustomerSummary, CounterSaleResult } from '@/lib/counter-service';

interface SaleFormProps {
  customer: CounterCustomerSummary;
  onClearCustomer: () => void;
  onSaleComplete: (result: CounterSaleResult) => void;
}

export function SaleForm({
  customer,
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
  const estimatedCashback = Number(((netPayable * 5) / 100).toFixed(2));

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
    <div className="w-full bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm">
      {/* Resumo da Cliente Selecionada */}
      <div className="flex items-center justify-between pb-4 border-b border-lamarka-100">
        <div>
          <span className="text-[11px] font-semibold text-lamarka-500 uppercase tracking-wider block">
            Cliente Atendida
          </span>
          <h3 className="text-xl font-serif font-bold text-lamarka-900">
            {customer.name}
          </h3>
          <p className="text-xs text-lamarka-600 font-light">
            Tel: {customer.phone} {customer.birthDay && `• Aniversário: ${customer.birthDay}/${customer.birthMonth}`}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-lamarka-600 block">
            Saldo Disponível
          </span>
          <span className="text-xl font-bold font-serif text-emerald-700">
            R$ {availableBalance.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={onClearCustomer}
            className="text-[11px] text-lamarka-400 hover:text-lamarka-700 block mt-0.5 underline"
          >
            Trocar cliente
          </button>
        </div>
      </div>

      {customer.balanceInfo.expiringAmount > 0 && customer.balanceInfo.expiringInDays && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Atenção: <strong>R$ {customer.balanceInfo.expiringAmount.toFixed(2)}</strong> de cashback expiram em {customer.balanceInfo.expiringInDays} dias! Excelente momento para a cliente utilizar hoje.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Formulário de Registro de Venda */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Valor Total da Compra (R$) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-sm font-semibold text-lamarka-400">
              R$
            </span>
            <input
              type="text"
              required
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-lamarka-200 text-lg font-bold text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200"
              autoFocus
            />
          </div>
        </div>

        {/* Opção de Resgate de Saldo */}
        {availableBalance > 0 && (
          <div className="p-4 rounded-2xl bg-lamarka-50/70 border border-lamarka-200/80 flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCashback}
                onChange={(e) => handleToggleCashback(e.target.checked)}
                className="w-4 h-4 rounded text-lamarka-800 focus:ring-lamarka-400"
              />
              <span className="text-xs font-semibold text-lamarka-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-lamarka-600" />
                Deseja utilizar cashback nesta compra? (Saldo: R$ {availableBalance.toFixed(2)})
              </span>
            </label>

            {useCashback && (
              <div className="pt-2 border-t border-lamarka-200/60 flex items-center gap-3">
                <span className="text-xs text-lamarka-700 whitespace-nowrap">
                  Valor a abater:
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-lamarka-400">
                    R$
                  </span>
                  <input
                    type="text"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-lamarka-300 text-xs font-bold text-lamarka-900 focus:outline-none focus:border-lamarka-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRedeemAmount(
                      Math.min(availableBalance, numPurchase > 0 ? numPurchase : availableBalance).toFixed(2)
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-lamarka-200 hover:bg-lamarka-300 text-lamarka-800 text-[11px] font-semibold"
                >
                  Usar Máximo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumo da Operação */}
        {numPurchase > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-emerald-800 block">
                Valor a Pagar no Caixa:
              </span>
              <span className="text-lg font-bold text-emerald-950">
                R$ {netPayable.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-emerald-800 block">
                Novo Cashback a Ganhar:
              </span>
              <span className="text-base font-bold text-emerald-700 flex items-center gap-1 justify-end">
                <Sparkles className="w-3.5 h-3.5" />
                + R$ {estimatedCashback.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Seleção de Vendedora */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-lamarka-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-lamarka-600" />
              Vendedora Responsável:
            </label>
            <a
              href="/admin/clientes"
              target="_blank"
              className="text-[10px] text-lamarka-500 hover:text-lamarka-800 underline"
            >
              Gerenciar vendedoras
            </a>
          </div>

          <div className="relative">
            <select
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-xs font-semibold text-lamarka-900 bg-white focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
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
          className="w-full py-3.5 px-6 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md mt-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {submitting ? 'Lançando Venda...' : 'Finalizar Venda & Conceder Cashback'}
        </button>
      </form>
    </div>
  );
}
