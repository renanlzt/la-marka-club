'use client';

import React, { useState } from 'react';
import { Sparkles, MessageCircle, CheckCircle, ExternalLink, X, Edit3 } from 'lucide-react';
import { CounterSaleResult } from '@/lib/counter-service';

interface RewardSuccessModalProps {
  saleResult: CounterSaleResult | null;
  onClose: () => void;
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-lamarka-200 w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-lamarka-400 hover:text-lamarka-700 p-1.5 rounded-xl hover:bg-lamarka-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-200/60">
          Venda Registrada com Sucesso!
        </span>

        <h2 className="text-2xl font-serif font-bold text-lamarka-900 mb-1">
          {saleResult.customer.name}
        </h2>

        {/* Visual Card com o Ganho */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-lamarka-100/70 via-lamarka-50 to-white border border-lamarka-200">
          <p className="text-xs uppercase font-medium tracking-wider text-lamarka-700 mb-1">
            Cashback Ganho Nesta Compra
          </p>
          <div className="text-4xl font-serif font-bold text-emerald-700 tracking-tight">
            + R${' '}
            {saleResult.cashbackEarned.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-lamarka-200/80 flex justify-around text-xs text-lamarka-800">
            <div>
              <span className="text-lamarka-500 block">Total a Pagar</span>
              <span className="font-semibold">
                R$ {saleResult.netAmountToPay.toFixed(2)}
              </span>
            </div>
            {saleResult.redeemed > 0 && (
              <div>
                <span className="text-lamarka-500 block">Saldo Abatido</span>
                <span className="font-semibold text-rose-700">
                  - R$ {saleResult.redeemed.toFixed(2)}
                </span>
              </div>
            )}
            <div>
              <span className="text-lamarka-500 block">Novo Saldo Total</span>
              <span className="font-bold text-lamarka-900">
                R$ {saleResult.newBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Envio de WhatsApp */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2.5 group"
          >
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Enviar Mensagem no WhatsApp (1 Clique)
          </button>

          <button
            type="button"
            onClick={() => setShowEdit(!showEdit)}
            className="text-xs text-lamarka-600 hover:text-lamarka-900 flex items-center justify-center gap-1 font-light py-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
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
                className="w-full p-3 rounded-xl border border-lamarka-200 text-xs text-lamarka-900 font-sans focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 bg-lamarka-50/50"
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-2 text-xs text-lamarka-500 hover:text-lamarka-800 underline transition-colors"
          >
            Concluir atendimento e voltar ao caixa
          </button>
        </div>
      </div>
    </div>
  );
}
