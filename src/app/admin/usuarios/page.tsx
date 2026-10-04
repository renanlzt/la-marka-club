'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Check,
  X,
  User,
  Crown,
  ShoppingBag,
  Pencil,
  Trash2,
  Lock,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface AdminUserItem {
  id: string;
  username: string;
  name: string;
  role: 'GESTAO' | 'BALCAO';
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'GESTAO' | 'BALCAO'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'BALCAO' as 'GESTAO' | 'BALCAO',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openNewModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'BALCAO',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUserItem) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: '',
      role: u.role,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        // Update
        const payload: any = {
          id: editingUser.id,
          name: formData.name,
          username: formData.username,
          role: formData.role,
        };
        if (formData.password.trim()) {
          payload.newPassword = formData.password.trim();
        }

        const res = await fetch('/api/admin/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar usuário.');
      } else {
        // Create
        const res = await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            password: formData.password,
            role: formData.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar usuário.');
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? O acesso será revogado imediatamente.')) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/usuarios?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário.');

      await fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir usuário.');
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const gestores = users.filter((u) => u.role === 'GESTAO').length;
    const balcao = users.filter((u) => u.role === 'BALCAO').length;
    return { total, gestores, balcao };
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, roleFilter, searchQuery]);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.18em] mb-2 border border-lamarka-300/50">
            <ShieldCheck className="w-3 h-3 text-[#DFB76C]" /> Controle de Acessos
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
            Equipe & Usuários do Sistema
          </h1>
          <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
            Cadastre colaboradoras e defina permissões: perfil <strong>Gestão</strong> acessa tudo, enquanto o perfil <strong>Balcão</strong> acessa somente o terminal de caixa.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-[#DFB76C]" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-lamarka-200/90 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lamarka-500 block mb-1">
            Total de Usuários
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-lamarka-900">
              {metrics.total}
            </span>
            <span className="text-xs text-lamarka-400">cadastrados</span>
          </div>
        </div>

        <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-200/70 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
              Perfil Gestão
            </span>
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-amber-950">
              {metrics.gestores}
            </span>
            <span className="text-xs text-amber-700/80">acesso total</span>
          </div>
        </div>

        <div className="bg-sky-50/50 rounded-3xl p-5 border border-sky-200/70 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-900">
              Perfil Balcão
            </span>
            <ShoppingBag className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-sky-950">
              {metrics.balcao}
            </span>
            <span className="text-xs text-sky-700/80">frente de caixa exclusiva</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou login..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900 placeholder:text-lamarka-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'ALL'
                ? 'bg-lamarka-800 text-white shadow-2xs'
                : 'bg-lamarka-100/70 text-lamarka-700 hover:bg-lamarka-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('GESTAO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'GESTAO'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            👑 Gestão ({metrics.gestores})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('BALCAO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'BALCAO'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 text-sky-800 border border-sky-200/60 hover:bg-sky-100'
            }`}
          >
            🛍️ Balcão ({metrics.balcao})
          </button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-lamarka-500 font-light">
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-lamarka-500 font-light">
            Nenhum usuário encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-lamarka-100">
            {filteredUsers.map((u) => {
              const isGestao = u.role === 'GESTAO';
              return (
                <div
                  key={u.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-lamarka-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border font-serif font-bold text-sm shadow-2xs ${
                        isGestao
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-sky-50 border-sky-200 text-sky-800'
                      }`}
                    >
                      {isGestao ? (
                        <Crown className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-sky-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-lamarka-900 truncate">
                          {u.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            isGestao
                              ? 'bg-amber-100/70 text-amber-900 border-amber-300/60'
                              : 'bg-sky-100/70 text-sky-900 border-sky-300/60'
                          }`}
                        >
                          {isGestao ? '👑 Gestão' : '🛍️ Balcão'}
                        </span>
                      </div>
                      <p className="text-xs text-lamarka-500 font-mono mt-0.5">
                        login: <strong>{u.username}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-[11px] text-lamarka-400 font-light mr-2 hidden md:inline">
                      Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </span>

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      title="Editar usuário e credenciais"
                      className="p-2 rounded-xl border border-lamarka-200 text-lamarka-600 hover:bg-lamarka-100 hover:text-lamarka-900 transition-colors shadow-2xs"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      title="Excluir usuário"
                      className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-lamarka-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-lamarka-100 flex items-center justify-between bg-lamarka-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#DFB76C]/15 border border-[#DFB76C]/30 flex items-center justify-center text-lamarka-800">
                  <KeyRound className="w-4 h-4 text-[#B89648]" />
                </div>
                <div>
                  <h3 className="font-serif font-medium text-lamarka-900 text-lg">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                  </h3>
                  <p className="text-xs text-lamarka-500">
                    {editingUser
                      ? 'Atualize as permissões ou redefina a senha'
                      : 'Cadastre uma colaboradora e defina o perfil de acesso'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-lamarka-400 hover:text-lamarka-700 p-1.5 rounded-lg hover:bg-lamarka-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  Nome da Colaboradora *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dieizy, Bruna, Atendimento Caixa 01"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  Nome de Usuário (Login) *
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: bruna, caixa01 (letras minúsculas, sem espaços)"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900 font-mono"
                />
              </div>

              {/* Seletor de Perfil (Cards) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-2">
                  Perfil de Acesso *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opção Balcão */}
                  <div
                    onClick={() => setFormData({ ...formData, role: 'BALCAO' })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      formData.role === 'BALCAO'
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-200'
                        : 'border-lamarka-200 hover:border-lamarka-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-xs text-sky-950 uppercase tracking-wider">
                          Balcão
                        </span>
                      </div>
                      {formData.role === 'BALCAO' && (
                        <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-lamarka-600 font-light leading-snug">
                      Acesso restrito ao Terminal de Caixa. Não tem acesso aos relatórios nem às configurações da loja.
                    </p>
                  </div>

                  {/* Opção Gestão */}
                  <div
                    onClick={() => setFormData({ ...formData, role: 'GESTAO' })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      formData.role === 'GESTAO'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-lamarka-200 hover:border-lamarka-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-xs text-amber-950 uppercase tracking-wider">
                          Gestão
                        </span>
                      </div>
                      {formData.role === 'GESTAO' && (
                        <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-lamarka-600 font-light leading-snug">
                      Acesso total. Painel financeiro, clientes, campanhas, aniversariantes, conciliação e também balcão.
                    </p>
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lamarka-700 mb-1.5">
                  {editingUser ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-lamarka-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Preencha apenas se quiser redefinir' : 'Mínimo de 4 caracteres'}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-lamarka-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB76C]/40 focus:border-[#DFB76C] text-lamarka-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-lamarka-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-lamarka-200 text-xs font-semibold text-lamarka-700 hover:bg-lamarka-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Salvar Alterações' : 'Criar Usuário'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
