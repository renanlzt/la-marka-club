'use client';

import React, { useState } from 'react';
import { X, Sparkles, User, Phone, Calendar, Check } from 'lucide-react';
import { CounterCustomerSummary } from '@/lib/counter-service';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: CounterCustomerSummary) => void;
}

export function QuickRegisterModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickRegisterModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/balcao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          data: {
            name: name.trim(),
            phone: phone.trim(),
            birthDay: birthDay ? parseInt(birthDay, 10) : undefined,
            birthMonth: birthMonth ? parseInt(birthMonth, 10) : undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        onSuccess(data.customer);
        onClose();
      } else {
        setError(data.error || 'Erro ao cadastrar cliente.');
      }
    } catch (err: any) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-lamarka-200 w-full max-w-md p-6 sm:p-7 shadow-luxury-lg relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-lamarka-400 hover:text-lamarka-700 p-2 rounded-xl hover:bg-lamarka-100 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-100 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-200/60">
          <Sparkles className="w-3 h-3 text-[#DFB76C]" strokeWidth={1.5} /> Cadastro Expresso (10s)
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-medium text-lamarka-900 mb-1">
          Cadastrar Nova Cliente
        </h2>
        <p className="text-xs text-lamarka-600 font-light mb-5">
          Ative a carteira digital de cashback para acumular nesta compra.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
              Nome da Cliente *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-3.5" strokeWidth={1.5} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mariana Albuquerque"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
              Telefone / WhatsApp *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-3.5" strokeWidth={1.5} />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
                Dia Nasc.
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                placeholder="Dia (ex: 18)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
                Mês Nasc.
              </label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-lamarka-200 text-sm focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 bg-white shadow-2xs"
              >
                <option value="">Selecione o mês</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-lamarka-500 font-light mt-0.5">
            * O aniversário é usado para presentear a cliente com cashback na data especial!
          </p>

          <div className="flex gap-2.5 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-lamarka-200 text-xs font-medium text-lamarka-700 hover:bg-lamarka-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
              {saving ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
