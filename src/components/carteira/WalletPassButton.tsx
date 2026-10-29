'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Smartphone, ExternalLink, ShieldCheck, Download } from 'lucide-react';

interface WalletPassButtonProps {
  magicToken: string;
  customerName?: string;
  availableBalance?: number;
}

export function WalletPassButton({
  magicToken,
  customerName,
  availableBalance = 0,
}: WalletPassButtonProps) {
  const [loadingType, setLoadingType] = useState<'apple' | 'google' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<'apple' | 'google' | null>(null);

  const handleAppleWallet = () => {
    setLoadingType('apple');
    // Inicia download direto do passe oficial PassKit (.pkpass)
    const passUrl = `/api/wallet/apple/${encodeURIComponent(magicToken)}`;
    window.location.href = passUrl;

    setTimeout(() => {
      setLoadingType(null);
      setDownloadSuccess('apple');
      setTimeout(() => setDownloadSuccess(null), 4000);
    }, 1200);
  };

  const handleGoogleWallet = async () => {
    try {
      setLoadingType('google');
      const res = await fetch(`/api/wallet/google/${encodeURIComponent(magicToken)}`);
      if (!res.ok) throw new Error('Falha ao gerar passe do Google Wallet');
      const data = await res.json();

      if (data.saveUrl) {
        window.open(data.saveUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = `/api/wallet/google/${encodeURIComponent(magicToken)}?redirect=true`;
      }

      setDownloadSuccess('google');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Erro ao abrir Google Wallet:', err);
      // Fallback para redirect direto
      window.location.href = `/api/wallet/google/${encodeURIComponent(magicToken)}?redirect=true`;
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-white/95 to-[#FAF6F5]/90 backdrop-blur-md rounded-3xl border border-[#DFB76C]/40 p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5F3A36]/10 border border-[#5F3A36]/20 flex items-center justify-center text-[#5F3A36] shadow-2xs">
            <Smartphone className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-lamarka-600 block">
              Cartão Digital no Celular
            </span>
            <h3 className="text-sm font-serif font-semibold text-lamarka-900 leading-tight">
              📲 Adicionar à Carteira do Celular
            </h3>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#DFB76C]/20 text-[#8C6219] border border-[#DFB76C]/40">
          <Sparkles className="w-3 h-3 text-[#DFB76C]" />
          Acesso Rápido
        </span>
      </div>

      {/* Explicação sutil recomendada */}
      <div className="bg-[#FAF6F5] rounded-2xl p-3 border border-lamarka-200/70 mb-4">
        <p className="text-xs text-lamarka-700 font-light leading-relaxed">
          Acesse seu saldo com 1 toque na tela de bloqueio e receba avisos perto da loja.
        </p>
      </div>

      {/* Badges e Botões de Carteira Apple & Google */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Botão Apple Wallet */}
        <button
          type="button"
          onClick={handleAppleWallet}
          disabled={loadingType !== null}
          className="relative group flex items-center justify-between px-4 py-3 rounded-2xl bg-[#111111] hover:bg-black text-white text-xs font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed border border-white/10"
        >
          <div className="flex items-center gap-2.5">
            {/* Ícone Apple SVG oficial */}
            <svg
              className="w-4 h-4 fill-current text-white shrink-0"
              viewBox="0 0 170 170"
            >
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.3-9.68-11.26-20.65-14.88-32.92-3.62-12.27-5.43-23.77-5.43-34.5 0-14.92 3.8-27.46 11.41-37.62 7.6-10.16 17.15-15.34 28.65-15.54 4.8 0 10.3 1.34 16.5 4.02 6.2 2.68 10.22 4.08 12.06 4.2 1.48-.12 5.76-1.61 12.83-4.46 7.07-2.85 13.06-4.14 17.97-3.86 13.43.83 24.18 5.74 32.25 14.73-11.75 7.1-17.51 16.92-17.29 29.47.22 9.87 4.04 18.2 11.46 25 7.42 6.8 16.14 10.74 26.16 11.83-2.23 7.03-4.8 13.88-7.7 20.55zM119.22 33.64c0-7.23 2.63-14.07 7.89-20.52 5.26-6.45 11.97-10.7 20.13-12.75-.11 1.46-.28 2.87-.51 4.23-1.01 5.92-3.65 11.85-7.92 17.79-4.27 5.94-9.61 9.94-16.02 12-1.28.43-2.47.74-3.57.92z" />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-white/70 uppercase tracking-wider font-light leading-none">
                Adicionar ao
              </span>
              <span className="text-xs font-semibold tracking-wide text-white leading-tight">
                Apple Wallet
              </span>
            </div>
          </div>

          <div className="flex items-center text-white/80 group-hover:text-white">
            {loadingType === 'apple' ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : downloadSuccess === 'apple' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
            )}
          </div>
        </button>

        {/* Botão Google Wallet */}
        <button
          type="button"
          onClick={handleGoogleWallet}
          disabled={loadingType !== null}
          className="relative group flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-white text-lamarka-900 text-xs font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed border border-lamarka-300"
        >
          <div className="flex items-center gap-2.5">
            {/* Ícone Google Wallet SVG com 4 cores clássicas */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.43 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-lamarka-500 uppercase tracking-wider font-light leading-none">
                Salvar no
              </span>
              <span className="text-xs font-semibold tracking-wide text-lamarka-900 leading-tight">
                Google Wallet
              </span>
            </div>
          </div>

          <div className="flex items-center text-lamarka-500 group-hover:text-lamarka-900">
            {loadingType === 'google' ? (
              <span className="w-3.5 h-3.5 border-2 border-lamarka-300 border-t-lamarka-800 rounded-full animate-spin" />
            ) : downloadSuccess === 'google' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 text-lamarka-400 group-hover:text-lamarka-700 transition-colors" />
            )}
          </div>
        </button>
      </div>

      {/* Feedback de sucesso temporário */}
      {downloadSuccess && (
        <div className="mt-3 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 animate-fadeIn">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {downloadSuccess === 'apple'
              ? 'Passe da Apple Wallet gerado! Abra o arquivo para adicionar ao iPhone.'
              : 'Passe do Google Wallet pronto! Conclua o salvamento no app.'}
          </span>
        </div>
      )}
    </div>
  );
}
