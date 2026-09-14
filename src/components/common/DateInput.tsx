import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatDateBR, parseDateBR } from '../../lib/calculations';

interface DateInputProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  id = 'date-input',
  value,
  onChange,
  required = false,
  className = '',
  min,
  max,
  disabled = false,
}) => {
  const displayBR = formatDateBR(value);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="date"
        id={id}
        value={value || ''}
        onChange={handleDateChange}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        aria-label="Selecionar data"
        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all font-medium text-sm"
      />
    </div>
  );
};
