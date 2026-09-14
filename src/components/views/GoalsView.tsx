import React, { useState } from 'react';
import {
  Target,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  History,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/calculations';
import { EmptyState } from '../common/EmptyState';
import { MascotMessage } from '../common/MascotMessage';
import { ConfirmModal } from '../common/ConfirmModal';

interface GoalsViewProps {
  onOpenAddGoal: () => void;
  onOpenEditGoal: (goal: Goal) => void;
  onOpenGoalMovement: (goal: Goal, type: 'deposit' | 'withdraw') => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  onOpenAddGoal,
  onOpenEditGoal,
  onOpenGoalMovement,
}) => {
  const { goals, goalMovements, deleteGoal } = useFinance();
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [activeHistoryGoal, setActiveHistoryGoal] = useState<Goal | null>(null);

  const totalSavedAcrossGoals = goals.reduce((s, g) => s + g.saved_amount, 0);
  const totalTargetAcrossGoals = goals.reduce((s, g) => s + g.target_amount, 0);

  return (
    <div id="goals-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Metas Financeiras</h2>
          <p className="text-xs text-[#68736C]">
            Economize com foco para viagens, reservas e sonhos
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddGoal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* Resumo Global de Metas */}
      <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Total Acumulado em Metas
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-[#0D3B22] mt-1">
            {formatCurrency(totalSavedAcrossGoals)}{' '}
            <span className="text-sm font-semibold text-[#68736C]">
              de {formatCurrency(totalTargetAcrossGoals)}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
            {goals.length} meta(s) ativas
          </span>
        </div>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <EmptyState
          title="Nenhuma meta criada ainda"
          description="Crie sua primeira meta (ex: Reserva de Emergência, Férias, Carro Novo) e acompanhe seu progresso."
          actionLabel="Criar Primeira Meta"
          onAction={onOpenAddGoal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
            const remaining = Math.max(0, goal.target_amount - goal.saved_amount);

            // Mensagem motivacional do Poupagaio
            let mascotMsg = 'Cada passo conta para o seu voo!';
            if (pct >= 100) mascotMsg = 'Sensacional! Meta atingida com sucesso!';
            else if (pct >= 75) mascotMsg = 'Quase lá! Faltam apenas os últimos detalhes!';
            else if (pct >= 50) mascotMsg = 'Metade do caminho conquistado!';
            else if (pct >= 25) mascotMsg = 'Ótimo começo! Continue no ritmo!';

            return (
              <div
                key={goal.id}
                className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {goal.category}
                      </span>
                      <h4 className="text-base font-bold text-[#0D3B22] mt-1.5 truncate">
                        {goal.name}
                      </h4>
                      {goal.deadline && (
                        <p className="text-xs text-[#68736C] flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> Prazo: {formatDateBR(goal.deadline)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveHistoryGoal(goal)}
                        title="Ver histórico"
                        className="p-1.5 text-[#68736C] hover:text-[#0D3B22] rounded-lg hover:bg-gray-100"
                      >
                        <History size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEditGoal(goal)}
                        title="Editar meta"
                        className="p-1.5 text-[#68736C] hover:text-[#0D3B22] rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        title="Excluir meta"
                        className="p-1.5 text-[#68736C] hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#0D3B22] text-sm">
                        {formatCurrency(goal.saved_amount)}
                      </span>
                      <span className="font-black text-[#22C55E] text-sm">{pct}%</span>
                    </div>

                    <div className="w-full bg-[#DDE8E0]/70 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#22C55E] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#68736C]">
                      <span>Alvo: {formatCurrency(goal.target_amount)}</span>
                      <span>Falta: {formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {/* Mensagem do Poupagaio */}
                  <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <Sparkles size={15} className="shrink-0 text-[#22C55E]" />
                    <span className="font-medium text-[11px]">{mascotMsg}</span>
                  </div>
                </div>

                {/* Ações: Guardar e Retirar */}
                <div className="pt-3 border-t border-[#DDE8E0]/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenGoalMovement(goal, 'deposit')}
                    className="flex-1 py-2 px-3 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownCircle size={15} />
                    <span>Guardar Dinheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenGoalMovement(goal, 'withdraw')}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-[#68736C] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpCircle size={15} />
                    <span>Retirar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de Movimentações da Meta */}
      {activeHistoryGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#DDE8E0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0D3B22]">Histórico da Meta</h3>
                <p className="text-xs text-[#68736C]">{activeHistoryGoal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryGoal(null)}
                className="text-xs font-bold text-[#68736C] hover:text-[#18201B]"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {goalMovements.filter((m) => m.goal_id === activeHistoryGoal.id).length === 0 ? (
                <p className="text-xs text-[#68736C] text-center py-6">
                  Nenhuma movimentação registrada nesta meta ainda.
                </p>
              ) : (
                goalMovements
                  .filter((m) => m.goal_id === activeHistoryGoal.id)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span
                          className={`font-bold block ${
                            m.type === 'deposit' ? 'text-emerald-700' : 'text-amber-800'
                          }`}
                        >
                          {m.type === 'deposit' ? '+ Depósito' : '- Retirada'}
                        </span>
                        <span className="text-[11px] text-[#68736C]">{formatDateBR(m.date)}</span>
                        {m.reason && (
                          <p className="text-[10px] text-[#68736C] italic mt-0.5">{m.reason}</p>
                        )}
                      </div>
                      <span className="font-black text-sm text-[#0D3B22]">
                        {formatCurrency(m.amount)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Exclusão de Meta */}
      <ConfirmModal
        isOpen={Boolean(goalToDelete)}
        title="Excluir Meta"
        message={`Deseja realmente excluir a meta "${goalToDelete?.name}"? Os registros associados serão removidos.`}
        confirmLabel="Sim, excluir meta"
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
