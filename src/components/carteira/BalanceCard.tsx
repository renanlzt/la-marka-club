import React from 'react';
import { Coins, ArrowUpRight } from 'lucide-react';
import { ExpirationBadge } from './ExpirationBadge';
import { CustomerBalanceInfo } from '@/lib/fifo-engine';

interface BalanceCardProps {
  balanceInfo: CustomerBalanceInfo;
}

export function BalanceCard({ balanceInfo }: BalanceCardProps) {
  return (
    <div className="w-full bg-gradient-to-br from-white via-white to-lamarka-50 border border-lamarka-200/90 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      {/* Decorative background watermark */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 border-8 border-lamarka-100 rounded-full opacity-40 pointer-events-none" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-lamarka-700 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-lamarka-500" />
          Saldo Disponível
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" /> Em Reais (R$)
        </span>
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-xl font-serif text-lamarka-600 font-normal">R$</span>
        <span className="text-4xl sm:text-5xl font-serif font-bold text-lamarka-900 tracking-tight">
          {balanceInfo.availableBalance.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <p className="text-xs text-lamarka-600 font-light mt-1">
        Utilizável como abatimento direto em suas próximas compras na loja.
      </p>

      {/* Alerta de Expiração */}
      <ExpirationBadge
        expiringAmount={balanceInfo.expiringAmount}
        expiringInDays={balanceInfo.expiringInDays}
      />
    </div>
  );
}
