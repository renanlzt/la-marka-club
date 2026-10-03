'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Gift,
  FileCheck2,
  Sliders,
  Settings,
  Store,
  Sparkles,
} from 'lucide-react';

const menuItems = [
  { href: '/admin/dashboard', label: 'Visão Geral & KPIs', icon: LayoutDashboard },
  { href: '/admin/campanhas', label: 'Campanhas Especiais', icon: Megaphone },
  { href: '/admin/aniversarios', label: 'Aniversariantes', icon: Gift },
  { href: '/admin/conciliacao', label: 'Conciliação de Cupons', icon: FileCheck2 },
  { href: '/admin/ajustes', label: 'Ajustes Manuais', icon: Sliders },
  { href: '/admin/configuracoes', label: 'Configurações & Mensagens', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-lamarka-200/90 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-lamarka-100 flex items-center gap-3">
        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-lamarka-200 shrink-0">
          <Image
            src="/logo.png"
            alt="La Marka"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h2 className="text-sm font-serif font-bold text-lamarka-900 leading-tight">
            La Marka Club
          </h2>
          <span className="text-[11px] text-lamarka-600 font-light flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-lamarka-500" /> Gestão da Dieizy
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
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
                  : 'text-lamarka-700 hover:bg-lamarka-100 hover:text-lamarka-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to Balcão Footer */}
      <div className="p-4 border-t border-lamarka-100">
        <Link
          href="/balcao"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-lamarka-50 hover:bg-lamarka-100 text-lamarka-800 text-xs font-semibold border border-lamarka-200/80 transition-colors"
        >
          <Store className="w-4 h-4" />
          Ir para Frente de Caixa
        </Link>
      </div>
    </aside>
  );
}
