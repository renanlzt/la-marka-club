'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Store,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export default function PortalPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Checa cookie ou sessão
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const currentRole = match ? match[2] : 'GESTAO';
    setRole(currentRole);

    // Se for perfil de balcão, vai direto para o balcão
    if (currentRole === 'BALCAO') {
      router.replace('/balcao');
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  if (role === 'BALCAO') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lamarka-100/60 via-lamarka-50 to-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[40px] border-lamarka-800 rotate-45 transform"></div>
      </div>

      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 relative rounded-xl overflow-hidden border border-lamarka-200 shadow-2xs bg-white shrink-0">
            <Image src="/logo.png" alt="La Marka" fill className="object-contain p-1" priority />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-base text-lamarka-900 leading-tight">
              La Marka Club
            </h2>
            <span className="text-[11px] text-lamarka-600 font-light">
              Portal da Equipe • Perfil Gestão
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-lamarka-200 bg-white hover:bg-lamarka-100 text-lamarka-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <LogOut className="w-3.5 h-3.5 text-lamarka-500" strokeWidth={1.5} />
          Sair
        </button>
      </div>

      {/* Main Choice Cards */}
      <div className="w-full max-w-3xl mx-auto my-auto z-10 text-center py-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-3 border border-lamarka-300/50">
          <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Escolha seu Portal
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-lamarka-900 tracking-tight mb-2">
          Para onde deseja ir hoje?
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light max-w-md mx-auto mb-10">
          Seu perfil possui acesso completo ao terminal de frente de caixa e à central gerencial.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          {/* Card Balcão & Caixa */}
          <Link
            href="/balcao"
            className="group flex flex-col justify-between p-8 rounded-3xl bg-white border border-lamarka-200/90 hover:border-lamarka-400 shadow-card hover:shadow-luxury-lg transition-all"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-800 group-hover:text-white transition-all mb-5 shadow-2xs">
                <ShoppingBag className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif font-medium text-lamarka-900 mb-2 group-hover:text-lamarka-800 transition-colors">
                Balcão & Caixa
              </h2>
              <p className="text-xs sm:text-sm text-lamarka-600 font-light leading-relaxed mb-6">
                Lançamento rápido de compras no balcão em 10 segundos, consulta de saldo, resgate e envio de WhatsApp com 1 clique.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-lamarka-800 group-hover:text-lamarka-900 pt-4 border-t border-lamarka-100">
              <span>Abrir Balcão de Vendas</span>
              <ArrowRight className="w-4 h-4 text-[#DFB76C] transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </div>
          </Link>

          {/* Card Painel de Gestão */}
          <Link
            href="/admin/dashboard"
            className="group flex flex-col justify-between p-8 rounded-3xl bg-white border border-lamarka-200/90 hover:border-lamarka-400 shadow-card hover:shadow-luxury-lg transition-all"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-800 group-hover:text-white transition-all mb-5 shadow-2xs">
                <ShieldCheck className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif font-medium text-lamarka-900 mb-2 group-hover:text-lamarka-800 transition-colors">
                Painel de Gestão
              </h2>
              <p className="text-xs sm:text-sm text-lamarka-600 font-light leading-relaxed mb-6">
                Indicadores de recompra, base de clientes, equipe de vendedoras, campanhas sazonais, aniversariantes e conciliação.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-lamarka-800 group-hover:text-lamarka-900 pt-4 border-t border-lamarka-100">
              <span>Abrir Central Gerencial</span>
              <ArrowRight className="w-4 h-4 text-[#DFB76C] transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-4xl mx-auto text-center z-10 pt-4">
        <p className="text-[11px] text-lamarka-400 font-light">
          La Marka Moda Feminina &copy; {new Date().getFullYear()} • Plataforma Privada
        </p>
      </div>
    </div>
  );
}
