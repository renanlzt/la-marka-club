import React from 'react';
import { Sparkles, Crown } from 'lucide-react';
import { ExpirationBadge } from './ExpirationBadge';
import { CustomerBalanceInfo } from '@/lib/fifo-engine';

export type VipTierName = 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';

export interface TierTheme {
  cardGradient: string;
  borderColor: string;
  glow1: string;
  glow2: string;
  watermarkBorder1: string;
  watermarkBorder2: string;
  shimmerGradient: string;
  crownBg: string;
  crownBorder: string;
  crownColor: string;
  brandTextShadow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  sparkleColor: string;
  chipGradient: string;
  chipInnerBg: string;
  chipBorder: string;
  currencyColor: string;
  subtitleColor: string;
  accentText: string;
}

export const VIP_CARD_THEMES: Record<VipTierName, TierTheme> = {
  BRONZE: {
    cardGradient: 'bg-gradient-to-br from-[#4A2616] via-[#33170B] to-[#1C0B04]',
    borderColor: 'border-[#CD7F32]/45',
    glow1: 'bg-[#CD7F32]/20',
    glow2: 'bg-[#E59866]/15',
    watermarkBorder1: 'border-[#CD7F32]/15',
    watermarkBorder2: 'border-[#CD7F32]/10',
    shimmerGradient: 'via-[#CD7F32]/15 via-white/[0.08]',
    crownBg: 'bg-[#CD7F32]/25',
    crownBorder: 'border-[#CD7F32]/50',
    crownColor: 'text-[#E59866]',
    brandTextShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 0 rgba(205, 127, 50, 0.3)',
    badgeBg: 'bg-[#CD7F32]/25',
    badgeText: 'text-[#F5B98A]',
    badgeBorder: 'border-[#CD7F32]/50',
    sparkleColor: 'text-[#E59866]',
    chipGradient: 'from-[#E59866] via-[#CD7F32] to-[#8C4A15]',
    chipInnerBg: 'bg-[#2A1107]/70',
    chipBorder: 'border-[#CD7F32]/60',
    currencyColor: 'text-[#E59866]',
    subtitleColor: 'text-[#E8D0C8]/80',
    accentText: 'text-[#E59866]/90',
  },
  PRATA: {
    cardGradient: 'bg-gradient-to-br from-[#334155] via-[#1E293B] to-[#0F172A]',
    borderColor: 'border-slate-300/40',
    glow1: 'bg-slate-300/20',
    glow2: 'bg-slate-400/15',
    watermarkBorder1: 'border-slate-300/15',
    watermarkBorder2: 'border-slate-300/10',
    shimmerGradient: 'via-slate-200/20 via-white/[0.12]',
    crownBg: 'bg-slate-200/20',
    crownBorder: 'border-slate-300/40',
    crownColor: 'text-slate-200',
    brandTextShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 0 rgba(226, 232, 240, 0.3)',
    badgeBg: 'bg-slate-200/20',
    badgeText: 'text-slate-100',
    badgeBorder: 'border-slate-300/45',
    sparkleColor: 'text-slate-200',
    chipGradient: 'from-[#F1F5F9] via-[#CBD5E1] to-[#64748B]',
    chipInnerBg: 'bg-[#0F172A]/70',
    chipBorder: 'border-slate-300/50',
    currencyColor: 'text-slate-200',
    subtitleColor: 'text-slate-300/80',
    accentText: 'text-slate-300/90',
  },
  OURO: {
    cardGradient: 'bg-gradient-to-br from-[#4E3914] via-[#352508] to-[#1C1202]',
    borderColor: 'border-[#DFB76C]/50',
    glow1: 'bg-[#DFB76C]/25',
    glow2: 'bg-amber-400/15',
    watermarkBorder1: 'border-[#DFB76C]/15',
    watermarkBorder2: 'border-[#DFB76C]/10',
    shimmerGradient: 'via-[#DFB76C]/20 via-white/[0.1]',
    crownBg: 'bg-[#DFB76C]/25',
    crownBorder: 'border-[#DFB76C]/50',
    crownColor: 'text-[#DFB76C]',
    brandTextShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 0 rgba(223, 183, 108, 0.3)',
    badgeBg: 'bg-[#DFB76C]/25',
    badgeText: 'text-[#FDE68A]',
    badgeBorder: 'border-[#DFB76C]/50',
    sparkleColor: 'text-[#DFB76C]',
    chipGradient: 'from-[#F6E0A4] via-[#DFB76C] to-[#9E7A36]',
    chipInnerBg: 'bg-[#241703]/70',
    chipBorder: 'border-[#DFB76C]/50',
    currencyColor: 'text-[#DFB76C]',
    subtitleColor: 'text-[#F5E6CC]/80',
    accentText: 'text-[#DFB76C]/90',
  },
  DIAMANTE: {
    cardGradient: 'bg-gradient-to-br from-[#0F172A] via-[#081226] to-[#020617]',
    borderColor: 'border-cyan-400/40',
    glow1: 'bg-cyan-400/25',
    glow2: 'bg-sky-500/15',
    watermarkBorder1: 'border-cyan-400/15',
    watermarkBorder2: 'border-cyan-400/10',
    shimmerGradient: 'via-cyan-300/20 via-white/[0.12]',
    crownBg: 'bg-cyan-400/20',
    crownBorder: 'border-cyan-400/50',
    crownColor: 'text-cyan-300',
    brandTextShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 0 rgba(103, 232, 249, 0.3)',
    badgeBg: 'bg-cyan-500/25',
    badgeText: 'text-cyan-200',
    badgeBorder: 'border-cyan-300/50',
    sparkleColor: 'text-cyan-300',
    chipGradient: 'from-[#E0F2FE] via-[#7DD3FC] to-[#0284C7]',
    chipInnerBg: 'bg-[#030712]/70',
    chipBorder: 'border-cyan-400/50',
    currencyColor: 'text-cyan-300',
    subtitleColor: 'text-cyan-100/80',
    accentText: 'text-cyan-300/90',
  },
};

export function getTierTheme(tier?: string): TierTheme {
  const normalized = (tier || 'BRONZE').toUpperCase();
  if (normalized.includes('DIAMANTE')) return VIP_CARD_THEMES.DIAMANTE;
  if (normalized.includes('OURO')) return VIP_CARD_THEMES.OURO;
  if (normalized.includes('PRATA')) return VIP_CARD_THEMES.PRATA;
  return VIP_CARD_THEMES.BRONZE;
}

interface BalanceCardProps {
  balanceInfo: CustomerBalanceInfo;
  customerName?: string;
  vipTier?: {
    tier: string;
    label: string;
    percentage: number;
    badgeColor?: string;
  };
}

export function BalanceCard({ balanceInfo, customerName, vipTier }: BalanceCardProps) {
  const tierName = vipTier?.tier || 'BRONZE';
  const tierPercentage = vipTier?.percentage ?? 0.5;
  const theme = getTierTheme(tierName);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Luxury VIP Membership Matte Card with dynamic Tier Theme */}
      <div
        className={`w-full rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-luxury-lg ${theme.cardGradient} border ${theme.borderColor} text-white transition-all duration-300`}
      >
        {/* Acabamento acetinado / micro borda interna */}
        <div className="absolute inset-0 rounded-3xl border border-white/[0.08] pointer-events-none" />

        {/* Ambient glow dinâmico de alta joalheria */}
        <div className={`absolute -right-12 -top-12 w-48 h-48 ${theme.glow1} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -left-10 -bottom-10 w-44 h-44 ${theme.glow2} rounded-full blur-2xl pointer-events-none`} />

        {/* Selos em marca d'água concêntricos de boutique */}
        <div className={`absolute right-0 bottom-0 w-36 h-36 border ${theme.watermarkBorder1} rounded-full -mr-10 -mb-10 pointer-events-none`} />
        <div className={`absolute right-0 bottom-0 w-56 h-56 border ${theme.watermarkBorder2} rounded-full -mr-18 -mb-18 pointer-events-none`} />

        {/* Efeito de brilho metálico suave (shimmer) */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme.shimmerGradient} to-transparent -translate-x-full animate-shimmer pointer-events-none`} />

        {/* Card Header: Marca gravada e Categoria VIP */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${theme.crownBg} border ${theme.crownBorder} flex items-center justify-center shadow-xs`}>
              <Crown className={`w-3.5 h-3.5 ${theme.crownColor}`} strokeWidth={1.5} />
            </div>
            <span
              className="font-serif tracking-[0.25em] text-xs sm:text-sm font-semibold uppercase text-[#FAF6F5]/90 select-none"
              style={{
                textShadow: theme.brandTextShadow,
              }}
            >
              LA MARKA PRIVILÈGE
            </span>
          </div>

          {/* Identificador visual elegante da categoria atual */}
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} backdrop-blur-xs shadow-xs`}>
            <Sparkles className={`w-3 h-3 ${theme.sparkleColor}`} />
            MEMBRO {tierName} • {tierPercentage}%
          </span>
        </div>

        {/* Chip metálico simulado de cartão VIP personalizado pelo nível */}
        <div className="relative z-10 mb-4">
          <div className={`w-10 h-7 rounded-md bg-gradient-to-br ${theme.chipGradient} p-[1px] shadow-sm`}>
            <div className={`w-full h-full rounded-[5px] ${theme.chipInnerBg} border ${theme.chipBorder} flex items-center justify-center`}>
              <div className={`w-4 h-3 border ${theme.chipBorder} rounded-xs`} />
            </div>
          </div>
        </div>

        {/* Card Body: Saldo Disponível */}
        <div className="relative z-10 mt-1 mb-2">
          <span className={`text-[11px] font-medium tracking-[0.18em] uppercase ${theme.subtitleColor} block mb-1`}>
            Saldo Disponível em Carteira
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-serif ${theme.currencyColor} font-normal drop-shadow-xs`}>
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
            <span className={`text-[9px] uppercase tracking-[0.2em] ${theme.accentText} font-medium`}>
              Titular da Carteira
            </span>
            <span className="font-serif tracking-wider text-xs text-white uppercase font-medium">
              {customerName ? customerName : 'Cliente Privilège'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] tracking-widest ${theme.accentText} uppercase font-mono`}>
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
