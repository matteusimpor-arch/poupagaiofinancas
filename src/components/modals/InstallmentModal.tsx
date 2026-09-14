import React, { useState } from 'react';
import { X, CreditCard, Calculator } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';
import { formatCurrency } from '../../lib/calculations';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({ isOpen, onClose }) => {
  const { currentSpace, categories, addInstallmentPurchase } = useFinance();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [firstDueDate, setFirstDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  // Sincronização inteligente de valores
  const handleTotalChange = (total: number) => {
    setTotalAmount(total);
    if (installmentsCount > 0) {
      setInstallmentAmount(Math.round((total / installmentsCount) * 100) / 100);
    }
  };

  const handleInstallmentsCountChange = (count: number) => {
    const validCount = Math.max(1, count);
    setInstallmentsCount(validCount);
    if (totalAmount > 0) {
      setInstallmentAmount(Math.round((totalAmount / validCount) * 100) / 100);
    }
  };

  const handleInstallmentAmountChange = (instAmt: number) => {
    setInstallmentAmount(instAmt);
    if (installmentsCount > 0) {
      setTotalAmount(Math.round(instAmt * installmentsCount * 100) / 100);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || totalAmount <= 0 || !firstDueDate || !currentSpace) return;

    await addInstallmentPurchase({
      space_id: currentSpace.id,
      description,
      total_amount: totalAmount,
      installments_count: installmentsCount,
      installment_amount: installmentAmount,
      first_due_date: firstDueDate,
      category_id: categoryId || undefined,
      notes: notes || undefined,
    });

    onClose();
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div
      id="installment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="installment-modal-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">Novo Parcelamento</h3>
              <p className="text-xs text-[#68736C]">Cadastre compras divididas no cartão</p>
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

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Descrição */}
          <div>
            <label
              htmlFor="inst-desc"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Descrição da Compra <span className="text-red-500">*</span>
            </label>
            <input
              id="inst-desc"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Smartphone, Passagens aéreas, Sofá"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 focus:ring-2 focus:ring-[#22C55E] focus:outline-none text-sm font-semibold"
            />
          </div>

          {/* Valor Total vs Parcelas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="inst-total"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor Total <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="inst-total"
                value={totalAmount}
                onChange={handleTotalChange}
                required
              />
            </div>

            <div>
              <label
                htmlFor="inst-count"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Nº de Parcelas
              </label>
              <select
                id="inst-count"
                value={installmentsCount}
                onChange={(e) => handleInstallmentsCountChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] font-semibold text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}x parcelas
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="inst-part"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor da Parcela
              </label>
              <MoneyInput
                id="inst-part"
                value={installmentAmount}
                onChange={handleInstallmentAmountChange}
              />
            </div>
          </div>

          {/* Resumo da Divisão */}
          {totalAmount > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-medium text-amber-900">
              <span className="flex items-center gap-1.5">
                <Calculator size={15} /> Divisão calculada:
              </span>
              <span className="font-bold">
                {installmentsCount}x de {formatCurrency(installmentAmount)} ={' '}
                {formatCurrency(totalAmount)}
              </span>
            </div>
          )}

          {/* Primeira Parcela e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inst-first-date"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                1º Vencimento <span className="text-red-500">*</span>
              </label>
              <DateInput
                id="inst-first-date"
                value={firstDueDate}
                onChange={setFirstDueDate}
                required
              />
            </div>

            <div>
              <label
                htmlFor="inst-category"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Categoria
              </label>
              <select
                id="inst-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              >
                <option value="">Selecione categoria...</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label
              htmlFor="inst-notes"
              className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
            >
              Observações
            </label>
            <input
              id="inst-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compra na Magazine Luiza, Cartão Nubank"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-xs font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
            />
          </div>

          {/* Botões de Ação */}
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
              id="btn-save-installment"
              className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-[#22C55E]"
            >
              Cadastrar Parcelas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
