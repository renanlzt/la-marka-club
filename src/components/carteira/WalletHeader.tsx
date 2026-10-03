import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface WalletHeaderProps {
  firstName: string;
  maskedPhone: string;
}

export function WalletHeader({ firstName, maskedPhone }: WalletHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center pt-8 pb-4 px-4">
      <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-sm border border-lamarka-200 mb-3 bg-white">
        <Image
          src="/logo.png"
          alt="La Marka"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-lamarka-200/80 text-lamarka-800 text-[11px] font-medium uppercase tracking-wider mb-1">
        <Sparkles className="w-3 h-3 text-lamarka-600" />
        Carteira Digital La Marka
      </div>

      <h1 className="text-2xl font-serif text-lamarka-900">
        Olá, {firstName}! ✨
      </h1>
      <p className="text-xs text-lamarka-600 font-light mt-0.5">
        Conta vinculada a {maskedPhone}
      </p>
    </header>
  );
}
