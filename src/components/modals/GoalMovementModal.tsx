import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { formatCurrency } from '../../lib/calculations';

interface GoalMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  initialType?: 'deposit' | 'withdraw';
}

export const GoalMovementModal: React.FC<GoalMovementModalProps> = ({
  isOpen,
  onClose,
  goal,
  initialType = 'deposit',
}) => {
  const { depositToGoal, withdrawFromGoal } = useFinance();

  const [type, setType] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Por favor, informe um valor maior que zero.');
      return;
    }

    if (type === 'withdraw') {
      if (!reason.trim()) {
        setError('O motivo do resgate é obrigatório para manter o controle.');
        return;
      }
      if (amount > goal.saved_amount) {
        setError(
          `Você não pode retirar ${formatCurrency(amount)}. O saldo disponível nesta meta é ${formatCurrency(goal.saved_amount)}.`
        );
        return;
      }
      const ok = withdrawFromGoal(goal.id, amount, reason);
      if (!ok) {
        setError('Não foi possível realizar a retirada.');
        return;
      }
    } else {
      const ok = depositToGoal(goal.id, amount, reason || 'Aporte para meta');
      if (!ok) {
        setError('Não foi possível realizar o depósito.');
        return;
      }
    }

    onClose();
  };

  return (
    <div
      id="goal-movement-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="goal-movement-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                type === 'deposit'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {type === 'deposit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                {type === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Dinheiro'}
              </h3>
              <p className="text-xs text-[#68736C]">Meta: {goal.name}</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Seletor Tipo de Movimentação */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6FAF7] rounded-xl border border-[#DDE8E0]">
            <button
              type="button"
              onClick={() => {
                setType('deposit');
                setError(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'deposit'
                  ? 'bg-[#22C55E] text-white shadow-xs'
                  : 'text-[#68736C] hover:text-[#18201B]'
              }`}
            >
              Guardar (+ Aporte)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('withdraw');
                setError(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'withdraw'
                  ? 'bg-[#F4B942] text-[#0D3B22] shadow-xs'
                  : 'text-[#68736C] hover:text-[#18201B]'
              }`}
            >
              Resgatar (- Retirar)
            </button>
          </div>

          {/* Saldo Atual da Meta */}
          <div className="p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0] flex items-center justify-between text-xs">
            <span className="text-[#68736C]">Saldo guardado até agora:</span>
            <span className="font-extrabold text-[#0D3B22] text-sm">
              {formatCurrency(goal.saved_amount)}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs font-medium text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="gm-amount"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              {type === 'deposit' ? 'Quanto deseja guardar?' : 'Quanto deseja retirar?'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <MoneyInput id="gm-amount" value={amount} onChange={setAmount} autoFocus required />
          </div>

          <div>
            <label
              htmlFor="gm-reason"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              {type === 'deposit' ? 'Anotação (opcional)' : 'Motivo da retirada'}{' '}
              {type === 'withdraw' && <span className="text-red-500">* (Obrigatório)</span>}
            </label>
            <input
              id="gm-reason"
              type="text"
              required={type === 'withdraw'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === 'deposit'
                  ? 'Ex: Economia com alimentação, sobra do mês'
                  : 'Ex: Manutenção inesperada do carro, consulta médica'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-xs font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
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
              id="btn-save-goal-movement"
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-colors focus:ring-2 ${
                type === 'deposit'
                  ? 'bg-[#22C55E] hover:bg-[#16a34a] focus:ring-[#22C55E]'
                  : 'bg-[#F4B942] hover:bg-[#e2a832] text-[#0D3B22] focus:ring-[#F4B942]'
              }`}
            >
              {type === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
