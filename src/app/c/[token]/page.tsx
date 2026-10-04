import React from 'react';
import { notFound } from 'next/navigation';
import { getCustomerWalletByToken } from '@/lib/customer-service';
import { WalletHeader } from '@/components/carteira/WalletHeader';
import { BalanceCard } from '@/components/carteira/BalanceCard';
import { TransactionHistory } from '@/components/carteira/TransactionHistory';
import { Sparkles, Store, MapPin, MessageCircle } from 'lucide-react';

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
        <div className="w-full max-w-sm bg-white rounded-3xl border border-lamarka-200 p-8 shadow-card flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-lamarka-100 text-lamarka-700 flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-serif font-bold text-lamarka-900">
            Carteira Não Localizada
          </h1>
          <p className="text-xs text-lamarka-600 font-light leading-relaxed">
            Este link de acesso pode estar desatualizado ou a cliente ainda não foi cadastrada no La Marka Club.
          </p>
          <div className="w-full pt-4 border-t border-lamarka-100 flex flex-col gap-2.5">
            <a
              href="https://wa.me/5549999266069?text=Ol%C3%A1%2C%20gostaria%20de%20consultar%20meu%20saldo%20do%20La%20Marka%20Club"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Falar no WhatsApp da Loja</span>
            </a>
            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-lamarka-100 hover:bg-lamarka-200 text-lamarka-800 text-xs font-semibold transition-colors text-center"
            >
              Conhecer a La Marka
            </a>
          </div>
        </div>
      </main>
    );
  }

  const { customer, balanceInfo, transactions } = walletData;

  return (
    <main className="min-h-screen bg-gradient-to-b from-lamarka-100/70 via-lamarka-50 to-white flex flex-col items-center pb-16 px-4 sm:px-6">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Cabeçalho */}
        <WalletHeader
          firstName={customer.firstName}
          maskedPhone={customer.maskedPhone}
        />

        {/* Card de Saldo VIP em Destaque */}
        <BalanceCard balanceInfo={balanceInfo} />

        {/* Informações da Loja & Como Usar */}
        <div className="w-full mt-3 bg-white/80 backdrop-blur-md border border-lamarka-200/80 rounded-3xl p-4.5 text-xs text-lamarka-700 flex items-start gap-3.5 shadow-card">
          <div className="w-8 h-8 rounded-xl bg-lamarka-100 flex items-center justify-center shrink-0 text-lamarka-700">
            <Store className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <p className="leading-relaxed font-light text-lamarka-800 pt-0.5">
            Seu cashback é um benefício exclusivo da <strong className="font-semibold text-lamarka-900">La Marka</strong>. Basta informar seu telefone no balcão da loja para abater seu saldo direto na sua próxima compra!
          </p>
        </div>

        {/* Extrato Transparente */}
        <TransactionHistory transactions={transactions} />

        {/* Rodapé da Carteira */}
        <footer className="mt-10 text-center text-[11px] text-lamarka-500 font-light flex items-center justify-center gap-1.5 tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
          La Marka Club • Moda Feminina
        </footer>
      </div>
    </main>
  );
}
