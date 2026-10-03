'use client';

import React, { useState } from 'react';
import { Lock, User, Key, Check, AlertCircle, Shield } from 'lucide-react';

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError('Informe a sua senha atual para autorizar a alteração.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não conferem.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (!newUsername.trim() && !newPassword) {
      setError('Informe um novo usuário ou uma nova senha para atualizar.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername.trim() || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setNewUsername('');
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.error || 'Erro ao alterar credenciais.');
      }
    } catch (err: any) {
      setError('Falha de conexão ao tentar alterar credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-lamarka-100">
        <Shield className="w-5 h-5 text-lamarka-700" />
        <h2 className="text-base font-serif font-bold text-lamarka-900">
          Acesso & Segurança do Painel de Gestão
        </h2>
      </div>

      <p className="text-xs text-lamarka-600 font-light mb-5">
        Altere o usuário e a senha de acesso administrativo. O acesso inicial padrão é <strong className="font-semibold text-lamarka-900">admin / admin</strong>.
      </p>

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Credenciais alteradas com sucesso! Use os novos dados no próximo login.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Senha Atual *
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite a senha atual"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 text-xs sm:text-sm text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Novo Usuário (opcional)
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Ex: dieizy ou novo_login"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 text-xs sm:text-sm text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Nova Senha (opcional)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha segura"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 text-xs sm:text-sm text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-lamarka-800 block mb-1">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lamarka-200 text-xs sm:text-sm text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-2 focus:ring-lamarka-200"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Atualizar Credenciais de Acesso'}
          </button>
        </div>
      </form>
    </div>
  );
}
