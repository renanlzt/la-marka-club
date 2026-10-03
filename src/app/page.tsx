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
        <div className="w-48 h-48 sm:w-56 sm:h-56 relative mb-6 rounded-3xl overflow-hidden shadow-luxury border-2 border-white ring-1 ring-lamarka-300 bg-white transition-transform hover:scale-105 duration-500">
          <Image
            src="/logo.png"
            alt="La Marka Moda Feminina"
            fill
            className="object-cover"
            priority
          />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 border border-lamarka-200 text-lamarka-800 tracking-[0.2em] uppercase mb-3 shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Clube de Recompensas Exclusivo
        </span>

        <h1 className="text-4xl sm:text-6xl font-serif font-medium text-lamarka-900 tracking-tight mb-3">
          La Marka Club
        </h1>
        <p className="text-base sm:text-lg text-lamarka-700 max-w-xl font-light leading-relaxed mb-10">
          Sua carteira digital de cashback em reais. Toda compra gera créditos imediatos para tornar o seu relacionamento com a La Marka ainda mais especial.
        </p>

        {/* Portal Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          <Link
            href="/balcao"
            className="group flex flex-col items-start p-7 rounded-3xl bg-white border border-lamarka-200/90 hover:border-lamarka-400 shadow-card hover:shadow-luxury-lg transition-all text-left"
          >
            <div className="w-13 h-13 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-800 group-hover:text-white transition-all mb-4 shadow-2xs">
              <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-serif font-medium text-lamarka-900 mb-1.5 group-hover:text-lamarka-800 transition-colors">
              Terminal de Balcão & Caixa
            </h2>
            <p className="text-xs sm:text-sm text-lamarka-600 font-light leading-relaxed">
              Lançamento rápido de compras em 10 segundos, consulta de saldo e envio de WhatsApp com 1 clique.
            </p>
          </Link>

          <Link
            href="/admin"
            className="group flex flex-col items-start p-7 rounded-3xl bg-white border border-lamarka-200/90 hover:border-lamarka-400 shadow-card hover:shadow-luxury-lg transition-all text-left"
          >
            <div className="w-13 h-13 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 group-hover:bg-lamarka-800 group-hover:text-white transition-all mb-4 shadow-2xs">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-serif font-medium text-lamarka-900 mb-1.5 group-hover:text-lamarka-800 transition-colors">
              Painel de Gestão
            </h2>
            <p className="text-xs sm:text-sm text-lamarka-600 font-light leading-relaxed">
              Métricas de retorno, campanhas promocionais, bônus de aniversário, conciliação de cupons e configurações.
            </p>
          </Link>
        </div>
      </div>

      <footer className="w-full text-center py-8 text-xs text-lamarka-600 font-light flex items-center justify-center gap-2 z-10">
        <HeartHandshake className="w-4 h-4 text-lamarka-500" strokeWidth={1.5} />
        La Marka • Moda Feminina • Feito com carinho para nossas clientes
      </footer>
    </main>
  );
}
