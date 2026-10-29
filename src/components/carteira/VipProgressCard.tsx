import React from 'react';
import { Crown, Sparkles, Award, ChevronRight } from 'lucide-react';

export interface VipProgressCardProps {
  availableBalance: number;
  totalAccumulated?: number;
  vipTier?: {
    tier: string;
    percentage: number;
    label: string;
    badgeColor: string;
    nextTierSpentRequired: number | null;
    totalSpent6Months: number;
  };
}

export function getVipTierInfo(accumulated: number) {
  if (accumulated >= 300) {
    return {
      currentTier: 'Diamante',
      nextTier: 'VIP Étoile',
      progressPercentage: 100,
      remaining: 0,
      isMaxTier: true,
      badgeColor: 'bg-[#DFB76C]/25 text-[#9A7328] border-[#DFB76C]/50',
    };
  }

  if (accumulated >= 100) {
    const tierProgress = Math.min(100, Math.max(8, Math.round(((accumulated - 100) / 200) * 100)));
    return {
      currentTier: 'Ouro',
      nextTier: 'Diamante',
      progressPercentage: tierProgress,
      remaining: Math.max(0, 300 - accumulated),
      isMaxTier: false,
      badgeColor: 'bg-[#DFB76C]/20 text-[#8C6219] border-[#DFB76C]/40',
    };
  }

  const tierProgress = Math.min(100, Math.max(8, Math.round((accumulated / 100) * 100)));
  return {
    currentTier: 'Prata',
    nextTier: 'Ouro',
    progressPercentage: tierProgress,
    remaining: Math.max(0, 100 - accumulated),
    isMaxTier: false,
    badgeColor: 'bg-lamarka-200/60 text-lamarka-800 border-lamarka-300',
  };
}

export function VipProgressCard({
  availableBalance,
  totalAccumulated,
  vipTier,
}: VipProgressCardProps) {
  const effectiveAccumulated = Math.max(availableBalance, totalAccumulated ?? 0);

  // Se o objeto oficial do motor VIP for fornecido, utiliza os dados reais
  let currentTier = 'Prata';
  let nextTier = 'Ouro';
  let isMaxTier = false;
  let progressPercentage = 50;
  let remaining = 0;
  let badgeColor = 'bg-lamarka-200/60 text-lamarka-800 border-lamarka-300';
  let percentage = 1.0;

  if (vipTier) {
    percentage = vipTier.percentage;
    badgeColor = vipTier.badgeColor;

    if (vipTier.tier === 'DIAMANTE') {
      currentTier = 'Diamante';
      nextTier = 'Categoria Máxima';
      isMaxTier = true;
      progressPercentage = 100;
      remaining = 0;
    } else if (vipTier.tier === 'OURO') {
      currentTier = 'Ouro';
      nextTier = 'Diamante';
      isMaxTier = false;
      remaining = vipTier.nextTierSpentRequired ?? 0;
      const spent = vipTier.totalSpent6Months;
      progressPercentage = Math.min(100, Math.max(10, Math.round((spent / (spent + remaining || 1)) * 100)));
    } else {
      currentTier = 'Prata';
      nextTier = 'Ouro';
      isMaxTier = false;
      remaining = vipTier.nextTierSpentRequired ?? 500;
      const spent = vipTier.totalSpent6Months;
      progressPercentage = Math.min(100, Math.max(8, Math.round((spent / (spent + remaining || 1)) * 100)));
    }
  } else {
    const fallback = getVipTierInfo(effectiveAccumulated);
    currentTier = fallback.currentTier;
    nextTier = fallback.nextTier;
    isMaxTier = fallback.isMaxTier;
    progressPercentage = fallback.progressPercentage;
    remaining = fallback.remaining;
    badgeColor = fallback.badgeColor;
  }

  const formattedAccumulated = effectiveAccumulated.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedRemaining = remaining.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#DFB76C]/30 p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all">
      {/* Header do Card com Status VIP */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#DFB76C]/15 border border-[#DFB76C]/30 flex items-center justify-center text-[#9A7328] shadow-2xs">
            <Crown className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-lamarka-600 block">
              Programa de Fidelidade
            </span>
            <h3 className="text-sm font-serif font-semibold text-lamarka-900 leading-tight">
              Status La Marka Privilège
            </h3>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full border shadow-2xs ${badgeColor}`}
        >
          <Sparkles className="w-3 h-3 text-[#DFB76C]" />
          Nível {currentTier} ({percentage}%)
        </span>
      </div>

      {/* Mensagem Acolhedora de Progresso */}
      <div className="bg-[#FAF6F5] rounded-2xl p-3.5 border border-lamarka-200/70 mb-4">
        <p className="text-xs text-lamarka-800 font-light leading-relaxed">
          Você já acumulou <strong className="font-semibold text-lamarka-900">R$ {formattedAccumulated}</strong> de cashback! {isMaxTier ? 'Você já desfruta dos maiores benefícios e cashback da loja.' : `Continue comprando para alcançar o nível ${nextTier} e turbinar seu retorno.`}
        </p>
      </div>

      {/* Indicadores de Nível: Nível Atual -> Próximo Nível */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lamarka-500 font-light">Nível Atual:</span>
          <span className="font-semibold text-lamarka-900 font-serif text-sm">
            {currentTier}
          </span>
        </div>

        {!isMaxTier ? (
          <div className="flex items-center gap-1 text-lamarka-600">
            <span className="text-lamarka-500 font-light">Próximo:</span>
            <span className="font-semibold text-[#8C6219] font-serif text-sm flex items-center">
              {nextTier}
              <ChevronRight className="w-3.5 h-3.5 text-[#DFB76C]" />
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#8C6219] uppercase tracking-wider">
            Nível Máximo Atingido ✨
          </span>
        )}
      </div>

      {/* Barra de Progresso Dourada / Champagne */}
      <div className="w-full h-3 rounded-full bg-lamarka-100/90 p-0.5 border border-[#DFB76C]/25 overflow-hidden shadow-inner relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#DFB76C] via-[#EDD293] to-[#C59B94] transition-all duration-700 shadow-glow-gold relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Efeito sutil de luz na barra */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
        </div>
      </div>

      {/* Rodapé do Progresso */}
      <div className="flex items-center justify-between mt-2.5 px-0.5">
        <span className="text-[10px] tracking-wide text-lamarka-500 font-light">
          {progressPercentage}% da jornada
        </span>
        {!isMaxTier && (
          <span className="text-[10px] tracking-wide text-lamarka-600 font-medium">
            Faltam R$ {formattedRemaining} em compras para {nextTier}
          </span>
        )}
      </div>
    </div>
  );
}
