import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PiggyBank,
  Wallet,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import { evaluateMonthClosing, formatCurrency, formatMonthYearBR } from '../../lib/calculations';
import { MascotMessage } from '../common/MascotMessage';

interface MonthClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthClosingModal: React.FC<MonthClosingModalProps> = ({ isOpen, onClose }) => {
  const {
    currentSpace,
    selectedMonth,
    transactions,
    installments,
    monthlyPlans,
    goals,
    goalMovements,
    closeCurrentMonth,
  } = useFinance();

  const [step, setStep] = useState<1 | 2>(1);
  const [destination, setDestination] = useState<
    'emergency_reserve' | 'specific_goal' | 'investments' | 'next_month_balance'
  >('emergency_reserve');
  const [targetGoalId, setTargetGoalId] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen || !currentSpace) return null;

  const currentPlan = monthlyPlans.find(
    (p) => p.space_id === currentSpace.id && p.reference_month === selectedMonth
  );

  const depositedToGoals = goalMovements
    .filter(
      (gm) =>
        gm.space_id === currentSpace.id &&
        gm.date.startsWith(selectedMonth) &&
        gm.type === 'deposit'
    )
    .reduce((a, b) => a + b.amount, 0);

  const evaluation = evaluateMonthClosing({
    transactions,
    installments,
    monthlyPlan: currentPlan,
    goalsDeposited: depositedToGoals,
    investedAmount: 0,
    referenceMonth: selectedMonth,
    isSharedSpace: currentSpace.is_shared,
  });

  const handleFinishClosing = () => {
    closeCurrentMonth(destination, targetGoalId || undefined);
    setIsCompleted(true);

    // Celebração festiva com confetes se positivo ou excelente
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#F4B942', '#06B6D4', '#10B981'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const classificationConfig = {
    excellent: {
      label: 'Mês Excelente',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      mood: 'celebrate' as const,
    },
    good: {
      label: 'Mês Bom',
      badge: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle2,
      mood: 'celebrate' as const,
    },
    warning: {
      label: 'Mês de Alerta',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: AlertTriangle,
      mood: 'alert' as const,
    },
    danger: {
      label: 'Mês de Atenção',
      badge: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertTriangle,
      mood: 'alert' as const,
    },
  }[evaluation.classification];

  return (
    <div
      id="month-closing-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="month-closing-modal-content"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0] bg-[#F6FAF7]">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-poupagaio.png"
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-9 h-9 object-contain"
            />
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                Fechamento do Mês ({formatMonthYearBR(selectedMonth)})
              </h3>
              <p className="text-xs text-[#68736C]">Consolidação de contas e balanço final</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isCompleted ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-black text-[#0D3B22]">Mês Fechado com Sucesso!</h4>
              <p className="text-sm text-[#68736C] max-w-md mx-auto leading-relaxed">
                Todas as movimentações de {formatMonthYearBR(selectedMonth)} foram consolidadas.
                Você sempre pode consultar este histórico nos Relatórios.
              </p>

              <MascotMessage
                title="Mensagem do Poupagaio"
                message={evaluation.mascotMessage}
                mood={classificationConfig.mood}
              />

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Continuar no Poupagaio
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              {/* Passo 1: Verificações e Classificação */}
              <div className="p-4 rounded-xl border flex items-center justify-between bg-white shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-[#68736C] uppercase tracking-wider block">
                    Classificação do Mês
                  </span>
                  <span className="text-lg font-black text-[#0D3B22]">
                    {classificationConfig.label}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${classificationConfig.badge}`}
                >
                  {evaluation.allBillsPaid ? 'Contas em dia' : `${evaluation.unpaidCount} pendentes`}
                </span>
              </div>

              {/* Checklist de Verificações */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[#68736C] uppercase tracking-wide">
                  Diagnóstico Financeiro
                </h5>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0]">
                    <span className="flex items-center gap-2 font-semibold text-[#18201B]">
                      {evaluation.allBillsPaid ? (
                        <CheckCircle2 size={18} className="text-[#22C55E]" />
                      ) : (
                        <AlertTriangle size={18} className="text-[#EF5350]" />
                      )}
                      Contas pagas no período
                    </span>
                    <span className="font-bold text-xs">
                      {evaluation.allBillsPaid
                        ? '100% quitadas'
                        : `${evaluation.unpaidCount} conta(s) em aberto`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0]">
                    <span className="flex items-center gap-2 font-semibold text-[#18201B]">
                      {evaluation.spendingLimitRespected ? (
                        <CheckCircle2 size={18} className="text-[#22C55E]" />
                      ) : (
                        <AlertTriangle size={18} className="text-[#F4B942]" />
                      )}
                      Gastos vs Planejamento
                    </span>
                    <span className="font-bold text-xs">
                      {evaluation.spendingLimitRespected
                        ? 'Dentro do planejado'
                        : 'Ultrapassou o limite'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0]">
                    <span className="flex items-center gap-2 font-semibold text-[#18201B]">
                      <ShieldCheck size={18} className="text-[#06B6D4]" />
                      Saldo Líquido Final
                    </span>
                    <span
                      className={`font-black text-sm ${
                        evaluation.finalBalance >= 0 ? 'text-[#22C55E]' : 'text-[#EF5350]'
                      }`}
                    >
                      {formatCurrency(evaluation.finalBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensagem do Mascote */}
              <MascotMessage
                title="Avaliação do Mascote"
                message={evaluation.mascotMessage}
                mood={classificationConfig.mood}
              />

              <div className="pt-3 border-t border-[#DDE8E0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (evaluation.finalBalance > 0) {
                      setStep(2);
                    } else {
                      handleFinishClosing();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
                >
                  <span>{evaluation.finalBalance > 0 ? 'Próximo: Destinar Saldo' : 'Confirmar Fechamento'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Passo 2: Destinação do Saldo Restante */}
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                    Sobra Disponível para Destinar
                  </span>
                  <span className="text-2xl font-black text-emerald-900">
                    {formatCurrency(evaluation.finalBalance)}
                  </span>
                  <p className="mt-1 text-xs text-emerald-700">
                    Parabéns por terminar no azul! Escolha onde alocar essa sobra financeira:
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label
                    onClick={() => setDestination('emergency_reserve')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      destination === 'emergency_reserve'
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'emergency_reserve'}
                      onChange={() => setDestination('emergency_reserve')}
                      className="mt-1 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#0D3B22] flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-[#22C55E]" /> Enviar para a Reserva de Emergência
                      </span>
                      <p className="text-xs text-[#68736C] mt-0.5">
                        Recomendado: fortaleça sua segurança contra imprevistos.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDestination('specific_goal')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      destination === 'specific_goal'
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'specific_goal'}
                      onChange={() => setDestination('specific_goal')}
                      className="mt-1 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-[#0D3B22] flex items-center gap-1.5">
                        <Target size={16} className="text-[#06B6D4]" /> Enviar para outra meta específica
                      </span>
                      <p className="text-xs text-[#68736C] mt-0.5 mb-2">
                        Acelere a conquista de sonhos futuros.
                      </p>

                      {destination === 'specific_goal' && (
                        <select
                          value={targetGoalId}
                          onChange={(e) => setTargetGoalId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#DDE8E0] bg-white text-xs font-semibold focus:ring-2 focus:ring-[#22C55E]"
                        >
                          <option value="">Selecione a meta...</option>
                          {goals.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} (Atual: {formatCurrency(g.saved_amount)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>

                  <label
                    onClick={() => setDestination('investments')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      destination === 'investments'
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'investments'}
                      onChange={() => setDestination('investments')}
                      className="mt-1 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#0D3B22] flex items-center gap-1.5">
                        <PiggyBank size={16} className="text-[#F4B942]" /> Aportar em Investimentos
                      </span>
                      <p className="text-xs text-[#68736C] mt-0.5">
                        Faça seu patrimônio render juros compostos.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDestination('next_month_balance')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      destination === 'next_month_balance'
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'next_month_balance'}
                      onChange={() => setDestination('next_month_balance')}
                      className="mt-1 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#0D3B22] flex items-center gap-1.5">
                        <Wallet size={16} className="text-[#68736C]" /> Manter na conta para o próximo mês
                      </span>
                      <p className="text-xs text-[#68736C] mt-0.5">
                        O saldo restante será considerado no início do mês seguinte.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-3 border-t border-[#DDE8E0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] rounded-xl"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishClosing}
                    className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
                  >
                    Finalizar Fechamento
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
