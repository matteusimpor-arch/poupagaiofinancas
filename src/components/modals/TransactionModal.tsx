import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  initialType?: 'income' | 'expense_fixed' | 'expense_variable';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  initialType = 'expense_variable',
}) => {
  const {
    currentSpace,
    spaceMembers,
    categories,
    selectedMonth,
    addTransaction,
    updateTransaction,
    currentUser,
  } = useFinance();

  // Campos Principais (Mostrados inicialmente)
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');

  // Accordion "Mais opções"
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Campos Complementares
  const [type, setType] = useState<'income' | 'expense_fixed' | 'expense_variable'>(initialType);
  const [categoryId, setCategoryId] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentDate, setPaymentDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Recorrência na edição
  const [recurrenceScope, setRecurrenceScope] = useState<'only_this_month' | 'this_and_future'>('only_this_month');

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount);
      setDueDate(transactionToEdit.due_date);
      setType(transactionToEdit.type);
      setCategoryId(transactionToEdit.category_id || '');
      setResponsibleUserId(transactionToEdit.responsible_user_id || '');
      setPaymentMethod(transactionToEdit.payment_method || 'Pix');
      setPaymentDate(transactionToEdit.payment_date || '');
      setIsPaid(transactionToEdit.status === 'paid');
      setIsRecurring(transactionToEdit.is_recurring);
      setNotes(transactionToEdit.notes || '');
      setAttachmentUrl(transactionToEdit.attachment_url || '');
      setShowMoreOptions(true);
    } else {
      // Criação: valores padrão
      setDescription('');
      setAmount(0);
      const today = new Date().toISOString().slice(0, 10);
      setDueDate(today);
      setType(initialType);
      setCategoryId('');
      setResponsibleUserId(currentUser?.id || '');
      setPaymentMethod('Pix');
      setPaymentDate('');
      setIsPaid(initialType === 'expense_variable'); // despesas variáveis costumam nascer pagas
      setIsRecurring(initialType === 'expense_fixed');
      setNotes('');
      setAttachmentUrl('');
      setShowMoreOptions(false);
    }
  }, [transactionToEdit, initialType, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0 || !dueDate) {
      return;
    }

    const refMonth = dueDate.slice(0, 7);

    if (transactionToEdit) {
      updateTransaction(
        transactionToEdit.id,
        {
          description,
          amount,
          due_date: dueDate,
          type,
          category_id: categoryId || undefined,
          responsible_user_id: responsibleUserId || undefined,
          payment_method: paymentMethod,
          payment_date: isPaid ? paymentDate || dueDate : undefined,
          is_recurring: isRecurring,
          notes: notes || undefined,
          attachment_url: attachmentUrl || undefined,
          reference_month: refMonth,
        },
        recurrenceScope
      );
    } else {
      if (!currentSpace) return;
      await addTransaction({
        space_id: currentSpace.id,
        description,
        amount,
        type,
        due_date: dueDate,
        reference_month: refMonth,
        category_id: categoryId || undefined,
        responsible_user_id: responsibleUserId || currentUser?.id,
        payment_method: paymentMethod,
        payment_date: isPaid ? paymentDate || dueDate : undefined,
        is_recurring: isRecurring,
        notes: notes || undefined,
        attachment_url: attachmentUrl || undefined,
      });
    }

    onClose();
  };

  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  return (
    <div
      id="transaction-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="transaction-modal-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                type === 'income'
                  ? 'bg-[#22C55E]'
                  : type === 'expense_fixed'
                  ? 'bg-[#EF5350]'
                  : 'bg-[#F97316]'
              }`}
            />
            <h3 className="text-lg font-bold text-[#0D3B22]">
              {transactionToEdit
                ? 'Editar Lançamento'
                : type === 'income'
                ? 'Nova Entrada'
                : type === 'expense_fixed'
                ? 'Novo Gasto Fixo'
                : 'Novo Gasto Variável'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar formulário"
            className="text-[#68736C] hover:text-[#18201B] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Seletor de Tipo de Movimentação */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6FAF7] rounded-xl border border-[#DDE8E0]">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-[#22C55E] text-white shadow-xs'
                  : 'text-[#68736C] hover:text-[#18201B]'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType('expense_fixed')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'expense_fixed'
                  ? 'bg-[#EF5350] text-white shadow-xs'
                  : 'text-[#68736C] hover:text-[#18201B]'
              }`}
            >
              Gasto Fixo
            </button>
            <button
              type="button"
              onClick={() => setType('expense_variable')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'expense_variable'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'text-[#68736C] hover:text-[#18201B]'
              }`}
            >
              Gasto Variável
            </button>
          </div>

          {/* ==========================================================
              CAMPOS PRINCIPAIS (Mostrados inicialmente - Seção 9)
              ========================================================== */}
          <div className="space-y-3">
            {/* Valor */}
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="tx-amount"
                value={amount}
                onChange={setAmount}
                autoFocus={!transactionToEdit}
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="tx-description"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Nome ou Descrição <span className="text-red-500">*</span>
              </label>
              <input
                id="tx-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Salário, Aluguel, Mercado Pão de Açúcar"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-sm font-semibold"
              />
            </div>

            {/* Data */}
            <div>
              <label
                htmlFor="tx-due-date"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Data <span className="text-red-500">*</span>
              </label>
              <DateInput
                id="tx-due-date"
                value={dueDate}
                onChange={setDueDate}
                required
              />
            </div>
          </div>

          {/* ==========================================================
              ACCORDION: MAIS OPÇÕES (Seção 9)
              ========================================================== */}
          <div className="pt-2 border-t border-[#DDE8E0]">
            <button
              type="button"
              id="btn-toggle-more-options"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#0D3B22] hover:text-[#22C55E] transition-colors select-none"
            >
              <span>{showMoreOptions ? 'Ocultar opções complementares' : 'Mais opções (Responsável, Categoria, Recorrência...)'}</span>
              {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                {/* Categoria */}
                <div>
                  <label
                    htmlFor="tx-category"
                    className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
                  >
                    Categoria
                  </label>
                  <select
                    id="tx-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-sm font-medium"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Responsável (Importante para espaços de casais/família) */}
                <div>
                  <label
                    htmlFor="tx-responsible"
                    className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
                  >
                    Responsável
                  </label>
                  <select
                    id="tx-responsible"
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-sm font-medium"
                  >
                    <option value="">Não especificado</option>
                    {spaceMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.full_name || m.user_id} {m.user_id === currentUser?.id ? '(Você)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label
                    htmlFor="tx-payment-method"
                    className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
                  >
                    Forma de Pagamento
                  </label>
                  <select
                    id="tx-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-sm font-medium"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Débito Automático">Débito Automático</option>
                    <option value="Dinheiro">Dinheiro em Espécie</option>
                    <option value="Transferência Bancária">Transferência (TED/DOC)</option>
                  </select>
                </div>

                {/* Situação / Status Pago */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0]">
                  <input
                    type="checkbox"
                    id="tx-is-paid"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-[#22C55E] focus:ring-[#22C55E] cursor-pointer"
                  />
                  <label htmlFor="tx-is-paid" className="text-xs font-bold text-[#0D3B22] cursor-pointer">
                    {type === 'income' ? 'Já foi recebido?' : 'Conta já está paga?'}
                  </label>
                </div>

                {/* Recorrência Mensal (Seção 10 & 11) */}
                <div className="p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0] space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="tx-is-recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded text-[#22C55E] focus:ring-[#22C55E] cursor-pointer"
                    />
                    <label
                      htmlFor="tx-is-recurring"
                      className="text-xs font-bold text-[#0D3B22] cursor-pointer"
                    >
                      Lançamento mensal recorrente
                    </label>
                  </div>

                  {transactionToEdit && transactionToEdit.is_recurring && (
                    <div className="pt-2 border-t border-[#DDE8E0] space-y-1">
                      <span className="block text-[11px] font-bold text-[#68736C]">
                        Aplicar alteração para:
                      </span>
                      <div className="flex items-center gap-4 text-xs font-medium text-[#18201B]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrenceScope"
                            value="only_this_month"
                            checked={recurrenceScope === 'only_this_month'}
                            onChange={() => setRecurrenceScope('only_this_month')}
                          />
                          Somente este mês
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrenceScope"
                            value="this_and_future"
                            checked={recurrenceScope === 'this_and_future'}
                            onChange={() => setRecurrenceScope('this_and_future')}
                          />
                          Este e os próximos meses
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observação */}
                <div>
                  <label
                    htmlFor="tx-notes"
                    className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
                  >
                    Observações
                  </label>
                  <textarea
                    id="tx-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione anotações, comprovantes ou detalhes..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-xs font-medium resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
              id="btn-save-transaction"
              className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-[#22C55E]"
            >
              {transactionToEdit ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
