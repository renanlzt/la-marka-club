'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get('from');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Preencha seu usuário e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userRole = data.user?.role || 'GESTAO';

        if (userRole === 'BALCAO') {
          // Usuário de Balcão vai direto para a tela de vendas
          router.push('/balcao');
        } else {
          // Usuário de Gestão: se veio de uma rota específica, vai para ela, senão para o portal de escolha
          if (from && !from.includes('/login')) {
            router.push(from);
          } else {
            router.push('/portal');
          }
        }
        router.refresh();
      } else {
        setError(data.error || 'Credenciais inválidas. Verifique seu usuário e senha.');
      }
    } catch (err: any) {
      setError('Erro de conexão ao tentar autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lamarka-100/60 via-lamarka-50 to-white flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-18 h-18 relative rounded-2xl overflow-hidden border-2 border-white ring-1 ring-lamarka-300 shadow-card mb-3.5 bg-white">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <ShieldCheck className="w-3 h-3 text-[#DFB76C]" /> Acesso da Equipe
          </span>

          <h1 className="text-3xl font-serif font-medium text-lamarka-900 tracking-tight">
            La Marka Club
          </h1>
          <p className="text-xs text-lamarka-600 font-light mt-1">
            Entre com suas credenciais para acessar o terminal de caixa ou o painel gerencial.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-card p-6 sm:p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Campo Usuário */}
            <div>
              <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider mb-1.5">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-[11px] font-semibold text-lamarka-700 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:ring-2 focus:ring-lamarka-400 text-xs sm:text-sm text-lamarka-900 placeholder:text-lamarka-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lamarka-400 hover:text-lamarka-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs sm:text-sm font-semibold shadow-luxury hover:shadow-luxury-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4 text-[#DFB76C]" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {/* Voltar para a Loja */}
          <div className="mt-5 pt-4 border-t border-lamarka-100 text-center">
            <Link
              href="/"
              className="text-xs text-lamarka-500 hover:text-lamarka-800 transition-colors inline-flex items-center gap-1 font-light"
            >
              ← Voltar para o início
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] text-lamarka-400 font-light mt-6">
          La Marka Moda Feminina &copy; {new Date().getFullYear()} • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-lamarka-50 text-xs text-lamarka-500">
          Carregando portal de acesso...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
