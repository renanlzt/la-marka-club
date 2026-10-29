'use client';

import React, { useState } from 'react';
import { Save, Check, Crown, Sparkles, Shield, ArrowUpRight } from 'lucide-react';
import { VipTierConfig, DEFAULT_VIP_CONFIG } from '@/lib/vip-tier-service';
import { PercentageInput } from '@/components/ui/PercentageInput';

export interface StoreSettingsData {
  storeName: string;
  defaultCashbackPercentage: number;
  defaultExpirationDays: number;
  birthdayBonusAmount: number;
  birthdayBonusValidityDays: number;
  birthdayBonusDaysBefore: number;
}

interface SettingsFormProps {
  initialSettings: StoreSettingsData;
  initialVipConfig?: VipTierConfig;
  onSave: (settingsData: StoreSettingsData, vipData?: VipTierConfig) => Promise<void>;
}

export function SettingsForm({
  initialSettings,
  initialVipConfig,
  onSave,
}: SettingsFormProps) {
  const [formData, setFormData] = useState<StoreSettingsData>(initialSettings);
  const [vipConfig, setVipConfig] = useState<VipTierConfig>(
    initialVipConfig ?? {
      ...DEFAULT_VIP_CONFIG,
      bronzePercentage: initialSettings.defaultCashbackPercentage ?? 0.5,
    }
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mantém o nível Bronze sincronizado com o defaultCashbackPercentage
  const handleDefaultCashbackChange = (val: number) => {
    setFormData((prev) => ({ ...prev, defaultCashbackPercentage: val }));
    setVipConfig((prev) => ({ ...prev, bronzePercentage: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await onSave(formData, vipConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. Regras Gerais do Clube */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card flex flex-col gap-5">
        <div className="border-b border-lamarka-100 pb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-lamarka-600 block mb-1">
            Parâmetros Gerais
          </span>
          <h3 className="text-lg font-serif font-medium text-lamarka-900">
            Regras de Cashback & Validade
          </h3>
          <p className="text-xs text-lamarka-600 font-light mt-0.5">
            Defina o cashback base da loja, validade dos lotes e bonificação de aniversário.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Percentual Padrão */}
          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Percentual Padrão de Cashback (%)
            </label>
            <PercentageInput
              value={formData.defaultCashbackPercentage}
              onChange={handleDefaultCashbackChange}
              placeholder="Ex: 0,5"
            />
            <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
              Aceita qualquer valor (ex: 0,5%, 0,05% ou 1%). Sincronizado com o nível Bronze.
            </span>
          </div>

          {/* Validade */}
          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Prazo Padrão de Validade do Cashback (dias)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="365"
                required
                value={formData.defaultExpirationDays || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultExpirationDays: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 font-semibold text-lamarka-900"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-lamarka-400">
                dias
              </span>
            </div>
            <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
              Período em que a cliente pode resgatar o saldo gerado na compra.
            </span>
          </div>

          {/* Presente Aniversário R$ */}
          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Bônus de Aniversário (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-lamarka-400">
                R$
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.birthdayBonusAmount || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    birthdayBonusAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 font-semibold text-lamarka-900"
              />
            </div>
            <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
              Valor creditado no mês de aniversário da cliente.
            </span>
          </div>

          {/* Validade Presente Aniversário */}
          <div>
            <label className="text-xs font-semibold text-lamarka-800 block mb-1">
              Validade do Bônus de Aniversário (dias)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="120"
                required
                value={formData.birthdayBonusValidityDays || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    birthdayBonusValidityDays: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 font-semibold text-lamarka-900"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-lamarka-400">
                dias
              </span>
            </div>
            <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
              Prazo para a cliente usar o presente na loja.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Níveis de Fidelidade VIP Configuráveis (Bronze -> Prata -> Ouro -> Diamante) */}
      <div className="bg-white rounded-3xl border border-[#DFB76C]/40 p-6 sm:p-7 shadow-card flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-lamarka-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[#DFB76C]" strokeWidth={1.75} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C6219]">
                Programa de Fidelidade Exclusivo
              </span>
            </div>
            <h3 className="text-lg font-serif font-medium text-lamarka-900">
              Categorias VIP La Marka Privilège
            </h3>
            <p className="text-xs text-lamarka-600 font-light mt-0.5">
              Personalize os limites de compras acumuladas (últimos 6 meses) e os percentuais de cada categoria. Categoria inicial: <strong>Bronze</strong>.
            </p>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-[#DFB76C]/20 text-[#8C6219] border border-[#DFB76C]/40">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" />
            4 Níveis Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoria 1: Bronze (Base Inicial) */}
          <div className="p-4 rounded-2xl border border-amber-900/20 bg-amber-900/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-950 flex items-center gap-1">
                  🥉 Membro Bronze
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-900/15 text-amber-900 font-medium">
                  Inicial
                </span>
              </div>
              <p className="text-[11px] text-amber-900/70 font-light mb-3">
                Categoria base para todas as novas clientes participantes.
              </p>

              <label className="text-[11px] font-medium text-amber-950 block mb-1">
                Cashback Bronze (%):
              </label>
              <PercentageInput
                value={vipConfig.bronzePercentage}
                onChange={handleDefaultCashbackChange}
                placeholder="Ex: 0,5"
              />
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-900/10 text-[10px] text-amber-900/70 font-light">
              Gasto mínimo: <strong className="font-semibold text-amber-950">R$ 0,00</strong>
            </div>
          </div>

          {/* Categoria 2: Prata */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  🥈 Membro Prata
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                  2º Nível
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-light mb-3">
                Primeiro salto de compras na boutique.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                    Compras Mínimas (6 meses):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={vipConfig.silverMinSpent || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setVipConfig({
                          ...vipConfig,
                          silverMinSpent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                    Cashback Prata (%):
                  </label>
                  <PercentageInput
                    value={vipConfig.silverPercentage}
                    onChange={(val) =>
                      setVipConfig((prev) => ({ ...prev, silverPercentage: val }))
                    }
                    placeholder="Ex: 1,0"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[10px] text-slate-500 font-light">
              Ex: {vipConfig.silverPercentage}% a partir de R$ {vipConfig.silverMinSpent.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Categoria 3: Ouro */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  🥇 Membro Ouro
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-medium">
                  Fidelizada
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-light mb-3">
                Clientes frequentes com guarda-roupa La Marka.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-amber-900 block mb-1">
                    Compras Mínimas (6 meses):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-amber-600">
                      R$
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={vipConfig.goldMinSpent || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setVipConfig({
                          ...vipConfig,
                          goldMinSpent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-amber-900 block mb-1">
                    Cashback Ouro (%):
                  </label>
                  <PercentageInput
                    value={vipConfig.goldPercentage}
                    onChange={(val) =>
                      setVipConfig((prev) => ({ ...prev, goldPercentage: val }))
                    }
                    placeholder="Ex: 1,5"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-[10px] text-amber-700 font-light">
              Ex: {vipConfig.goldPercentage}% a partir de R$ {vipConfig.goldMinSpent.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Categoria 4: Diamante */}
          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                  💎 Membro Diamante
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900 font-medium">
                  Máxima
                </span>
              </div>
              <p className="text-[11px] text-purple-800/80 font-light mb-3">
                Principais clientes VIP e embaixadoras do clube.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-purple-900 block mb-1">
                    Compras Mínimas (6 meses):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-purple-600">
                      R$
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={vipConfig.diamondMinSpent || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setVipConfig({
                          ...vipConfig,
                          diamondMinSpent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-purple-300 text-xs font-bold text-purple-950 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-purple-900 block mb-1">
                    Cashback Diamante (%):
                  </label>
                  <PercentageInput
                    value={vipConfig.diamondPercentage}
                    onChange={(val) =>
                      setVipConfig((prev) => ({ ...prev, diamondPercentage: val }))
                    }
                    placeholder="Ex: 2,0"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-purple-200/80 text-[10px] text-purple-700 font-light">
              Ex: {vipConfig.diamondPercentage}% a partir de R$ {vipConfig.diamondMinSpent.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Simulação em Tempo Real das 4 Categorias */}
        <div className="bg-[#FAF6F5] rounded-2xl p-4 border border-lamarka-200/70">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-lamarka-600 block mb-1">
            Simulação de Retorno em uma compra de R$ 100,00
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white rounded-xl p-2 border border-amber-900/20">
              <span className="text-[10px] text-amber-900/80 block">Bronze ({vipConfig.bronzePercentage}%)</span>
              <strong className="text-amber-950 font-semibold">
                R$ {(100 * (vipConfig.bronzePercentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Prata ({vipConfig.silverPercentage}%)</span>
              <strong className="text-slate-800 font-semibold">
                R$ {(100 * (vipConfig.silverPercentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="bg-white rounded-xl p-2 border border-amber-200">
              <span className="text-[10px] text-amber-700 block">Ouro ({vipConfig.goldPercentage}%)</span>
              <strong className="text-amber-900 font-semibold">
                R$ {(100 * (vipConfig.goldPercentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="bg-white rounded-xl p-2 border border-purple-200">
              <span className="text-[10px] text-purple-700 block">Diamante ({vipConfig.diamondPercentage}%)</span>
              <strong className="text-purple-900 font-semibold">
                R$ {(100 * (vipConfig.diamondPercentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Salvar Parâmetros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-3xl border border-lamarka-200 gap-3 shadow-xs">
        <div>
          {success && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" /> Parâmetros e Níveis VIP salvos com sucesso!
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all shadow-luxury hover:shadow-luxury-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" strokeWidth={1.75} />
          {saving ? 'Salvando Parâmetros...' : 'Salvar Todos os Parâmetros'}
        </button>
      </div>
    </form>
  );
}
