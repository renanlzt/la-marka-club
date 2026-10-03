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
      className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
        isUrgent
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : 'bg-lamarka-50 border-lamarka-200 text-lamarka-800'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-lamarka-200 text-lamarka-700'
        }`}
      >
        {isUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      </div>

      <div className="flex-1 text-xs leading-snug">
        <span className="font-semibold block">
          R$ {expiringAmount.toFixed(2)} expiram em {expiringInDays}{' '}
          {expiringInDays === 1 ? 'dia' : 'dias'}!
        </span>
        <span className="text-opacity-80">
          Aproveite para garantir aquele look especial na La Marka antes do prazo.
        </span>
      </div>
    </div>
  );
}
