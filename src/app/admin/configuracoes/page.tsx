'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SettingsForm, StoreSettingsData } from '@/components/admin/SettingsForm';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import { Settings, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { VipTierConfig } from '@/lib/vip-tier-service';

export default function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [vipConfig, setVipConfig] = useState<VipTierConfig | undefined>(undefined);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (data.vipConfig) setVipConfig(data.vipConfig);
      if (data.templates) setTemplates(data.templates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (
    newSettings: StoreSettingsData,
    newVipConfig?: VipTierConfig
  ) => {
    // 1. Salva regras gerais da loja
    const resSettings = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_settings',
        data: newSettings,
      }),
    });

    if (resSettings.ok) {
      const data = await resSettings.json();
      setSettings(data.settings);
    }

    // 2. Salva regras de Níveis VIP
    if (newVipConfig) {
      const resVip = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_vip_config',
          data: newVipConfig,
        }),
      });

      if (resVip.ok) {
        const dataVip = await resVip.json();
        setVipConfig(dataVip.vipConfig);
      }
    }
  };

  const handleSaveTemplate = async (id: string, content: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_template',
        data: { id, content },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.template : t))
      );
    }
  };

  const handleResetTemplate = async (id: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_template',
        data: { id },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? data.template : t))
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-lamarka-500">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
          <Settings className="w-3 h-3 text-[#DFB76C]" /> Parâmetros da Loja
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
          Configurações & Mensagens
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Gerencie os níveis VIP de fidelidade, percentual padrão de cashback, validade, presente de aniversário e os templates de WhatsApp.
        </p>
      </div>

      {settings && (
        <SettingsForm
          initialSettings={settings}
          initialVipConfig={vipConfig}
          onSave={handleSaveSettings}
        />
      )}

      {/* Card Executivo de Direcionamento para Gestão de Usuários */}
      <div className="bg-[#FAF6F5] rounded-3xl border border-lamarka-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-lamarka-200 flex items-center justify-center text-lamarka-800 shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-lamarka-700" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="text-sm font-serif font-semibold text-lamarka-900 leading-tight">
              Acessos, Senhas & Equipe de Vendedoras
            </h4>
            <p className="text-xs text-lamarka-600 font-light mt-0.5">
              Crie logins, defina permissões (Gestão vs Balcão) e altere senhas na central de equipe.
            </p>
          </div>
        </div>

        <Link
          href="/admin/usuarios"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-lamarka-50 text-lamarka-800 text-xs font-semibold border border-lamarka-300/80 transition-all shadow-2xs hover:shadow-xs shrink-0"
        >
          <span>Gerenciar Usuários & Acessos</span>
          <ArrowRight className="w-3.5 h-3.5 text-lamarka-500" />
        </Link>
      </div>

      {/* Editor de Templates de WhatsApp */}
      {templates.length > 0 && (
        <TemplateEditor
          templates={templates}
          onSaveTemplate={handleSaveTemplate}
          onResetTemplate={handleResetTemplate}
        />
      )}
    </div>
  );
}
