import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useFinance();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      id="global-toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white text-[#18201B] rounded-2xl shadow-xl border border-[#DDE8E0] max-w-sm animate-in slide-in-from-bottom-5 duration-200 select-none"
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isSuccess
            ? 'bg-emerald-100 text-[#22C55E]'
            : isError
            ? 'bg-red-100 text-red-600'
            : 'bg-blue-100 text-blue-600'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={18} />
        ) : isError ? (
          <AlertCircle size={18} />
        ) : (
          <Info size={18} />
        )}
      </div>

      <p className="text-xs font-bold text-[#0D3B22] flex-1 leading-snug">
        {toast.message}
      </p>

      <button
        type="button"
        onClick={dismissToast}
        aria-label="Fechar notificação"
        className="text-[#68736C] hover:text-[#18201B] p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
};
