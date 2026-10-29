import React from 'react';
import Link from 'next/link';
import { getAdminDashboardStats } from '@/lib/admin-service';
import { StatsCards } from '@/components/admin/StatsCards';
import { prisma } from '@/lib/db';
import {
  Sparkles,
  Store,
  Megaphone,
  Gift,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  Repeat,
  Crown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const recentTransactions = await prisma.cashbackTransaction.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: { name: true, phone: true, magicToken: true },
      },
    },
  });

  const totalVipBase = Math.max(1, stats.totalCustomers);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header com Ações Imediatas para o Dia a Dia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Painel de Controle • Gestão
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Painel da Loja
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-0.5">
            Visão executiva do clube de fidelidade, oportunidades de contato e fluxo de vendas.
          </p>
        </div>

        {/* Atalhos Rápidos Operacionais */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/balcao"
            className="px-5 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold flex items-center gap-2 shadow-luxury hover:shadow-luxury-lg transition-all"
          >
            <Store className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.75} />
            Novo Atendimento / Caixa
          </Link>
          <Link
            href="/admin/campanhas"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-lamarka-50 text-lamarka-800 text-xs font-semibold flex items-center gap-1.5 border border-lamarka-200 shadow-xs transition-all"
          >
            <Megaphone className="w-3.5 h-3.5 text-lamarka-600" />
            Campanhas
          </Link>
        </div>
      </div>

      {/* Indicadores Principais de Vendas e Retenção */}
      <StatsCards stats={stats} />

      {/* Barra de Oportunidades & Alertas Acionáveis (Alta Usabilidade) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Campanha Ativa */}
        <div className="p-5 rounded-3xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-lamarka-500">
                Ação Promocional
              </span>
              <Megaphone className="w-4 h-4 text-[#DFB76C]" />
            </div>

            {stats.activeCampaign ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-serif font-bold text-lamarka-900">
                    {stats.activeCampaign.name}
                  </h3>
                </div>
                <p className="text-xs text-lamarka-600 font-light">
                  Regra:{' '}
                  <strong>
                    {stats.activeCampaign.type === 'PERCENTAGE_OVERRIDE'
                      ? `${stats.activeCampaign.value}% de Cashback`
                      : `${stats.activeCampaign.value}x Multiplicador`}
                  </strong>
                </p>
                <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
                  Válida até{' '}
                  {new Intl.DateTimeFormat('pt-BR').format(new Date(stats.activeCampaign.endsAt))}
                </span>
              </>
            ) : (
              <>
                <h3 className="text-sm font-serif font-bold text-lamarka-900 mb-1">
                  Nenhuma Campanha Ativa
                </h3>
                <p className="text-xs text-lamarka-600 font-light">
                  Crie ações temporárias (Cashback em Dobro, Black Friday) para movimentar a loja.
                </p>
              </>
            )}
          </div>

          <Link
            href="/admin/campanhas"
            className="mt-4 pt-3 border-t border-lamarka-100 flex items-center justify-between text-xs font-semibold text-lamarka-800 hover:text-lamarka-950 transition-colors"
          >
            <span>{stats.activeCampaign ? 'Ver desempenho' : 'Criar campanha agora'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Aniversariantes do Mês */}
        <div className="p-5 rounded-3xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-lamarka-500">
                Relacionamento
              </span>
              <Gift className="w-4 h-4 text-rose-500" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-serif font-bold text-lamarka-900">
                {stats.upcomingBirthdaysCount}
              </span>
              <span className="text-xs text-lamarka-600 font-light">
                aniversariantes este mês
              </span>
            </div>
            <p className="text-xs text-lamarka-600 font-light">
              Envie mensagem com bônus no WhatsApp com 1 clique para estreitar o vínculo.
            </p>
          </div>

          <Link
            href="/admin/aniversarios"
            className="mt-4 pt-3 border-t border-lamarka-100 flex items-center justify-between text-xs font-semibold text-rose-800 hover:text-rose-950 transition-colors"
          >
            <span>Presentear clientes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Créditos a Vencer (15 dias) */}
        <div className="p-5 rounded-3xl bg-white border border-lamarka-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-lamarka-500">
                Recuperação de Vendas
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-serif font-bold text-lamarka-900">
                {stats.expiringIn15DaysCount}
              </span>
              <span className="text-xs text-lamarka-600 font-light">
                clientes com saldo a vencer
              </span>
            </div>
            <p className="text-xs text-lamarka-600 font-light">
              Lembre as clientes no WhatsApp antes que o cashback expire para atraí-las à loja.
            </p>
          </div>

          <Link
            href="/admin/clientes"
            className="mt-4 pt-3 border-t border-lamarka-100 flex items-center justify-between text-xs font-semibold text-amber-900 hover:text-amber-950 transition-colors"
          >
            <span>Ver clientes em risco</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pirâmide de Níveis VIP: Distribuição da Base de Clientes */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-lamarka-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.75} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C6219]">
                Segmentação de Fidelidade
              </span>
            </div>
            <h3 className="text-base font-serif font-medium text-lamarka-900">
              Distribuição da Carteira por Categoria VIP
            </h3>
            <p className="text-xs text-lamarka-600 font-light mt-0.5">
              Acompanhe quantas clientes estão em cada nível da jornada de valor da loja.
            </p>
          </div>

          <Link
            href="/admin/configuracoes"
            className="text-xs text-lamarka-600 hover:text-lamarka-900 underline flex items-center gap-1 self-start sm:self-auto"
          >
            Ajustar metas dos níveis
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Bronze */}
          <div className="p-4 rounded-2xl bg-amber-900/5 border border-amber-900/20">
            <span className="text-[11px] font-semibold text-amber-950 block">
              🥉 Bronze (Inicial)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 block mt-1">
              {stats.vipCounts.bronze}
            </span>
            <span className="text-[10px] text-amber-900/70 font-light block mt-0.5">
              {Math.round((stats.vipCounts.bronze / totalVipBase) * 100)}% da base
            </span>
          </div>

          {/* Prata */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-800 block">
              🥈 Prata (2º Nível)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 block mt-1">
              {stats.vipCounts.prata}
            </span>
            <span className="text-[10px] text-slate-500 font-light block mt-0.5">
              {Math.round((stats.vipCounts.prata / totalVipBase) * 100)}% da base
            </span>
          </div>

          {/* Ouro */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-900 block">
              🥇 Ouro (Frequente)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 block mt-1">
              {stats.vipCounts.ouro}
            </span>
            <span className="text-[10px] text-amber-700 font-light block mt-0.5">
              {Math.round((stats.vipCounts.ouro / totalVipBase) * 100)}% da base
            </span>
          </div>

          {/* Diamante */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[11px] font-semibold text-purple-900 block">
              💎 Diamante (Máxima)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-purple-950 block mt-1">
              {stats.vipCounts.diamante}
            </span>
            <span className="text-[10px] text-purple-700 font-light block mt-0.5">
              {Math.round((stats.vipCounts.diamante / totalVipBase) * 100)}% da base
            </span>
          </div>
        </div>
      </div>

      {/* Destaque do Ciclo de Recompra */}
      <div className="bg-gradient-to-r from-[#173127] via-[#2C2422] to-[#5F3A36] rounded-3xl p-6 sm:p-7 text-white shadow-luxury relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/10">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2">
            <Repeat className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} /> Eficiência de Retenção
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium leading-tight">
            {stats.repeatPurchaseRate}% das clientes já voltaram para comprar novamente
          </h2>
          <p className="text-xs text-white/80 font-light mt-1.5 leading-relaxed">
            O saldo real em carteira cria o incentivo perfeito: as clientes sabem que têm crédito esperando na loja e retornam para resgatá-lo em novas peças.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center shrink-0 w-full sm:w-auto min-w-[170px] shadow-2xs">
          <span className="text-[11px] text-white/80 uppercase tracking-wider block">Clientes Fiéis (2+ compras)</span>
          <span className="text-4xl font-serif font-semibold text-white block mt-1">
            {stats.customersWithRepeatPurchase}
          </span>
          <span className="text-[11px] text-emerald-300 font-light">
            de {stats.totalPurchasingCustomers} compradoras
          </span>
        </div>
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-serif font-medium text-lamarka-900">
              Últimas Movimentações no Caixa
            </h3>
            <span className="text-[11px] text-lamarka-500 font-light">
              Transações e resgates mais recentes
            </span>
          </div>
          <Link
            href="/admin/clientes"
            className="text-xs text-lamarka-600 hover:text-lamarka-900 underline"
          >
            Ver extrato completo
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-lamarka-500 py-8 text-center font-light">
            Nenhuma movimentação recente registrada.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-lamarka-100 text-lamarka-500 uppercase tracking-[0.12em] text-[10px]">
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
                    <tr key={tx.id} className="hover:bg-lamarka-50/60 transition-colors">
                      <td className="py-3.5 text-lamarka-500 font-light">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(tx.createdAt))}
                      </td>
                      <td className="py-3.5 font-medium text-lamarka-900">
                        {tx.customer?.name ?? 'Cliente'}
                      </td>
                      <td className="py-3.5 font-light text-lamarka-700">
                        {tx.description}
                      </td>
                      <td
                        className={`py-3.5 text-right font-serif font-semibold text-sm ${
                          isPositive ? 'text-emerald-700' : 'text-lamarka-900'
                        }`}
                      >
                        {isPositive ? '+' : ''} R${' '}
                        {Math.abs(tx.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 text-right font-serif font-medium text-xs text-lamarka-600">
                        R${' '}
                        {tx.balanceAfter.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
