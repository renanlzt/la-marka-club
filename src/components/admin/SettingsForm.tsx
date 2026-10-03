'use client';

import React, { useState } from 'react';
import { Save, Check, Settings2, Sparkles } from 'lucide-react';

interface StoreSettingsData {
  storeName: string;
  defaultCashbackPercentage: number;
  defaultExpirationDays: number;
  birthdayBonusAmount: number;
  birthdayBonusValidityDays: number;
  birthdayBonusDaysBefore: number;
}

interface SettingsFormProps {
  initialSettings: StoreSettingsData;
  onSave: (data: StoreSettingsData) => Promise<void>;
}

export function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
  const [formData, setFormData] = useState<StoreSettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card flex flex-col gap-5"
    >
      <div className="border-b border-lamarka-100 pb-4">
        <h3 className="text-lg font-serif font-medium text-lamarka-900">
          Regras Gerais do Clube
        </h3>
        <p className="text-xs text-lamarka-600 font-light mt-0.5">
          Defina os parâmetros padrão de cashback, validade e benefícios da La Marka.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Percentual Padrão de Cashback (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="1"
              max="100"
              required
              value={formData.defaultCashbackPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultCashbackPercentage: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 font-semibold text-lamarka-900"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-lamarka-400">
              %
            </span>
          </div>
          <span className="text-[11px] text-lamarka-500 font-light mt-1 block">
            Ex: Compra de R$ 300,00 a 5% gera R$ 15,00 de crédito.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Prazo Padrão de Validade do Cashback (dias)
          </label>
          <div className="relative">
            <input
              type="number"
              min="7"
              max="365"
              required
              value={formData.defaultExpirationDays}
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
            Ex: 45 dias para estimular o retorno frequente à loja.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Valor do Presente de Aniversário (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-lamarka-400">
              R$
            </span>
            <input
              type="number"
              step="5"
              min="0"
              required
              value={formData.birthdayBonusAmount}
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
            Bônus especial em reais presenteado à aniversariante.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Validade do Presente de Aniversário (dias)
          </label>
          <div className="relative">
            <input
              type="number"
              min="7"
              max="180"
              required
              value={formData.birthdayBonusValidityDays}
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

      <div className="flex items-center justify-between pt-3 border-t border-lamarka-100">
        <div>
          {success && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Parâmetros salvos com sucesso!
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all shadow-luxury hover:shadow-luxury-lg flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          {saving ? 'Salvando...' : 'Salvar Parâmetros'}
        </button>
      </div>
    </form>
  );
}
