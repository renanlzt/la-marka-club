'use client';

import React, { useEffect, useState } from 'react';
import { Gift, MessageCircle, Sparkles, Check, Heart } from 'lucide-react';

export default function AdminAniversariosPage() {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBirthdays = async () => {
    try {
      const res = await fetch('/api/admin/aniversarios');
      const data = await res.json();
      if (data.birthdays) setBirthdays(data.birthdays);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const handleSendGift = async (customerId: string) => {
    setProcessingId(customerId);
    try {
      const res = await fetch('/api/admin/aniversarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();

      if (res.ok && data.result) {
        // Abre o WhatsApp Web diretamente
        window.open(data.result.whatsAppLink, '_blank', 'noopener,noreferrer');
        fetchBirthdays();
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
          <Gift className="w-3 h-3 text-[#DFB76C]" /> Relacionamento & Carinho
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
          Aniversariantes do Mês
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Presenteie suas clientes com cashback de aniversário e envie os parabéns no WhatsApp com 1 clique.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 sm:p-7 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-lamarka-100">
          <h2 className="text-base font-serif font-medium text-lamarka-900">
            Clientes Fazendo Aniversário
          </h2>
          <span className="text-xs text-lamarka-600">
            Total no mês: <strong>{birthdays.length}</strong>
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-lamarka-500 font-light">Carregando...</p>
        ) : birthdays.length === 0 ? (
          <p className="py-8 text-center text-xs text-lamarka-500 font-light">
            Nenhuma cliente cadastrada com aniversário neste mês.
          </p>
        ) : (
          <div className="divide-y divide-lamarka-100">
            {birthdays.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-lamarka-50/50 px-2 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-2xs">
                    {item.birthDay ? `${item.birthDay}º` : <Heart className="w-4 h-4 text-rose-500" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-lamarka-900">
                      {item.name}
                    </h3>
                    <p className="text-xs text-lamarka-500 font-light mt-0.5">
                      Tel: {item.phone} • Aniversário: {item.birthDay}/{item.birthMonth}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {item.hasReceivedThisYear ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} /> Presente Já Enviado Este Ano
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendGift(item.id)}
                      disabled={processingId === item.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {processingId === item.id
                        ? 'Creditando...'
                        : 'Liberar Presente & Abrir WhatsApp'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
