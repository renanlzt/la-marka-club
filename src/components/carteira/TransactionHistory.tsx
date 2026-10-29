import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Gift,
  Clock,
  PlusCircle,
  MinusCircle,
  Tag,
  Receipt,
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

function getTransactionMeta(type: string) {
  switch (type) {
    case 'EARN':
      return {
        label: 'Cashback Ganho',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
        Icon: ShoppingBag,
        iconColor: 'text-emerald-700',
        iconBg: 'bg-emerald-50/90 border-emerald-200/60',
      };
    case 'REDEEM':
      return {
        label: 'Resgate no Caixa',
        badgeBg: 'bg-lamarka-100 text-lamarka-900 border-lamarka-300/80',
        Icon: Tag,
        iconColor: 'text-lamarka-800',
        iconBg: 'bg-lamarka-100/70 border-lamarka-200/60',
      };
    case 'BIRTHDAY_GIFT':
      return {
        label: 'Mimo de Aniversário',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200/70',
        Icon: Gift,
        iconColor: 'text-rose-700',
        iconBg: 'bg-rose-50 border-rose-200/60',
      };
    case 'EXPIRE':
      return {
        label: 'Vencimento de Saldo',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/70',
        Icon: Clock,
        iconColor: 'text-amber-700',
        iconBg: 'bg-amber-50 border-amber-200/60',
      };
    case 'MANUAL_ADD':
      return {
        label: 'Crédito Especial',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
        Icon: PlusCircle,
        iconColor: 'text-emerald-700',
        iconBg: 'bg-emerald-50/90 border-emerald-200/60',
      };
    case 'MANUAL_SUBTRACT':
      return {
        label: 'Ajuste de Saldo',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200/70',
        Icon: MinusCircle,
        iconColor: 'text-rose-700',
        iconBg: 'bg-rose-50 border-rose-200/60',
      };
    default:
      return {
        label: 'Movimentação',
        badgeBg: 'bg-lamarka-50 text-lamarka-800 border-lamarka-200/70',
        Icon: Sparkles,
        iconColor: 'text-[#DFB76C]',
        iconBg: 'bg-lamarka-50 border-lamarka-200/60',
      };
  }
}

function formatDateHeader(date: Date): string {
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const formattedDay = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(d);

  if (isToday) {
    return `Hoje • ${formattedDay}`;
  }
  if (isYesterday) {
    return `Ontem • ${formattedDay}`;
  }

  const yearSuffix = d.getFullYear() !== now.getFullYear() ? ` de ${d.getFullYear()}` : '';
  return `${formattedDay}${yearSuffix}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

interface GroupedTransactions {
  dateKey: string;
  dateLabel: string;
  items: TransactionItem[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-lamarka-200/90 p-8 text-center shadow-card mt-4">
        <div className="w-12 h-12 rounded-2xl bg-lamarka-50 border border-lamarka-200/60 flex items-center justify-center mx-auto mb-3 text-lamarka-600">
          <Receipt className="w-6 h-6 text-[#DFB76C]" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-serif font-semibold text-lamarka-900 mb-1">
          Nenhuma movimentação registrada ainda
        </h3>
        <p className="text-xs text-lamarka-500 font-light leading-relaxed max-w-xs mx-auto">
          Suas compras na loja física acumulam cashback automaticamente para você aproveitar no próximo look.
        </p>
      </div>
    );
  }

  // Agrupamento por dia no estilo elegante Apple Card / Nubank Ultravioleta
  const groups: GroupedTransactions[] = [];
  const groupMap = new Map<string, GroupedTransactions>();

  transactions.forEach((tx) => {
    const d = new Date(tx.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let group = groupMap.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        dateLabel: formatDateHeader(d),
        items: [],
      };
      groupMap.set(dateKey, group);
      groups.push(group);
    }
    group.items.push(tx);
  });

  return (
    <div className="w-full flex flex-col gap-3 mt-5">
      {/* Título do Extrato */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-lamarka-800">
            Extrato de Movimentações
          </h2>
        </div>
        <span className="text-[11px] text-lamarka-500 font-light tracking-wide">
          {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Timeline Card Estilo Nubank Ultravioleta / Apple Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-lamarka-200/90 shadow-card overflow-hidden p-3.5 sm:p-5 flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.dateKey} className="flex flex-col gap-2">
            {/* Separador Elegante de Data */}
            <div className="flex items-center gap-3 pt-2 pb-1">
              <span className="text-[11px] font-semibold tracking-wider text-lamarka-600 uppercase">
                {group.dateLabel}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-lamarka-200/80 to-transparent" />
            </div>

            {/* Lista de Transações do Dia */}
            <div className="flex flex-col divide-y divide-lamarka-100/80">
              {group.items.map((tx) => {
                const isPositive = tx.amount > 0;
                const meta = getTransactionMeta(tx.type);
                const IconComponent = meta.Icon;

                return (
                  <div
                    key={tx.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-lamarka-50/60 rounded-2xl transition-colors"
                  >
                    {/* Lado Esquerdo: Ícone + Descrição + Badge Acolhedora */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${meta.iconBg}`}
                      >
                        <IconComponent className={`w-4 h-4 ${meta.iconColor}`} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-medium text-lamarka-900 leading-tight truncate">
                            {tx.description}
                          </p>
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${meta.badgeBg}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-lamarka-500 font-light mt-0.5">
                          {formatTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Lado Direito: Valor e Saldo Formatados com toLocaleString */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm sm:text-base font-serif font-semibold block ${
                          isPositive ? 'text-emerald-700' : 'text-lamarka-900'
                        }`}
                      >
                        {isPositive ? '+' : '-'} R${' '}
                        {Math.abs(tx.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[10px] text-lamarka-400 font-light block">
                        Saldo: R${' '}
                        {tx.balanceAfter.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
