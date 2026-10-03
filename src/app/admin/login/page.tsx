'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, Store } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get('from') || '/admin/dashboard';

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
        router.push(from);
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
              className="object-cover"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-lamarka-200 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" /> La Marka Club
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Painel de Gestão
          </h1>
          <p className="text-xs text-lamarka-600 font-light mt-1">
            Acesso Restrito Administrativo
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-3xl border border-lamarka-200/90 p-7 sm:p-8 shadow-luxury-lg">
          {/* Dica de Acesso Inicial */}
          <div className="mb-5 p-4 rounded-2xl bg-lamarka-50/80 border border-lamarka-200/80 text-xs text-lamarka-800 flex items-start gap-3 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#DFB76C] shrink-0 mt-0.5" />
            <div className="leading-relaxed font-light">
              <span className="font-semibold block text-lamarka-900">Acesso Padrão:</span>
              Usuário: <code className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-lamarka-200">admin</code> • Senha: <code className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-lamarka-200">admin</code>
              <p className="text-[11px] text-lamarka-500 mt-1">
                Você pode trocar o usuário e a senha nas Configurações a qualquer momento.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
                Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-lamarka-200 focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400 shadow-2xs"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-lamarka-800 block mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-lamarka-200 focus:outline-none focus:border-lamarka-600 focus:ring-2 focus:ring-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lamarka-400 hover:text-lamarka-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-semibold text-sm transition-all shadow-luxury hover:shadow-luxury-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link para Frente de Caixa */}
        <div className="mt-6 text-center">
          <a
            href="/balcao"
            className="inline-flex items-center gap-1.5 text-xs text-lamarka-600 hover:text-lamarka-900 font-light hover:underline transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-lamarka-500" strokeWidth={1.5} />
            Ir para Frente de Caixa (Balcão da Loja)
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-lamarka-50 flex items-center justify-center text-xs text-lamarka-500 font-light">
          Carregando acesso ao painel...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
