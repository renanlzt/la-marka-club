import React from 'react';
import { Sparkles, Crown } from 'lucide-react';
import { ExpirationBadge } from './ExpirationBadge';
import { CustomerBalanceInfo } from '@/lib/fifo-engine';

interface BalanceCardProps {
  balanceInfo: CustomerBalanceInfo;
  customerName?: string;
}

export function BalanceCard({ balanceInfo, customerName }: BalanceCardProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Luxury VIP Membership Matte Card */}
      <div className="w-full rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-luxury-lg bg-gradient-to-br from-[#4E2724] via-[#381B19] to-[#241110] border border-[#DFB76C]/30 text-white transition-all">
        {/* Acabamento acetinado / micro borda interna */}
        <div className="absolute inset-0 rounded-3xl border border-white/[0.08] pointer-events-none" />

        {/* Ambient glow dourado e terracota suave */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#DFB76C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#C59B94]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Selos em marca d'água concêntricos de alta joalheria/boutique */}
        <div className="absolute right-0 bottom-0 w-36 h-36 border border-[#DFB76C]/10 rounded-full -mr-10 -mb-10 pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-56 h-56 border border-[#DFB76C]/5 rounded-full -mr-18 -mb-18 pointer-events-none" />

        {/* Efeito de brilho metálico suave (shimmer) */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DFB76C]/10 via-white/[0.07] to-transparent -translate-x-full animate-shimmer pointer-events-none" />

        {/* Card Header: Marca gravada em baixo-relevo visual e Identificador VIP */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#DFB76C]/20 border border-[#DFB76C]/40 flex items-center justify-center shadow-xs">
              <Crown className="w-3.5 h-3.5 text-[#DFB76C]" strokeWidth={1.5} />
            </div>
            {/* Efeito estilizado em baixo-relevo visual */}
            <span
              className="font-serif tracking-[0.25em] text-xs sm:text-sm font-semibold uppercase text-[#FAF6F5]/90 select-none"
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 0 rgba(223, 183, 108, 0.25)',
              }}
            >
              LA MARKA PRIVILÈGE
            </span>
          </div>

          {/* Identificador visual elegante de cliente */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-[#DFB76C]/20 text-[#DFB76C] border border-[#DFB76C]/40 backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" />
            MEMBRO PRIVILÈGE • VIP
          </span>
        </div>

        {/* Chip metálico simulado de cartão VIP de alta joalheria */}
        <div className="relative z-10 mb-4">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-[#E2BE76] via-[#DFB76C] to-[#9E7A36] p-[1px] shadow-sm">
            <div className="w-full h-full rounded-[5px] bg-[#311614]/60 border border-[#DFB76C]/40 flex items-center justify-center">
              <div className="w-4 h-3 border border-[#DFB76C]/50 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Card Body: Saldo Disponível com tipografia font-serif bem destacada */}
        <div className="relative z-10 mt-1 mb-2">
          <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#EADBD7]/80 block mb-1">
            Saldo Disponível em Carteira
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif text-[#DFB76C] font-normal drop-shadow-xs">
              R$
            </span>
            <span className="text-5xl sm:text-6xl font-serif font-semibold tracking-tight text-white drop-shadow-sm">
              {balanceInfo.availableBalance.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Card Footer: Titular da Carteira e Validação */}
        <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#FAF6F5]/70 relative z-10">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#DFB76C]/80 font-medium">
              Titular da Carteira
            </span>
            <span className="font-serif tracking-wider text-xs text-white uppercase font-medium">
              {customerName ? customerName : 'Cliente Privilège'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-widest text-[#DFB76C]/80 uppercase font-mono">
              BOUTIQUE EXCLUSIVE
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
