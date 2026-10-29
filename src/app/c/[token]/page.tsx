import React from 'react';
import { getCustomerWalletByToken } from '@/lib/customer-service';
import { WalletHeader } from '@/components/carteira/WalletHeader';
import { BalanceCard } from '@/components/carteira/BalanceCard';
import { VipProgressCard } from '@/components/carteira/VipProgressCard';
import { TransactionHistory } from '@/components/carteira/TransactionHistory';
import { Sparkles, Store, MessageCircle, Flame } from 'lucide-react';

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
          </div>
        </div>
      </main>
    );
  }

  const { customer, balanceInfo, vipTier, activeCampaign, transactions } = walletData;

  // Total acumulado histórico a partir das transações ativas
  const totalAccumulated = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Cálculo explícito e transparente da taxa de cashback com campanha ativa
  const basePercentage = vipTier?.percentage ?? 0.5;
  const tierLabel = vipTier?.label ?? 'Membro Bronze';

  let effectiveRate = basePercentage;
  let campaignExplanation = '';

  if (activeCampaign) {
    if (activeCampaign.type === 'PERCENTAGE_OVERRIDE') {
      effectiveRate = activeCampaign.value;
      campaignExplanation = `Taxa promocional fixa especial para todas as compras (taxa normal: ${basePercentage}%).`;
    } else if (activeCampaign.type === 'MULTIPLIER') {
      effectiveRate = Number((basePercentage * activeCampaign.value).toFixed(2));
      campaignExplanation = `Seu benefício ${tierLabel} (${basePercentage}%) multiplicado por ${activeCampaign.value}x!`;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-lamarka-100/70 via-lamarka-50 to-white flex flex-col items-center pb-16 px-4 sm:px-6">
      <div className="w-full max-w-md flex flex-col items-center gap-3.5">
        {/* Cabeçalho */}
        <WalletHeader
          firstName={customer.firstName}
          maskedPhone={customer.maskedPhone}
        />

        {/* Card de Saldo VIP Matte em Destaque */}
        <BalanceCard
          balanceInfo={balanceInfo}
          customerName={customer.firstName}
          vipTier={vipTier}
        />

        {/* Destaque Cristalino da Campanha Promocional Ativa */}
        {activeCampaign && (
          <div className="w-full bg-gradient-to-br from-amber-500/10 via-[#FAF4EA] to-amber-500/15 border-2 border-[#DFB76C] rounded-3xl p-5 shadow-card transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFB76C] text-[#241110] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-900" />
                Campanha Ativa na Loja
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                {activeCampaign.type === 'PERCENTAGE_OVERRIDE'
                  ? `${activeCampaign.value}% Fixo`
                  : `${activeCampaign.value}x Bônus`}
              </span>
            </div>

            <h3 className="text-base font-serif font-bold text-lamarka-900 leading-tight">
              {activeCampaign.name}
            </h3>

            {activeCampaign.description && (
              <p className="text-xs text-lamarka-700 font-light mt-1">
                {activeCampaign.description}
              </p>
            )}

            <div className="mt-3.5 pt-3 border-t border-[#DFB76C]/30 flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-lamarka-600 font-light">Seu retorno na próxima compra:</span>
                <span className="text-sm font-bold text-emerald-800 font-serif">
                  {effectiveRate}% de volta
                </span>
              </div>
              <p className="text-[11px] text-[#8C6219] font-medium leading-snug">
                {campaignExplanation}
              </p>
              <span className="text-[10px] text-lamarka-500 font-light mt-0.5">
                Válido até {new Intl.DateTimeFormat('pt-BR').format(new Date(activeCampaign.endsAt))} nas compras presenciais na boutique.
              </span>
            </div>
          </div>
        )}

        {/* Barra de Progresso VIP do Clube (Bronze -> Prata -> Ouro -> Diamante) */}
        <VipProgressCard
          availableBalance={balanceInfo.availableBalance}
          totalAccumulated={totalAccumulated}
          vipTier={vipTier}
        />

        {/* Extrato Transparente no estilo Cartão Privilège */}
        <TransactionHistory transactions={transactions} />

        {/* Rodapé da Carteira */}
        <footer className="mt-8 text-center text-[11px] text-lamarka-500 font-light flex items-center justify-center gap-1.5 tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
          La Marka Club • Privilège
        </footer>
      </div>
    </main>
  );
}
