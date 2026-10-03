import React from 'react';
import { getAdminDashboardStats } from '@/lib/admin-service';
import { StatsCards } from '@/components/admin/StatsCards';
import { prisma } from '@/lib/db';
import { Repeat, Sparkles, TrendingUp, ShoppingBag, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const recentTransactions = await prisma.cashbackTransaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: { name: true, phone: true },
      },
    },
  });

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-lamarka-200/80 text-lamarka-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-lamarka-600" /> Indicadores & Relacionamento
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-lamarka-900">
          Painel de Gestão da Dieizy
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Acompanhe o desempenho do La Marka Club, a fidelização das clientes e o impacto real do cashback nas vendas.
        </p>
      </div>

      {/* Indicadores Principais */}
      <StatsCards stats={stats} />

      {/* Destaque do Ciclo de Recompra */}
      <div className="bg-gradient-to-r from-emerald-900 to-lamarka-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Repeat className="w-4 h-4" /> Ciclo de Fidelização Ativo
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
            {stats.repeatPurchaseRate}% das clientes retornaram à La Marka após receberem cashback!
          </h2>
          <p className="text-xs text-emerald-100/90 font-light mt-1 leading-relaxed">
            O cashback tangível em reais cria o incentivo perfeito: a cliente sabe exatamente quanto tem na carteira digital e volta para usar seu crédito em novas peças.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
          <span className="text-xs text-white/80 block">Clientes Fiéis (2+ compras)</span>
          <span className="text-3xl font-bold font-serif text-white block mt-0.5">
            {stats.customersWithRepeatPurchase}
          </span>
          <span className="text-[11px] text-emerald-300 font-light">
            de {stats.totalPurchasingCustomers} participantes
          </span>
        </div>
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm">
        <h3 className="text-base font-serif font-bold text-lamarka-900 mb-4">
          Últimas Movimentações do Clube
        </h3>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-lamarka-500 py-6 text-center">
            Nenhuma movimentação recente registrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-lamarka-100 text-lamarka-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Data / Hora</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Descrição</th>
                  <th className="pb-3 font-semibold text-right">Valor</th>
                  <th className="pb-3 font-semibold text-right">Saldo Resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lamarka-100 text-lamarka-800">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-lamarka-50/50">
                      <td className="py-3 text-lamarka-500 font-light">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(tx.createdAt))}
                      </td>
                      <td className="py-3 font-medium text-lamarka-900">
                        {tx.customer.name}
                      </td>
                      <td className="py-3 font-light text-lamarka-700">
                        {tx.description}
                      </td>
                      <td
                        className={`py-3 text-right font-semibold ${
                          isPositive ? 'text-emerald-700' : 'text-lamarka-800'
                        }`}
                      >
                        {isPositive ? '+' : ''} R$ {Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-lamarka-600">
                        R$ {tx.balanceAfter.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
