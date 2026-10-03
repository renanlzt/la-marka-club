import React from 'react';
import {
  Users,
  ShoppingBag,
  Coins,
  Repeat,
  Gift,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardStats } from '@/lib/admin-service';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Taxa de Retorno (Recompra)',
      value: `${stats.repeatPurchaseRate}%`,
      subtitle: `${stats.customersWithRepeatPurchase} de ${stats.totalPurchasingCustomers} clientes voltaram`,
      icon: Repeat,
      highlight: true,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Clientes Cadastradas',
      value: stats.totalCustomers.toString(),
      subtitle: `${stats.upcomingBirthdaysCount} aniversariantes este mês`,
      icon: Users,
      color: 'bg-lamarka-100 text-lamarka-800 border-lamarka-200',
    },
    {
      title: 'Vendas via Clube',
      value: `R$ ${stats.totalSalesVolume.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: 'Volume transacionado',
      icon: ShoppingBag,
      color: 'bg-lamarka-100 text-lamarka-800 border-lamarka-200',
    },
    {
      title: 'Cashback em Circulação',
      value: `R$ ${stats.activeCashbackInCirculation.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `Resgatados: R$ ${stats.totalCashbackRedeemed.toFixed(2)}`,
      icon: Coins,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5.5 rounded-3xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between transition-all hover:shadow-card-hover ${
              card.highlight ? 'ring-2 ring-emerald-600/20' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-lamarka-500">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${card.color} shadow-2xs`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
            </div>

            <div>
              <div className="text-3xl font-serif font-semibold text-lamarka-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-lamarka-500 font-light mt-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
