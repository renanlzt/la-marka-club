import React from 'react';
import { notFound } from 'next/navigation';
import { getCustomerWalletByToken } from '@/lib/customer-service';
import { WalletHeader } from '@/components/carteira/WalletHeader';
import { BalanceCard } from '@/components/carteira/BalanceCard';
import { TransactionHistory } from '@/components/carteira/TransactionHistory';
import { Sparkles, Store, MapPin } from 'lucide-react';

interface CustomerWalletPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function CustomerWalletPage({
  params,
}: CustomerWalletPageProps) {
  const { token } = await params;
  const walletData = await getCustomerWalletByToken(token);

  if (!walletData) {
    notFound();
  }

  const { customer, balanceInfo, transactions } = walletData;

  return (
    <main className="min-h-screen bg-gradient-to-b from-lamarka-100/50 via-lamarka-50 to-white flex flex-col items-center pb-12 px-4 sm:px-6">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Cabeçalho */}
        <WalletHeader
          firstName={customer.firstName}
          maskedPhone={customer.maskedPhone}
        />

        {/* Card de Saldo em Destaque */}
        <BalanceCard balanceInfo={balanceInfo} />

        {/* Informações da Loja & Como Usar */}
        <div className="w-full mt-4 bg-white/70 backdrop-blur-sm border border-lamarka-200/70 rounded-2xl p-4 text-xs text-lamarka-700 flex items-start gap-3">
          <Store className="w-4 h-4 text-lamarka-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Seu cashback é um benefício exclusivo da <strong>La Marka</strong>. Basta informar seu telefone no caixa para utilizar seu saldo em sua próxima compra!
          </p>
        </div>

        {/* Extrato Transparente */}
        <TransactionHistory transactions={transactions} />

        {/* Rodapé da Carteira */}
        <footer className="mt-8 text-center text-[11px] text-lamarka-500 font-light flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-lamarka-400" />
          La Marka Club • Moda Feminina
        </footer>
      </div>
    </main>
  );
}
