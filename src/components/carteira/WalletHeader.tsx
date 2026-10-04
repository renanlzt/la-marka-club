import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface WalletHeaderProps {
  firstName: string;
  maskedPhone: string;
}

export function WalletHeader({ firstName, maskedPhone }: WalletHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center pt-8 pb-5 px-4">
      <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-card border-2 border-white ring-1 ring-lamarka-300 mb-3.5 bg-white transition-transform hover:scale-105 duration-300">
        <Image
          src="/logo.png"
          alt="La Marka"
          fill
          className="object-contain p-1.5"
          priority
        />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-lamarka-200 shadow-2xs text-lamarka-800 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">
        <Sparkles className="w-3 h-3 text-[#DFB76C]" />
        La Marka Club • Privilège
      </div>

      <h1 className="text-3xl sm:text-4xl font-serif font-medium text-lamarka-900 tracking-tight">
        Olá, {firstName} ✨
      </h1>
      <p className="text-xs text-lamarka-600 font-light mt-1">
        Carteira vinculada ao telefone <span className="font-medium text-lamarka-800">{maskedPhone}</span>
      </p>
    </header>
  );
}
