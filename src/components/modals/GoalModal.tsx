import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  editingGoal?: Goal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  editingGoal,
}) => {
  const activeGoal = goalToEdit || editingGoal;
  const { currentSpace, addGoal, updateGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Reserva');
  const [color, setColor] = useState('#22C55E');

  useEffect(() => {
    if (activeGoal) {
      setName(activeGoal.name);
      setTargetAmount(activeGoal.target_amount);
      setDeadline(activeGoal.deadline || '');
      setCategory(activeGoal.category || 'Reserva');
      setColor(activeGoal.color || '#22C55E');
    } else {
      setName('');
      setTargetAmount(0);
      setDeadline('');
      setCategory('Reserva');
      setColor('#22C55E');
    }
  }, [activeGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0 || !currentSpace) return;

    if (activeGoal) {
      updateGoal(activeGoal.id, {
        name,
        target_amount: targetAmount,
        deadline: deadline || undefined,
        category,
        color,
      });
    } else {
      addGoal({
        space_id: currentSpace.id,
        name,
        target_amount: targetAmount,
        deadline: deadline || undefined,
        category,
        color,
        monthly_target: 0,
        priority: 'medium',
        status: 'active',
      });
    }

    onClose();
  };

  const presetColors = ['#22C55E', '#06B6D4', '#F4B942', '#8B5CF6', '#EC4899', '#3B82F6'];

  return (
    <div
      id="goal-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="goal-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto mt-2.5" />

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                {activeGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
              </h3>
              <p className="text-xs text-[#68736C]">Defina seu objetivo e acompanhe o progresso</p>
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
          <div>
            <label
              htmlFor="goal-name"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Nome da Meta <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Viagem para Noronha"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-semibold focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="goal-target"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Valor Alvo <span className="text-red-500">*</span>
            </label>
            <MoneyInput id="goal-target" value={targetAmount} onChange={setTargetAmount} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="goal-deadline"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Prazo Desejado
              </label>
              <DateInput id="goal-deadline" value={deadline} onChange={setDeadline} />
            </div>

            <div>
              <label
                htmlFor="goal-category"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Categoria
              </label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              >
                <option value="Reserva">Reserva</option>
                <option value="Viagem">Viagem</option>
                <option value="Carro / Moto">Veículo</option>
                <option value="Casa / Reforma">Moradia</option>
                <option value="Educação">Educação</option>
                <option value="Casamento">Casamento</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-2">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-3">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
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
              id="btn-save-goal"
              className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-[#22C55E]"
            >
              {goalToEdit ? 'Salvar Meta' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
