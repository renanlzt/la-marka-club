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
          <div className="w-16 h-16 relative rounded-2xl overflow-hidden border border-lamarka-200 shadow-sm mb-3">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-lamarka-900">
            Painel de Gestão
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            La Marka Club • Acesso Administrativo
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-3xl border border-lamarka-200 p-6 sm:p-8 shadow-md">
          {/* Dica de Acesso Inicial */}
          <div className="mb-5 p-3.5 rounded-2xl bg-lamarka-50 border border-lamarka-200/80 text-xs text-lamarka-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-lamarka-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-light">
              <span className="font-semibold block text-lamarka-900">Acesso Padrão:</span>
              Usuário: <code className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-lamarka-200">admin</code> • Senha: <code className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-lamarka-200">admin</code>
              <p className="text-[11px] text-lamarka-500 mt-1">
                Você pode trocar o usuário e a senha nas Configurações a qualquer momento.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-lamarka-800 block mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-lamarka-200 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200 text-sm text-lamarka-900 placeholder:text-lamarka-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lamarka-400 hover:text-lamarka-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
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
            <Store className="w-3.5 h-3.5 text-lamarka-500" />
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
