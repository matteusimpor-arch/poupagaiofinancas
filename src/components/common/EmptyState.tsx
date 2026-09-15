import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      id="empty-state-view"
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-[#DDE8E0] shadow-xs ${className}`}
    >
      <div className="relative mb-3 flex items-center justify-center">
        <img
          src="/logo-poupagaio-principal.png"
          alt="Papagaio Poupagaio"
          referrerPolicy="no-referrer"
          className="w-16 h-16 object-contain drop-shadow-xs"
        />
      </div>
      <h3 className="text-base font-bold text-[#0D3B22]">{title}</h3>
      <p className="mt-1 text-sm text-[#68736C] max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
        >
          <Plus size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
