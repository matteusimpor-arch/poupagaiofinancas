import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYearBR } from '../../lib/calculations';

interface ReopenMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthToReopen: string;
}

export const ReopenMonthModal: React.FC<ReopenMonthModalProps> = ({
  isOpen,
  onClose,
  monthToReopen,
}) => {
  const { reopenMonth } = useFinance();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('O motivo da reabertura é obrigatório.');
      return;
    }

    reopenMonth(monthToReopen, reason);
    onClose();
  };

  return (
    <div
      id="reopen-month-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="reopen-month-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0] bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">Reabrir Mês</h3>
              <p className="text-xs text-[#68736C]">{formatMonthYearBR(monthToReopen)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">
              <strong>Atenção:</strong> Ao reabrir o mês, as movimentações consolidadas voltam a
              poder ser editadas, e os saldos consolidados poderão sofrer alterações.
            </p>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <div>
            <label
              htmlFor="reopen-reason"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Motivo da Reabertura <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reopen-reason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Identificada nota fiscal esquecida, ajuste de valor de condomínio..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-xs font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#DDE8E0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              Confirmar Reabertura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
