'use client';

import React, { useState } from 'react';
import { MessageCircle, RotateCcw, Check, Sparkles } from 'lucide-react';

interface TemplateItem {
  id: string;
  title: string;
  content: string;
  isCustomized: boolean;
}

interface TemplateEditorProps {
  templates: TemplateItem[];
  onSaveTemplate: (id: string, content: string) => Promise<void>;
  onResetTemplate: (id: string) => Promise<void>;
}

const availableTags = [
  { tag: '{primeiro_nome}', label: 'Primeiro Nome' },
  { tag: '{nome}', label: 'Nome Completo' },
  { tag: '{valor_compra}', label: 'Valor da Compra' },
  { tag: '{cashback_ganho}', label: 'Cashback Ganho' },
  { tag: '{saldo_utilizado}', label: 'Saldo Utilizado' },
  { tag: '{saldo_total}', label: 'Saldo Atualizado' },
  { tag: '{validade}', label: 'Data de Expiração' },
  { tag: '{dias_para_expirar}', label: 'Dias Restantes' },
  { tag: '{link_carteira}', label: 'Link da Carteira' },
];

export function TemplateEditor({
  templates,
  onSaveTemplate,
  onResetTemplate,
}: TemplateEditorProps) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id || 'EARN_PURCHASE');
  const [content, setContent] = useState(
    templates.find((t) => t.id === selectedId)?.content || ''
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentTemplate = templates.find((t) => t.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const found = templates.find((t) => t.id === id);
    setContent(found?.content || '');
    setSuccess(false);
  };

  const handleInsertTag = (tag: string) => {
    setContent((prev) => prev + tag);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await onSaveTemplate(selectedId, content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Deseja restaurar a mensagem padrão oficial da La Marka? As alterações personalizadas deste texto serão substituídas pelo padrão.'
      )
    ) {
      setSaving(true);
      try {
        await onResetTemplate(selectedId);
        const updated = templates.find((t) => t.id === selectedId);
        if (updated) setContent(updated.content);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-lamarka-100 pb-4 gap-2">
        <div>
          <h3 className="text-lg font-serif font-medium text-lamarka-900">
            Editor de Mensagens de WhatsApp
          </h3>
          <p className="text-xs text-lamarka-600 font-light mt-0.5">
            Personalize os textos enviados automaticamente para as clientes ou use os padrões oficiais.
          </p>
        </div>

        {currentTemplate?.isCustomized ? (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 self-start sm:self-auto shrink-0">
            Mensagem Personalizada
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shrink-0">
            Padrão Oficial La Marka
          </span>
        )}
      </div>

      {/* Abas dos Tipos de Mensagem */}
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedId === t.id
                ? 'bg-lamarka-800 text-white shadow-xs'
                : 'bg-lamarka-50 text-lamarka-700 hover:bg-lamarka-100'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Editor & Tags */}
      <div>
        <label className="text-xs font-semibold text-lamarka-800 block mb-2">
          Tags Dinâmicas (clique para inserir no texto):
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {availableTags.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => handleInsertTag(item.tag)}
              className="px-2.5 py-1 rounded-lg bg-lamarka-100 hover:bg-lamarka-200 text-lamarka-800 text-[11px] font-mono font-medium transition-colors border border-lamarka-200/60"
            >
              + {item.tag} <span className="font-sans text-[10px] text-lamarka-600">({item.label})</span>
            </button>
          ))}
        </div>

        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-4 rounded-2xl border border-lamarka-200 text-xs sm:text-sm text-lamarka-900 font-sans focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200 leading-relaxed"
          placeholder="Digite o texto da mensagem..."
        />
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-lamarka-600 hover:text-lamarka-900 hover:bg-lamarka-100 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Padrão Oficial
        </button>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {success && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all shadow-luxury hover:shadow-luxury-lg flex items-center justify-center gap-2"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
