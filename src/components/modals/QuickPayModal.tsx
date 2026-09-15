import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';
import { formatCurrency, formatDateBR } from '../../lib/calculations';

export interface QuickPayItem {
  id: string;
  type: 'transaction' | 'installment';
  description: string;
  expectedAmount: number;
  dueDate: string;
  categoryName?: string;
  isRecurring?: boolean;
}

interface QuickPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuickPayItem | null;
  onConfirmPay: (
    id: string,
    type: 'transaction' | 'installment',
    paidDate: string,
    paidAmount: number,
    updateFutureRecurring?: boolean
  ) => void;
}

export const QuickPayModal: React.FC<QuickPayModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmPay,
}) => {
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [updateFutureRecurring, setUpdateFutureRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setPaidAmount(item.expectedAmount);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setUpdateFutureRecurring(false);
      setIsSubmitting(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isDifferentAmount = Math.abs(paidAmount - item.expectedAmount) > 0.009;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (paidAmount < 0) return;
    setIsSubmitting(true);
    try {
      onConfirmPay(
        item.id,
        item.type,
        paymentDate,
        paidAmount,
        updateFutureRecurring
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="quick-pay-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="quick-pay-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDE8E0] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto mt-2.5" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDE8E0] bg-[#F6FAF7]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#22C55E] flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0D3B22]">Confirmar Pagamento</h3>
              <p className="text-xs text-[#68736C]">Dar baixa e atualizar saldo do mês</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-1.5 rounded-xl hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo da Conta */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="p-4 bg-[#F6FAF7] border border-[#DDE8E0] rounded-2xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                  {item.type === 'installment' ? 'Parcela' : 'Conta / Despesa'}
                </span>
                <h4 className="text-sm font-bold text-[#0D3B22] leading-snug">
                  {item.description}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                  Previsto
                </span>
                <p className="text-sm font-extrabold text-[#18201B]">
                  {formatCurrency(item.expectedAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#DDE8E0]/70 text-xs text-[#68736C]">
              <span>Vencimento: <strong>{formatDateBR(item.dueDate)}</strong></span>
              {item.isRecurring && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <RefreshCw size={11} /> Mensal
                </span>
              )}
            </div>
          </div>

          {/* Valor Pago (Permite ajuste conforme Seção 5.6) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="quickpay-amount"
                className="text-xs font-bold text-[#0D3B22] uppercase tracking-wide"
              >
                Valor Efetivamente Pago
              </label>
              {isDifferentAmount && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Valor alterado
                </span>
              )}
            </div>
            <MoneyInput
              id="quickpay-amount"
              value={paidAmount}
              onChange={setPaidAmount}
              required
            />
          </div>

          {/* Data do Pagamento */}
          <div>
            <label
              htmlFor="quickpay-date"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Data em que foi Pago
            </label>
            <DateInput
              id="quickpay-date"
              value={paymentDate}
              onChange={setPaymentDate}
              required
            />
          </div>

          {/* Opção se o valor mudou e a conta é recorrente (Seção 5.6) */}
          {item.isRecurring && isDifferentAmount && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateFutureRecurring}
                  onChange={(e) => setUpdateFutureRecurring(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-[#22C55E] focus:ring-[#22C55E]"
                />
                <span className="text-xs text-amber-900 font-medium leading-tight">
                  Atualizar valor previsto de <strong>{formatCurrency(paidAmount)}</strong> para os próximos meses também?
                </span>
              </label>
              <p className="text-[10px] text-amber-800/80 pl-6">
                Se desmarcado, a alteração valerá apenas para a conta deste mês.
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#DDE8E0] text-xs font-bold text-[#68736C] hover:bg-[#F6FAF7] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-quick-pay"
              disabled={isSubmitting || paidAmount <= 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
