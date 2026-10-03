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
    return (
      <main className="min-h-screen bg-gradient-to-b from-lamarka-100/50 via-lamarka-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-lamarka-200 p-8 shadow-sm flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-lamarka-100 text-lamarka-700 flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-serif font-bold text-lamarka-900">
            Carteira Não Localizada
          </h1>
          <p className="text-xs text-lamarka-600 font-light leading-relaxed">
            Este link de acesso pode estar incompleto ou a cliente ainda não foi cadastrada no La Marka Club.
          </p>
          <div className="w-full pt-4 border-t border-lamarka-100 flex flex-col gap-2">
            <a
              href="/balcao"
              className="w-full py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-colors"
            >
              Ir para o Caixa / Balcão
            </a>
            <a
              href="/admin/clientes"
              className="w-full py-2.5 rounded-xl bg-lamarka-100 hover:bg-lamarka-200 text-lamarka-800 text-xs font-semibold transition-colors"
            >
              Consultar Clientes no Admin
            </a>
          </div>
        </div>
      </main>
    );
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
