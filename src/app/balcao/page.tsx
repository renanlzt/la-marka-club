'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerSearch } from '@/components/balcao/CustomerSearch';
import { QuickRegisterModal } from '@/components/balcao/QuickRegisterModal';
import { SaleForm } from '@/components/balcao/SaleForm';
import { RewardSuccessModal } from '@/components/balcao/RewardSuccessModal';
import { CounterCustomerSummary, CounterSaleResult } from '@/lib/counter-service';
import { ArrowLeft, ShieldCheck, Sparkles, LogOut, LayoutGrid } from 'lucide-react';

export default function BalcaoPage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<CounterCustomerSummary | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [saleResult, setSaleResult] = useState<CounterSaleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const handleSaleComplete = (result: CounterSaleResult) => {
    setSaleResult(result);
    // Atualiza saldo da cliente atual se continuar na mesma tela
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        balanceInfo: result.balanceInfo,
      });
    }
  };

  const handleCloseSuccess = () => {
    setSaleResult(null);
    setSelectedCustomer(null); // Limpa para a próxima cliente da fila
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lamarka-100/40 via-lamarka-50 to-white text-lamarka-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-lamarka-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-card">
        <div className="flex items-center gap-3.5">
          {currentUser?.role === 'GESTAO' && (
            <Link
              href="/portal"
              title="Voltar ao portal de seleção"
              className="p-2 rounded-xl text-lamarka-500 hover:text-lamarka-900 hover:bg-lamarka-100 transition-colors"
            >
              <LayoutGrid className="w-5 h-5 text-lamarka-600" strokeWidth={1.5} />
            </Link>
          )}
          <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-lamarka-200 shrink-0 shadow-2xs">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-serif font-medium text-lamarka-900 leading-tight">
              La Marka Club • Balcão
            </h1>
            <span className="text-[11px] text-lamarka-600 font-light flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Frente de Caixa & Fidelização
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Apenas usuários com perfil GESTAO enxergam o botão do Painel de Gestão */}
          {currentUser?.role === 'GESTAO' && (
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-lamarka-200 bg-white hover:bg-lamarka-50 text-xs font-medium text-lamarka-800 transition-all shadow-2xs hover:shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-lamarka-700" strokeWidth={1.5} />
              <span>Painel de Gestão</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Encerrar sessão do caixa"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-lamarka-200 bg-white hover:bg-lamarka-50 text-xs font-medium text-lamarka-600 hover:text-lamarka-900 transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-lamarka-500" strokeWidth={1.5} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6 justify-center">
        {!selectedCustomer ? (
          <CustomerSearch
            onSelectCustomer={(c) => setSelectedCustomer(c)}
            onOpenQuickRegister={() => setIsRegisterOpen(true)}
            isLoading={isLoading}
          />
        ) : (
          <SaleForm
            customer={selectedCustomer}
            onClearCustomer={() => setSelectedCustomer(null)}
            onSaleComplete={handleSaleComplete}
          />
        )}
      </main>

      {/* Modal de Cadastro Rápido */}
      <QuickRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(c) => {
          setSelectedCustomer(c);
          setIsRegisterOpen(false);
        }}
      />

      {/* Modal de Sucesso com Disparo de WhatsApp */}
      <RewardSuccessModal
        saleResult={saleResult}
        onClose={handleCloseSuccess}
      />
    </div>
  );
}
