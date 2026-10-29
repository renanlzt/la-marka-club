'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function AdminCampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PERCENTAGE_OVERRIDE');
  const [value, setValue] = useState('10');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campanhas');
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          value,
          startsAt,
          endsAt,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setDescription('');
        setStartsAt('');
        setEndsAt('');
        fetchCampaigns();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/campanhas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, campName: string) => {
    if (!window.confirm(`Deseja realmente excluir a campanha "${campName}"?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/campanhas?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <Megaphone className="w-3 h-3 text-[#DFB76C]" /> Vendas & Campanhas
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Campanhas Especiais
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            Crie períodos promocionais (Cashback em Dobro, Outubro Rosa, Black Friday) com regras e prazos customizados.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto px-4.5 py-2.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold flex items-center gap-2 shadow-luxury hover:shadow-luxury-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Campanha
        </button>
      </div>

      {/* Lista de Campanhas */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
        <h2 className="text-base font-serif font-medium text-lamarka-900 mb-4">
          Campanhas Cadastradas
        </h2>

        {campaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-lamarka-500 font-light">
            Nenhuma campanha cadastrada no momento. Clique em &quot;Nova Campanha&quot; para criar sua primeira ação!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const now = new Date();
              const isWithinDate =
                new Date(camp.startsAt) <= now && new Date(camp.endsAt) >= now;
              const isCurrent = isWithinDate && camp.isActive;
              const isPaused = !camp.isActive;

              return (
                <div
                  key={camp.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                      : isPaused
                      ? 'border-amber-200 bg-amber-50/20 opacity-80'
                      : 'border-lamarka-200 bg-lamarka-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPaused
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-lamarka-200 text-lamarka-700'
                        }`}
                      >
                        {isCurrent
                          ? 'Ativa no Momento'
                          : isPaused
                          ? 'Pausada'
                          : 'Encerrada / Agendada'}
                      </span>
                      <span className="text-xs font-bold text-lamarka-900">
                        {camp.type === 'PERCENTAGE_OVERRIDE'
                          ? `${camp.value}% de Cashback`
                          : `${camp.value}x Multiplicador`}
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-lamarka-900">
                      {camp.name}
                    </h3>
                    {camp.description && (
                      <p className="text-xs text-lamarka-600 font-light mt-1">
                        {camp.description}
                      </p>
                    )}

                    {/* Estatísticas de Conversão */}
                    <div className="mt-3 py-2 px-3 rounded-xl bg-white/70 border border-lamarka-200/50 flex items-center justify-between text-[11px] text-lamarka-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#DFB76C]" />
                        {camp.stats?.totalCreditsCount ?? 0} compras vinculadas
                      </span>
                      <span className="font-semibold text-emerald-800">
                        R$ {(camp.stats?.totalCashbackGranted ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} concedidos
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-lamarka-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-lamarka-500 font-light">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Intl.DateTimeFormat('pt-BR').format(new Date(camp.startsAt))} até{' '}
                        {new Intl.DateTimeFormat('pt-BR').format(new Date(camp.endsAt))}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(camp.id, camp.isActive)}
                        disabled={actionLoadingId === camp.id}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          camp.isActive
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                        }`}
                        title={camp.isActive ? 'Pausar campanha' : 'Reativar campanha'}
                      >
                        {camp.isActive ? (
                          <>
                            <PauseCircle className="w-3 h-3" /> Pausar
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3 h-3" /> Reativar
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(camp.id, camp.name)}
                        disabled={actionLoadingId === camp.id}
                        className="px-2 py-1 rounded-lg text-[11px] text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Excluir campanha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar Campanha */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-lamarka-200 w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-lamarka-900 mb-1">
              Criar Nova Campanha
            </h3>
            <p className="text-xs text-lamarka-600 font-light mb-4">
              Defina as regras da campanha para aplicar aos caixas automaticamente.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Semana da Cliente La Marka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-xs focus:outline-none focus:border-lamarka-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                  Descrição / Motivo (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Todas as clientes ganham cashback em dobro nesta semana comemorativa!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-lamarka-200 text-xs focus:outline-none focus:border-lamarka-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                  Tipo de Regra
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-lamarka-200 text-xs bg-white focus:outline-none focus:border-lamarka-500"
                >
                  <option value="PERCENTAGE_OVERRIDE">Percentual Promocional Fixo (ex: 10%)</option>
                  <option value="MULTIPLIER">Multiplicador de Cashback (ex: 2x = dobro)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                  Valor da Regra *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ex: 10 para 10% ou 2 para 2x"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-xs focus:outline-none focus:border-lamarka-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-lamarka-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-lamarka-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-lamarka-200 text-xs font-medium text-lamarka-700 hover:bg-lamarka-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
