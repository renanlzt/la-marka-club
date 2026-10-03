'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CustomerSearch } from '@/components/balcao/CustomerSearch';
import { QuickRegisterModal } from '@/components/balcao/QuickRegisterModal';
import { SaleForm } from '@/components/balcao/SaleForm';
import { RewardSuccessModal } from '@/components/balcao/RewardSuccessModal';
import { CounterCustomerSummary, CounterSaleResult } from '@/lib/counter-service';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function BalcaoPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<CounterCustomerSummary | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [saleResult, setSaleResult] = useState<CounterSaleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-lamarka-50 text-lamarka-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-lamarka-200/90 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-lamarka-500 hover:text-lamarka-800 hover:bg-lamarka-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-lamarka-200 shrink-0">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-lamarka-900 leading-tight">
              La Marka Club • Balcão
            </h1>
            <span className="text-[11px] text-lamarka-600 font-light flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-lamarka-500" /> Atendimento de Caixa
            </span>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lamarka-200 text-xs text-lamarka-700 hover:bg-lamarka-100 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-lamarka-600" />
          Painel de Gestão
        </Link>
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
