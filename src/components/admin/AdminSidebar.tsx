'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Gift,
  FileCheck2,
  Sliders,
  Settings,
  Store,
  Sparkles,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { href: '/admin/dashboard', label: 'Visão Geral & KPIs', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Clientes & Carteiras', icon: Users },
  { href: '/admin/vendedores', label: 'Equipe de Vendedoras', icon: UserCheck },
  { href: '/admin/campanhas', label: 'Campanhas Especiais', icon: Megaphone },
  { href: '/admin/aniversarios', label: 'Aniversariantes', icon: Gift },
  { href: '/admin/conciliacao', label: 'Conciliação de Cupons', icon: FileCheck2 },
  { href: '/admin/ajustes', label: 'Ajustes Manuais', icon: Sliders },
  { href: '/admin/configuracoes', label: 'Configurações & Mensagens', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/admin/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const activeItem = menuItems.find((item) => item.href === pathname);

  return (
    <>
      {/* Mobile Top Header (Visível apenas em telas menores que md) */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-lamarka-200/90 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 relative rounded-xl overflow-hidden border border-lamarka-200 shrink-0 shadow-2xs">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div>
            <span className="font-serif font-semibold text-sm text-lamarka-900 leading-tight block">
              La Marka Club
            </span>
            <span className="text-[10px] text-lamarka-500 font-light block leading-none">
              {activeItem?.label || 'Painel de Gestão'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl border border-lamarka-200 text-lamarka-700 hover:bg-lamarka-100 transition-colors shadow-2xs"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-lamarka-800" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5 text-lamarka-800" strokeWidth={1.5} />
          )}
        </button>
      </header>

      {/* Mobile Slide-down/Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl border-t border-lamarka-200 p-5 shadow-luxury-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-lamarka-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#DFB76C]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-lamarka-800">
                  Menu de Gestão
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-lamarka-400 hover:text-lamarka-700"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-lamarka-800 text-white shadow-xs'
                        : 'text-lamarka-700 hover:bg-lamarka-50 hover:text-lamarka-950'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 mt-3 border-t border-lamarka-100 flex flex-col gap-2">
              <Link
                href="/balcao"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-lamarka-50 hover:bg-lamarka-100/80 text-lamarka-800 text-xs font-semibold border border-lamarka-200/80 transition-colors shadow-2xs"
              >
                <Store className="w-4 h-4" strokeWidth={1.5} />
                Ir para Frente de Caixa
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Sair do Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar (md:flex) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-lamarka-200/90 flex-col shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-lamarka-100 flex items-center gap-3.5">
          <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-lamarka-200 shrink-0 shadow-2xs">
            <Image
              src="/logo.png"
              alt="La Marka"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-base text-lamarka-900 leading-tight">
              La Marka Club
            </h2>
            <span className="text-[10px] text-lamarka-600 font-light flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#DFB76C]" /> Painel de Gestão
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-lamarka-800 text-white shadow-xs'
                    : 'text-lamarka-700 hover:bg-lamarka-50 hover:text-lamarka-950'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to Balcão & Sair Footer */}
        <div className="p-4 border-t border-lamarka-100 flex flex-col gap-2">
          <Link
            href="/balcao"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-lamarka-50 hover:bg-lamarka-100/80 text-lamarka-800 text-xs font-semibold border border-lamarka-200/80 transition-colors shadow-2xs"
          >
            <Store className="w-4 h-4" strokeWidth={1.5} />
            Ir para Frente de Caixa
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Sair do Painel
          </button>
        </div>
      </aside>
    </>
  );
}
