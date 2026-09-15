import React, { useState, useEffect } from 'react';
import { X, CreditCard, Trash2, Edit3, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Installment, InstallmentPurchase } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';
import { formatCurrency, formatDateBR } from '../../lib/calculations';

interface InstallmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  mode: 'edit' | 'delete';
}

export const InstallmentActionModal: React.FC<InstallmentActionModalProps> = ({
  isOpen,
  onClose,
  installment,
  mode,
}) => {
  const {
    installmentPurchases,
    categories,
    updateInstallment,
    deleteInstallment,
    deleteInstallmentPurchase,
  } = useFinance();

  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [applyScope, setApplyScope] = useState<'single' | 'future'>('single');
  const [deleteMode, setDeleteMode] = useState<'single' | 'future' | 'all'>('single');

  const parentPurchase = installment
    ? installmentPurchases.find((p) => p.id === installment.purchase_id)
    : null;

  useEffect(() => {
    if (installment) {
      setAmount(installment.amount);
      setDueDate(installment.due_date);
      setCategoryId(installment.category_id || '');
      setApplyScope('single');
      setDeleteMode('single');
    }
  }, [installment]);

  if (!isOpen || !installment) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstallment(
      installment.id,
      {
        amount,
        due_date: dueDate,
        category_id: categoryId || undefined,
      },
      applyScope
    );
    onClose();
  };

  const handleDelete = () => {
    if (deleteMode === 'all' && installment.purchase_id) {
      deleteInstallmentPurchase(installment.purchase_id);
    } else {
      deleteInstallment(installment.id, deleteMode as 'single' | 'future');
    }
    onClose();
  };

  return (
    <div
      id="installment-action-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="installment-action-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDE8E0] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto mt-2.5" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDE8E0] bg-[#F6FAF7]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs ${
                mode === 'edit'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {mode === 'edit' ? <Edit3 size={20} /> : <Trash2 size={20} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0D3B22]">
                {mode === 'edit' ? 'Editar Parcela' : 'Excluir Parcela'}
              </h3>
              <p className="text-xs text-[#68736C]">
                {parentPurchase?.description || installment.purchase_description} (
                {installment.installment_number}/{installment.total_installments})
              </p>
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

        {mode === 'edit' ? (
          <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
            <div>
              <label
                htmlFor="edit-inst-amount"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor da Parcela
              </label>
              <MoneyInput
                id="edit-inst-amount"
                value={amount}
                onChange={setAmount}
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-inst-date"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Data de Vencimento
              </label>
              <DateInput
                id="edit-inst-date"
                value={dueDate}
                onChange={setDueDate}
                required
              />
            </div>

            {/* Escopo da Edição (Seção 3.7) */}
            <div className="space-y-2 pt-2 border-t border-[#DDE8E0]">
              <span className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide">
                Aplicar alteração em:
              </span>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DDE8E0] bg-white cursor-pointer hover:bg-[#F6FAF7]">
                <input
                  type="radio"
                  name="edit-scope"
                  value="single"
                  checked={applyScope === 'single'}
                  onChange={() => setApplyScope('single')}
                  className="text-[#22C55E] focus:ring-[#22C55E]"
                />
                <div className="text-xs">
                  <strong className="block text-[#18201B]">Somente esta parcela ({installment.installment_number}/{installment.total_installments})</strong>
                  <span className="text-[#68736C]">As demais parcelas não serão afetadas.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DDE8E0] bg-white cursor-pointer hover:bg-[#F6FAF7]">
                <input
                  type="radio"
                  name="edit-scope"
                  value="future"
                  checked={applyScope === 'future'}
                  onChange={() => setApplyScope('future')}
                  className="text-[#22C55E] focus:ring-[#22C55E]"
                />
                <div className="text-xs">
                  <strong className="block text-[#18201B]">Esta e as próximas parcelas</strong>
                  <span className="text-[#68736C]">
                    Atualiza da parcela {installment.installment_number} até a {installment.total_installments}.
                  </span>
                </div>
              </label>
            </div>

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
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold shadow-xs transition-transform active:scale-[0.99]"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-xs text-[#68736C] leading-relaxed">
              Escolha como deseja realizar a exclusão do lançamento parcelado:
            </p>

            {/* Escopo da Exclusão (Seção 3.8) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DDE8E0] bg-white cursor-pointer hover:bg-[#F6FAF7]">
                <input
                  type="radio"
                  name="delete-mode"
                  value="single"
                  checked={deleteMode === 'single'}
                  onChange={() => setDeleteMode('single')}
                  className="text-red-600 focus:ring-red-600"
                />
                <div className="text-xs">
                  <strong className="block text-[#18201B]">Excluir somente esta parcela ({installment.installment_number}/{installment.total_installments})</strong>
                  <span className="text-[#68736C]">Apenas a parcela deste mês será removida.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#DDE8E0] bg-white cursor-pointer hover:bg-[#F6FAF7]">
                <input
                  type="radio"
                  name="delete-mode"
                  value="future"
                  checked={deleteMode === 'future'}
                  onChange={() => setDeleteMode('future')}
                  className="text-red-600 focus:ring-red-600"
                />
                <div className="text-xs">
                  <strong className="block text-[#18201B]">Excluir esta e as próximas</strong>
                  <span className="text-[#68736C]">
                    Remove da parcela {installment.installment_number} em diante (mantém as anteriores).
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="delete-mode"
                  value="all"
                  checked={deleteMode === 'all'}
                  onChange={() => setDeleteMode('all')}
                  className="text-red-600 focus:ring-red-600"
                />
                <div className="text-xs">
                  <strong className="block text-red-900">Excluir compra parcelada inteira</strong>
                  <span className="text-red-700/80">
                    Remove todas as parcelas e o registro da compra.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#DDE8E0] text-xs font-bold text-[#68736C] hover:bg-[#F6FAF7] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
