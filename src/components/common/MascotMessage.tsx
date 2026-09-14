import React from 'react';
import { Sparkles } from 'lucide-react';

interface MascotMessageProps {
  message: string;
  title?: string;
  mood?: 'celebrate' | 'advice' | 'alert' | 'neutral';
  className?: string;
}

export const MascotMessage: React.FC<MascotMessageProps> = ({
  message,
  title = 'Dica do Poupagaio',
  mood = 'neutral',
  className = '',
}) => {
  const moodStyles = {
    celebrate: {
      bg: 'bg-emerald-50/90 border-emerald-200',
      badge: 'bg-emerald-500 text-white',
      titleColor: 'text-emerald-900',
      textColor: 'text-emerald-800',
    },
    advice: {
      bg: 'bg-cyan-50/90 border-cyan-200',
      badge: 'bg-cyan-500 text-white',
      titleColor: 'text-cyan-900',
      textColor: 'text-cyan-800',
    },
    alert: {
      bg: 'bg-amber-50/90 border-amber-200',
      badge: 'bg-amber-500 text-white',
      titleColor: 'text-amber-900',
      textColor: 'text-amber-800',
    },
    neutral: {
      bg: 'bg-white border-[#DDE8E0]',
      badge: 'bg-[#22C55E] text-white',
      titleColor: 'text-[#0D3B22]',
      textColor: 'text-[#18201B]',
    },
  };

  const style = moodStyles[mood];

  return (
    <div
      id="mascot-message-card"
      className={`relative flex items-start gap-4 p-4 rounded-2xl border shadow-xs transition-all ${style.bg} ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo-poupagaio.png"
          alt="Mascote Poupagaio"
          referrerPolicy="no-referrer"
          className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-xl shadow-xs"
        />
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${style.badge}`}
        >
          <Sparkles size={11} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-bold flex items-center gap-1.5 ${style.titleColor}`}>
          {title}
        </h4>
        <p className={`mt-0.5 text-sm font-medium leading-relaxed ${style.textColor}`}>
          {message}
        </p>
      </div>
    </div>
  );
};
