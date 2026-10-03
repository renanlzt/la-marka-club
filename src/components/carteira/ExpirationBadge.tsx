import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface ExpirationBadgeProps {
  expiringAmount: number;
  expiringInDays: number | null;
}

export function ExpirationBadge({
  expiringAmount,
  expiringInDays,
}: ExpirationBadgeProps) {
  if (expiringAmount <= 0 || expiringInDays === null) {
    return null;
  }

  const isUrgent = expiringInDays <= 7;

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center gap-3.5 text-left transition-all shadow-card ${
        isUrgent
          ? 'bg-amber-50/95 border-amber-200/80 text-amber-950'
          : 'bg-white border-lamarka-200/90 text-lamarka-900'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-lamarka-100 text-lamarka-700'
        }`}
      >
        {isUrgent ? (
          <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
        ) : (
          <Clock className="w-4 h-4 text-lamarka-600" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 text-xs leading-snug">
        <span className="font-semibold block font-sans">
          R$ {expiringAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} expiram em {expiringInDays}{' '}
          {expiringInDays === 1 ? 'dia' : 'dias'}!
        </span>
        <span className="text-lamarka-600 font-light text-[11px] mt-0.5 block">
          Aproveite para garantir aquele look especial na La Marka antes do vencimento.
        </span>
      </div>
    </div>
  );
}
