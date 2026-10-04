import React from 'react';
import { Sparkles, Crown, ArrowUpRight } from 'lucide-react';
import { ExpirationBadge } from './ExpirationBadge';
import { CustomerBalanceInfo } from '@/lib/fifo-engine';

interface BalanceCardProps {
  balanceInfo: CustomerBalanceInfo;
}

export function BalanceCard({ balanceInfo }: BalanceCardProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Luxury VIP Membership Card */}
      <div className="w-full rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-luxury-lg bg-gradient-to-br from-[#5F3A36] via-[#4E2D2A] to-[#361D1B] border border-[#DFB76C]/30 text-white transition-all">
        {/* Subtle decorative background watermarks & glows */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#DFB76C]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-32 h-32 border border-[#DFB76C]/10 rounded-full -mr-8 -mb-8 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

        {/* Card Header: Brand & VIP Tag */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#DFB76C]/20 border border-[#DFB76C]/40 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-[#DFB76C]" strokeWidth={1.5} />
            </div>
            <span className="font-serif tracking-[0.2em] text-xs font-semibold text-[#FAF6F5] uppercase">
              La Marka Privilège
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#DFB76C]/20 text-[#DFB76C] border border-[#DFB76C]/30 backdrop-blur-xs">
            <Sparkles className="w-2.5 h-2.5" />
            Vip Member
          </span>
        </div>

        {/* Card Body: Balance Amount */}
        <div className="relative z-10 mt-2 mb-1">
          <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-lamarka-200 block mb-1">
            Saldo Disponível em Carteira
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif text-[#DFB76C] font-normal">
              R$
            </span>
            <span className="text-5xl sm:text-6xl font-serif font-semibold tracking-tight text-white">
              {balanceInfo.availableBalance.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Expiração */}
      <ExpirationBadge
        expiringAmount={balanceInfo.expiringAmount}
        expiringInDays={balanceInfo.expiringInDays}
      />
    </div>
  );
}
