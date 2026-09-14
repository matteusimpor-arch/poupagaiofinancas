import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, parseCurrency } from '../../lib/calculations';

interface MoneyInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  id = 'money-input',
  value,
  onChange,
  placeholder = 'R$ 0,00',
  className = '',
  required = false,
  autoFocus = false,
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value > 0 ? formatCurrency(value) : ''
  );
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!isInternalChange.current) {
      setDisplayValue(value > 0 ? formatCurrency(value) : '');
    }
    isInternalChange.current = false;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      isInternalChange.current = true;
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numberVal = parseInt(raw, 10) / 100;
    isInternalChange.current = true;
    setDisplayValue(formatCurrency(numberVal));
    onChange(numberVal);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-label="Valor monetário em reais"
      className={`w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all font-semibold ${className}`}
    />
  );
};
