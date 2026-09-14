import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="confirm-modal-content"
        className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-[#DDE8E0] space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDestructive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#18201B]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[#68736C] leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#22C55E] hover:bg-[#16a34a]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
