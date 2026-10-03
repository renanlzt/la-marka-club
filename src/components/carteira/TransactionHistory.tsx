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
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'REDEEM':
        return <MinusCircle className="w-4 h-4 text-lamarka-800" />;
      case 'BIRTHDAY_GIFT':
        return <Gift className="w-4 h-4 text-lamarka-600" />;
      case 'EXPIRE':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'MANUAL_ADD':
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case 'MANUAL_SUBTRACT':
        return <MinusCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-lamarka-500" />;
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
    <div className="w-full flex flex-col gap-3 mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-lamarka-800 px-1">
        Extrato de Movimentações
      </h2>

      <div className="bg-white rounded-2xl border border-lamarka-200/80 divide-y divide-lamarka-100 shadow-sm overflow-hidden">
        {transactions.map((tx) => {
          const isPositive = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between gap-3 hover:bg-lamarka-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lamarka-100/70 flex items-center justify-center shrink-0">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-lamarka-900 leading-tight">
                    {tx.description}
                  </p>
                  <p className="text-[11px] text-lamarka-600 font-light mt-0.5">
                    {formatDateTime(tx.createdAt)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-semibold block ${
                    isPositive ? 'text-emerald-700' : 'text-lamarka-800'
                  }`}
                >
                  {isPositive ? '+' : ''} R${' '}
                  {Math.abs(tx.amount).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[10px] text-lamarka-500">
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
