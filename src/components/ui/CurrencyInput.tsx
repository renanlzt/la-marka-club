'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  className?: string;
  min?: number;
  max?: number;
}

export function formatCentsToBRL(cents: number): string {
  if (isNaN(cents) || cents === null || cents === undefined) return '0,00';
  const val = cents / 100;
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  disabled = false,
  required = false,
  autoFocus = false,
  id,
  name,
  className = '',
  min,
  max,
}: CurrencyInputProps) {
  // Mantém os centavos como número inteiro para precisão e máscara de digitação
  const [cents, setCents] = useState<number>(() => Math.round((value || 0) * 100));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza quando o valor externo mudar (ex: botão "Usar Máximo" ou reset)
  useEffect(() => {
    const newCents = Math.round((value || 0) * 100);
    if (newCents !== cents) {
      setCents(newCents);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Teclas de controle permitidas normalmente
    if (
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      const updatedCents = Math.floor(cents / 10);
      setCents(updatedCents);
      onChange(updatedCents / 100);
      return;
    }

    if (e.key === 'Delete' || e.key === 'Escape') {
      e.preventDefault();
      setCents(0);
      onChange(0);
      return;
    }

    // Se for dígito numérico (0 a 9)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const digit = parseInt(e.key, 10);
      const updatedCents = cents * 10 + digit;

      // Limite de segurança de 10 milhões para evitar overflow
      if (updatedCents > 1000000000) return;

      const updatedVal = updatedCents / 100;
      if (max !== undefined && updatedVal > max) {
        // Se ultrapassar o máximo permitido, limita ao máximo
        const maxCents = Math.round(max * 100);
        setCents(maxCents);
        onChange(max);
        return;
      }

      setCents(updatedCents);
      onChange(updatedVal);
    } else {
      // Ignora vírgula, ponto, letras e outros caracteres para manter a digitação fluida
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = pasted.replace(/[^\d]/g, '');
    if (cleaned) {
      const parsedCents = parseInt(cleaned, 10);
      if (!isNaN(parsedCents)) {
        let finalVal = parsedCents / 100;
        if (max !== undefined && finalVal > max) finalVal = max;
        const finalCents = Math.round(finalVal * 100);
        setCents(finalCents);
        onChange(finalVal);
      }
    }
  };

  const displayString = cents === 0 ? '' : formatCentsToBRL(cents);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      id={id}
      name={name}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={displayString}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={() => {}} // controlado via onKeyDown
      className={className}
      autoComplete="off"
    />
  );
}
