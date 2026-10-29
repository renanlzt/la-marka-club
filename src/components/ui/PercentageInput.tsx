'use client';

import React, { useState, useEffect } from 'react';

interface PercentageInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PercentageInput({
  value,
  onChange,
  className = '',
  min = 0,
  max = 100,
  step = 'any',
  placeholder = 'Ex: 1,5',
  required = false,
  disabled = false,
  id,
}: PercentageInputProps) {
  // Estado local como string para permitir edição livre (inclusive apagar tudo sem travar no 0)
  const [text, setText] = useState<string>(() =>
    typeof value === 'number' && !isNaN(value) ? value.toString().replace('.', ',') : ''
  );

  // Sincroniza quando o valor externo mudar significativamente
  useEffect(() => {
    const currentNum = parseFloat(text.replace(',', '.'));
    if (isNaN(currentNum) || currentNum !== value) {
      setText(typeof value === 'number' && !isNaN(value) ? value.toString().replace('.', ',') : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Permite apenas dígitos, uma vírgula ou um ponto
    const sanitized = raw.replace(/[^\d.,]/g, '');

    // Evita múltiplas vírgulas/pontos
    const parts = sanitized.split(/[.,]/);
    let normalized = sanitized;
    if (parts.length > 2) {
      normalized = parts[0] + ',' + parts.slice(1).join('');
    }

    setText(normalized);

    // Converte para float e repassa ao componente pai
    const parsed = parseFloat(normalized.replace(',', '.'));
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (normalized === '') {
      onChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o conteúdo ao focar para facilitar substituição imediata ao digitar
    e.target.select();
  };

  const handleBlur = () => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (isNaN(parsed) || text.trim() === '') {
      setText(min.toString().replace('.', ','));
      onChange(min);
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      setText(clamped.toString().replace('.', ','));
      onChange(clamped);
    }
  };

  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 pr-8 rounded-xl border border-lamarka-200 text-sm font-semibold text-lamarka-900 bg-white focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 transition-colors ${className}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-lamarka-400 pointer-events-none select-none">
        %
      </span>
    </div>
  );
}
