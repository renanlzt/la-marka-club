import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ShoppingBag,
  Gift,
  Smartphone,
  CheckCircle2,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-lamarka-100/60 via-lamarka-50 to-white text-lamarka-900 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <div className="w-[900px] h-[900px] border-[50px] border-lamarka-800 rotate-45 transform"></div>
      </div>

      {/* Top Navbar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 relative rounded-2xl overflow-hidden border border-lamarka-200 shadow-2xs bg-white shrink-0">
            <Image src="/logo.png" alt="La Marka" fill className="object-cover" priority />
          </div>
          <div>
            <span className="font-serif font-semibold text-lg text-lamarka-900 leading-tight block">
              La Marka
            </span>
            <span className="text-[10px] text-lamarka-500 font-semibold uppercase tracking-[0.2em] block">
              Privilège Club
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-lamarka-200 text-lamarka-700 hover:text-lamarka-900 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>@lamarka</span>
          </a>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Atendimento Loja</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-10 sm:py-16 text-center z-10 flex flex-col items-center">
        <div className="w-28 h-28 sm:w-36 sm:h-36 relative mb-6 rounded-3xl overflow-hidden shadow-luxury border-2 border-white ring-1 ring-lamarka-300 bg-white">
          <Image src="/logo.png" alt="La Marka Moda Feminina" fill className="object-cover" priority />
        </div>

        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/95 border border-lamarka-300 text-lamarka-800 text-[11px] font-semibold tracking-[0.2em] uppercase mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
          Clube de Fidelidade & Recompensas VIP
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-medium text-lamarka-900 tracking-tight leading-tight mb-4 max-w-2xl">
          Seu bom gosto recompensado a cada compra.
        </h1>

        <p className="text-sm sm:text-base text-lamarka-600 max-w-xl font-light leading-relaxed mb-10">
          O <strong>La Marka Club</strong> transforma suas escolhas de moda em créditos imediatos em dinheiro real. Toda compra acumula saldo para você renovar seu closet sempre com novidades exclusivas.
        </p>

        {/* 4 Pilares / Benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left mb-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-lamarka-200/90 shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 mb-4 shadow-2xs">
                <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif font-semibold text-lg text-lamarka-900 mb-1.5">
                Cashback em Reais
              </h2>
              <p className="text-xs text-lamarka-600 font-light leading-relaxed">
                Ganhe até 5% do valor da sua compra em créditos reais para abater nos seus próximos looks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-lamarka-100 text-[11px] font-semibold text-lamarka-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sem pontuação confusa
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-lamarka-200/90 shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 mb-4 shadow-2xs">
                <Gift className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif font-semibold text-lg text-lamarka-900 mb-1.5">
                Presente de Aniversário
              </h2>
              <p className="text-xs text-lamarka-600 font-light leading-relaxed">
                No mês do seu aniversário, você recebe um bônus especial de presente para comemorar seu dia linda.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-lamarka-100 text-[11px] font-semibold text-lamarka-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bônus exclusivo
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-lamarka-200/90 shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 mb-4 shadow-2xs">
                <Smartphone className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif font-semibold text-lg text-lamarka-900 mb-1.5">
                100% no seu WhatsApp
              </h2>
              <p className="text-xs text-lamarka-600 font-light leading-relaxed">
                Sem senhas ou aplicativos pesados. Seu extrato e cartão virtual chegam direto no seu WhatsApp.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-lamarka-100 text-[11px] font-semibold text-lamarka-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Acesso instantâneo
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-lamarka-200/90 shadow-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lamarka-100 flex items-center justify-center text-lamarka-800 mb-4 shadow-2xs">
                <Sparkles className="w-6 h-6 text-[#DFB76C]" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif font-semibold text-lg text-lamarka-900 mb-1.5">
                Resgate Fácil no Caixa
              </h2>
              <p className="text-xs text-lamarka-600 font-light leading-relaxed">
                Ao finalizar sua compra na loja física, informe seu telefone e resgate seu saldo na hora.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-lamarka-100 text-[11px] font-semibold text-lamarka-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Desconto imediato
            </div>
          </div>
        </div>

        {/* Como funciona / Chamada */}
        <div className="bg-lamarka-800 text-white rounded-3xl p-8 sm:p-10 shadow-luxury max-w-2xl w-full flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div>
            <span className="text-[10px] text-[#DFB76C] font-semibold uppercase tracking-[0.2em] block mb-1">
              Faça Parte do Clube
            </span>
            <h2 className="text-2xl font-serif font-medium text-white mb-2">
              Visite nossa loja e cadastre-se!
            </h2>
            <p className="text-xs text-lamarka-200 font-light leading-relaxed max-w-md">
              O cadastro é 100% gratuito e realizado na sua primeira compra na loja física. Nossas consultoras estão prontas para te receber com muito carinho.
            </p>
          </div>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-3 rounded-2xl bg-[#DFB76C] hover:bg-[#d4a856] text-lamarka-900 text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-lamarka-900" />
            <span>Falar com Consultora</span>
          </a>
        </div>
      </section>

      {/* Footer com link discreto para equipe */}
      <footer className="w-full border-t border-lamarka-200/80 bg-white/60 py-6 px-6 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-lamarka-500 font-light">
            La Marka Moda Feminina &copy; {new Date().getFullYear()} • Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4 text-xs text-lamarka-500">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-lamarka-400 hover:text-lamarka-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-lamarka-100 text-[11px]"
              title="Acesso restrito da equipe de vendas e gestão"
            >
              <Lock className="w-3 h-3 text-lamarka-400" />
              <span>Acesso da Equipe</span>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
