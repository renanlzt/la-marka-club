'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Phone,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function ConsultaCarteiraPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCustomerName, setSuccessCustomerName] = useState<string | null>(null);

  // Formatação automática do telefone (49) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;

    if (raw.length <= 2) {
      formatted = raw ? `(${raw}` : '';
    } else if (raw.length <= 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    } else if (raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    } else {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    }

    setPhone(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  // Verificação de preenchimento dos critérios (mínimo 2 campos)
  const criteriaStatus = useMemo(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = name.trim();
    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);

    const hasPhone = cleanPhone.length >= 8;
    const hasName = cleanName.length >= 2;
    const hasBirthday = !isNaN(day) && day >= 1 && day <= 31 && !isNaN(month) && month >= 1 && month <= 12;

    const count = (hasPhone ? 1 : 0) + (hasName ? 1 : 0) + (hasBirthday ? 1 : 0);

    return {
      hasPhone,
      hasName,
      hasBirthday,
      count,
      isSufficient: count >= 2,
    };
  }, [phone, name, birthDay, birthMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!criteriaStatus.isSufficient) {
      setErrorMessage(
        'Por favor, preencha pelo menos 2 campos (ex: Telefone e Aniversário, ou Nome e Telefone) para localizar sua carteira com segurança.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || undefined,
          name: name.trim() || undefined,
          birthDay: birthDay ? parseInt(birthDay, 10) : undefined,
          birthMonth: birthMonth ? parseInt(birthMonth, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Não foi possível localizar sua carteira.');
        return;
      }

      setSuccessCustomerName(data.customerName || 'Cliente');

      // Redireciona para a carteira da cliente após feedback positivo
      setTimeout(() => {
        router.push(data.redirectUrl || `/c/${data.magicToken}`);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        'Ocorreu uma falha na consulta. Por favor, verifique sua conexão ou tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-lamarka-100/70 via-lamarka-50 to-white flex flex-col items-center justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[40px] border-lamarka-800 rotate-45 transform" />
      </div>

      {/* Top Navbar Minimalista */}
      <div className="w-full max-w-md flex items-center justify-between z-10 mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-lamarka-600 hover:text-lamarka-900 transition-colors py-1.5 px-3 rounded-xl hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao início</span>
        </Link>

        <a
          href="https://wa.me/5549999266069"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-medium py-1.5 px-3 rounded-xl hover:bg-white/80"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Ajuda no</span> WhatsApp
        </a>
      </div>

      {/* Card Principal de Consulta */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-lamarka-200/90 shadow-card z-10 flex flex-col my-auto animate-in fade-in duration-300">
        {/* Identidade La Marka */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 relative rounded-2xl overflow-hidden border border-lamarka-200 shadow-2xs bg-white mb-3 p-1.5">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DFB76C]/15 border border-[#DFB76C]/30 text-lamarka-900 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" />
            La Marka Privilège Club
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-lamarka-900 tracking-tight">
            Consultar Carteira
          </h1>

          <p className="text-xs text-lamarka-600 font-light mt-1.5 max-w-xs leading-relaxed">
            Consulte seu saldo de cashback e benefícios. Preencha pelo menos{' '}
            <strong className="font-semibold text-lamarka-800">2 dos campos abaixo</strong>:
          </p>
        </div>

        {/* Indicador de Status dos Critérios Preenchidos */}
        <div
          className={`p-3 rounded-2xl mb-5 border transition-all text-xs flex items-center justify-between ${
            criteriaStatus.isSufficient
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {criteriaStatus.isSufficient ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium text-[11px] sm:text-xs">
              {criteriaStatus.isSufficient
                ? 'Identificação validada! Pronto para consultar.'
                : `Preenchidos ${criteriaStatus.count} de 2 campos mínimos requeridos.`}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              criteriaStatus.isSufficient
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {criteriaStatus.count}/3
          </span>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo 1: Telefone Celular */}
          <div>
            <label className="block text-xs font-semibold text-lamarka-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-lamarka-600" /> Telefone Celular
              </span>
              <span className="text-[10px] font-normal text-lamarka-400">
                {criteriaStatus.hasPhone ? '✓ Preenchido' : 'Opcional se preencher os outros'}
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(49) 99999-9999"
              className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400 focus:outline-none focus:ring-2 focus:ring-lamarka-400 bg-white"
            />
          </div>

          {/* Campo 2: Data de Aniversário (Dia e Mês) */}
          <div>
            <label className="block text-xs font-semibold text-lamarka-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-lamarka-600" /> Data de Aniversário
              </span>
              <span className="text-[10px] font-normal text-lamarka-400">
                {criteriaStatus.hasBirthday ? '✓ Preenchido' : 'Dia e Mês'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Dia */}
              <select
                value={birthDay}
                onChange={(e) => {
                  setBirthDay(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-lamarka-200 text-xs text-lamarka-900 bg-white focus:outline-none focus:ring-2 focus:ring-lamarka-400"
              >
                <option value="">Dia...</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>

              {/* Mês */}
              <select
                value={birthMonth}
                onChange={(e) => {
                  setBirthMonth(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-lamarka-200 text-xs text-lamarka-900 bg-white focus:outline-none focus:ring-2 focus:ring-lamarka-400"
              >
                <option value="">Mês...</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo 3: Nome da Cliente (Permite Parcial) */}
          <div>
            <label className="block text-xs font-semibold text-lamarka-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-lamarka-600" /> Seu Nome
              </span>
              <span className="text-[10px] font-normal text-lamarka-400">
                {criteriaStatus.hasName ? '✓ Preenchido' : 'Primeiro nome ou completo'}
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ex: Isabela ou Isabela Fontes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400 focus:outline-none focus:ring-2 focus:ring-lamarka-400 bg-white"
            />
          </div>

          {/* Mensagem de Erro Amigável */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span>{errorMessage}</span>
                <a
                  href="https://wa.me/5549999266069?text=Ol%C3%A1!%20Estou%20tentando%20consultar%20minha%20carteira%20na%20La%20Marka%20e%20preciso%20de%20ajuda."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-900 underline hover:text-rose-950 mt-0.5"
                >
                  <MessageCircle className="w-3 h-3" /> Falar com uma consultora no WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Mensagem de Sucesso & Redirecionamento */}
          {successCustomerName && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Carteira localizada para <strong>{successCustomerName}</strong>! Abrindo...
              </span>
            </div>
          )}

          {/* Botão de Consulta */}
          <button
            type="submit"
            disabled={loading || !criteriaStatus.isSufficient}
            className={`w-full mt-2 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-luxury transition-all cursor-pointer ${
              criteriaStatus.isSufficient && !loading
                ? 'bg-lamarka-800 hover:bg-lamarka-900 text-white'
                : 'bg-lamarka-200 text-lamarka-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Localizando sua carteira...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 text-[#DFB76C]" />
                <span>Acessar Minha Carteira</span>
                <ArrowRight className="w-3.5 h-3.5 text-lamarka-300" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé Informativo */}
        <div className="mt-6 pt-4 border-t border-lamarka-100 text-center">
          <p className="text-[11px] text-lamarka-500 font-light">
            Seus dados são protegidos e utilizados exclusivamente para consulta do seu benefício de cashback La Marka.
          </p>
        </div>
      </div>

      {/* Footer Discreto */}
      <footer className="text-center text-xs text-lamarka-500 font-light z-10 mt-6">
        La Marka Moda Feminina &copy; {new Date().getFullYear()} • Concórdia - SC
      </footer>
    </main>
  );
}
