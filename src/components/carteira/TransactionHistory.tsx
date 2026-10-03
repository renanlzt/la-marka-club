import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Gift,
  Clock,
  PlusCircle,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

interface TransactionHistoryProps {
  transactions: TransactionItem[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-lamarka-200/80 p-8 text-center text-sm text-lamarka-600">
        Nenhuma movimentação registrada ainda.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'EARN':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />;
      case 'REDEEM':
        return <MinusCircle className="w-4 h-4 text-lamarka-800" strokeWidth={1.5} />;
      case 'BIRTHDAY_GIFT':
        return <Gift className="w-4 h-4 text-rose-600" strokeWidth={1.5} />;
      case 'EXPIRE':
        return <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.5} />;
      case 'MANUAL_ADD':
        return <PlusCircle className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />;
      case 'MANUAL_SUBTRACT':
        return <MinusCircle className="w-4 h-4 text-rose-600" strokeWidth={1.5} />;
      default:
        return <Sparkles className="w-4 h-4 text-lamarka-500" strokeWidth={1.5} />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="w-full flex flex-col gap-3 mt-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-lamarka-800">
          Extrato de Movimentações
        </h2>
        <span className="text-[11px] text-lamarka-500 font-light">
          {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-lamarka-200/90 divide-y divide-lamarka-100 shadow-card overflow-hidden">
        {transactions.map((tx) => {
          const isPositive = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-lamarka-50/60 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-lamarka-50 border border-lamarka-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                  {getIcon(tx.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-lamarka-900 leading-tight truncate">
                    {tx.description}
                  </p>
                  <p className="text-[11px] text-lamarka-500 font-light mt-0.5">
                    {formatDateTime(tx.createdAt)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-base font-serif font-semibold block ${
                    isPositive ? 'text-emerald-700' : 'text-lamarka-900'
                  }`}
                >
                  {isPositive ? '+' : ''} R${' '}
                  {Math.abs(tx.amount).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[10px] text-lamarka-400 font-light">
                  Saldo: R$ {tx.balanceAfter.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
