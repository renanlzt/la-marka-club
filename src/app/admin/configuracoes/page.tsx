'use client';

import React, { useEffect, useState } from 'react';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import { Settings, Sparkles, AlertCircle } from 'lucide-react';

export default function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
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

  const handleSaveSettings = async (newSettings: any) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_settings',
        data: newSettings,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
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
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-lamarka-200/80 text-lamarka-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Settings className="w-3.5 h-3.5 text-lamarka-600" /> Parâmetros da Loja
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-lamarka-900">
          Configurações & Mensagens
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Gerencie o percentual padrão de cashback, validade, presentes de aniversário e os templates de WhatsApp com fallback oficial.
        </p>
      </div>

      {settings && (
        <SettingsForm
          initialSettings={settings}
          onSave={handleSaveSettings}
        />
      )}

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
