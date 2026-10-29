'use client';

import React, { useState } from 'react';
import { Sparkles, MessageCircle, CheckCircle, X, Edit3, HeartHandshake } from 'lucide-react';
import { CounterSaleResult } from '@/lib/counter-service';
import { CelebrationSparkles } from '@/components/ui/CelebrationSparkles';

export interface RewardSuccessModalProps {
  saleResult: CounterSaleResult | null;
  onClose: () => void;
}

/**
 * Retorna o texto formatado para a celebração visual com a cliente no balcão
 */
export function formatCelebrationCashbackText(amount: number): string {
  const formatted = amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `✨ Parabéns! Você acabou de ganhar R$ ${formatted} de cashback!`;
}

export function RewardSuccessModal({
  saleResult,
  onClose,
}: RewardSuccessModalProps) {
  if (!saleResult) return null;

  const [customText, setCustomText] = useState(saleResult.whatsAppMessage);
  const [showEdit, setShowEdit] = useState(false);

  const getDynamicWhatsAppUrl = () => {
    let cleanPhone = saleResult.customer.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customText)}`;
  };

  const handleOpenWhatsApp = () => {
    const url = getDynamicWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formattedCashback = saleResult.cashbackEarned.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container relativo do modal com partículas de celebração ao redor */}
      <div className="relative w-full max-w-lg">
        {/* Micro-celebração: partículas e aura dourada La Marka */}
        <CelebrationSparkles showAura={true} />

        <div className="bg-white rounded-3xl border border-lamarka-200/80 w-full p-6 sm:p-8 shadow-luxury-lg relative animate-in fade-in zoom-in-95 duration-200 text-center overflow-hidden">
          {/* Botão de Fechar no topo */}
          <button
            onClick={onClose}
            title="Fechar"
            className="absolute top-5 right-5 text-lamarka-400 hover:text-lamarka-700 p-2 rounded-xl hover:bg-lamarka-100 transition-colors z-20"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Ícone de Celebração com Aura Champagne */}
          <div className="relative mx-auto mb-3.5 w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#DFB76C]/20 blur-md animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-amber-50 via-white to-emerald-50 border-2 border-[#DFB76C]/50 text-[#DFB76C] flex items-center justify-center shadow-card">
              <Sparkles className="w-9 h-9 text-[#DFB76C] animate-bounce" strokeWidth={1.5} />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 border border-emerald-200/70 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Venda Registrada com Sucesso!
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-lamarka-900 mb-1">
            {saleResult.customer.name}
          </h2>

          {/* Faixa de Encantamento: frase de celebração personalizada para virar a tela */}
          <div className="mt-2.5 mb-4 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-lamarka-50/80 to-amber-50/90 border border-[#DFB76C]/40 shadow-2xs">
            <p className="text-xs sm:text-sm font-serif font-semibold text-lamarka-800 tracking-wide flex items-center justify-center gap-1.5">
              <span>{formatCelebrationCashbackText(saleResult.cashbackEarned)}</span>
            </p>
          </div>

          {/* Visual Card com o Ganho (Destaque do Balcão) */}
          <div className="my-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-lamarka-50/90 via-white to-amber-50/30 border border-[#DFB76C]/30 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DFB76C]/15 to-transparent rounded-bl-full pointer-events-none" />

            <p className="text-[10px] uppercase font-semibold tracking-[0.18em] text-lamarka-600 mb-1">
              Cashback Concedido Nesta Compra
            </p>

            <div className="text-4xl sm:text-5xl font-serif font-bold text-emerald-800 tracking-tight my-1.5 drop-shadow-xs">
              + R$ {formattedCashback}
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/60 text-emerald-900 text-[10px] font-medium tracking-wide mt-1">
              <HeartHandshake className="w-3 h-3 text-emerald-700" />
              <span>Disponível para a próxima compra</span>
            </div>

            <div className="mt-4 pt-4 border-t border-lamarka-200/70 flex justify-around text-xs text-lamarka-800">
              <div>
                <span className="text-[10px] text-lamarka-500 uppercase tracking-wider block">Total Pago</span>
                <span className="font-serif font-semibold text-sm text-lamarka-900">
                  R$ {saleResult.netAmountToPay.toFixed(2)}
                </span>
              </div>
              {saleResult.redeemed > 0 && (
                <div>
                  <span className="text-[10px] text-lamarka-500 uppercase tracking-wider block">Saldo Abatido</span>
                  <span className="font-serif font-semibold text-sm text-rose-700">
                    - R$ {saleResult.redeemed.toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-lamarka-500 uppercase tracking-wider block">Novo Saldo Total</span>
                <span className="font-serif font-bold text-sm text-emerald-800">
                  R$ {saleResult.newBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Envio de WhatsApp e Ações */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group text-center leading-snug cursor-pointer"
            >
              <MessageCircle className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span>Enviar Mensagem no WhatsApp (1 Clique)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEdit(!showEdit)}
              className="text-xs text-lamarka-600 hover:text-lamarka-900 flex items-center justify-center gap-1 font-light py-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              {showEdit ? 'Ocultar prévia da mensagem' : 'Ver ou personalizar mensagem antes de enviar'}
            </button>

            {showEdit && (
              <div className="mt-2 text-left">
                <label className="text-[11px] font-semibold text-lamarka-700 block mb-1">
                  Texto do WhatsApp (você pode editar ou adicionar um recado):
                </label>
                <textarea
                  rows={5}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-lamarka-200 text-xs text-lamarka-900 font-sans focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 bg-lamarka-50/50"
                />
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-2 text-xs text-lamarka-500 hover:text-lamarka-800 underline transition-colors cursor-pointer"
            >
              Concluir atendimento e voltar ao caixa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
