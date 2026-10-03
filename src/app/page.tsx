import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden bg-gradient-to-b from-lamarka-100/60 via-lamarka-50 to-white">
      {/* Background geometric triangles watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[40px] border-lamarka-800 rotate-45 transform"></div>
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center text-center z-10 pt-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 relative mb-6 rounded-3xl overflow-hidden shadow-sm border border-lamarka-200">
          <Image
            src="/logo.png"
            alt="La Marka Moda Feminina"
            fill
            className="object-cover"
            priority
          />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-lamarka-200/80 text-lamarka-800 tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-lamarka-600" /> Clube de Recompensas Exclusivo
        </span>

        <h1 className="text-3xl sm:text-5xl font-serif text-lamarka-900 tracking-tight mb-4">
          La Marka Club
        </h1>
        <p className="text-base sm:text-lg text-lamarka-700 max-w-xl font-light leading-relaxed mb-10">
          Sua carteira digital de cashback em reais. Toda compra gera créditos imediatos para tornar o seu relacionamento com a La Marka ainda mais especial.
        </p>

        {/* Portal Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          <Link
            href="/balcao"
            className="group flex flex-col items-start p-6 rounded-2xl bg-white border border-lamarka-200/80 hover:border-lamarka-400 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-500 group-hover:text-white transition-colors mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-lamarka-900 mb-1 group-hover:text-lamarka-800">
              Terminal de Balcão & Caixa
            </h2>
            <p className="text-sm text-lamarka-700 font-light">
              Lançamento rápido de compras em 10 segundos, consulta de saldo e envio de WhatsApp com 1 clique.
            </p>
          </Link>

          <Link
            href="/admin"
            className="group flex flex-col items-start p-6 rounded-2xl bg-white border border-lamarka-200/80 hover:border-lamarka-400 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-500 group-hover:text-white transition-colors mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-lamarka-900 mb-1 group-hover:text-lamarka-800">
              Painel de Gestão
            </h2>
            <p className="text-sm text-lamarka-700 font-light">
              Métricas de retorno, campanhas promocionais, bônus de aniversário, conciliação de cupons e configurações.
            </p>
          </Link>
        </div>
      </div>

      <footer className="w-full text-center py-6 text-xs text-lamarka-600 font-light flex items-center justify-center gap-2 z-10">
        <HeartHandshake className="w-4 h-4 text-lamarka-500" />
        La Marka • Moda Feminina • Feito com carinho para nossas clientes
      </footer>
    </main>
  );
}
