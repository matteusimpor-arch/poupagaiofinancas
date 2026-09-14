import React, { useState } from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYearBR } from '../../lib/calculations';
import { MoneyInput } from '../common/MoneyInput';

export const PlanningView: React.FC = () => {
  const { currentSpace, selectedMonth, categories, transactions, monthlyPlans, saveMonthlyPlan } =
    useFinance();

  const [isEditing, setIsEditing] = useState(false);

  // Buscar plano atual ou criar valores padrão
  const currentPlan = monthlyPlans.find(
    (p) => p.space_id === currentSpace?.id && p.reference_month === selectedMonth
  );

  const [incomeExpected, setIncomeExpected] = useState<number>(() => currentPlan?.income_expected || 14000);
  const [expenseBudget, setExpenseBudget] = useState<number>(() => currentPlan?.expense_budget || 8500);
  const [savingsTarget, setSavingsTarget] = useState<number>(() => currentPlan?.savings_target || 3500);

  // Mapear gastos reais por categoria no mês atual
  const actualByCategory: Record<string, number> = {};
  let totalActualExpenses = 0;

  transactions
    .filter(
      (t) =>
        (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
        t.due_date.startsWith(selectedMonth)
    )
    .forEach((t) => {
      const catId = t.category_id || 'outros';
      actualByCategory[catId] = (actualByCategory[catId] || 0) + t.amount;
      totalActualExpenses += t.amount;
    });

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Limites por categoria do plano atual
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    return (
      currentPlan?.category_budgets || {
        'cat-exp-moradia': 2400,
        'cat-exp-mercado': 1800,
        'cat-exp-transporte': 800,
        'cat-exp-saude': 600,
        'cat-exp-lazer': 800,
        'cat-exp-educacao': 500,
        'cat-exp-compras': 700,
      }
    );
  });

  const handleSave = () => {
    saveMonthlyPlan({
      reference_month: selectedMonth,
      expected_income: incomeExpected,
      spending_limit: expenseBudget,
      target_to_save: savingsTarget,
      target_to_invest: 0,
      income_expected: incomeExpected,
      expense_budget: expenseBudget,
      savings_target: savingsTarget,
      category_budgets: categoryBudgets,
    });
    setIsEditing(false);
  };

  const overallProgress = Math.min(100, Math.round((totalActualExpenses / (expenseBudget || 1)) * 100));

  return (
    <div id="planning-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Planejamento Mensal</h2>
          <p className="text-xs text-[#68736C]">
            Defina e acompanhe tetos de gastos para {formatMonthYearBR(selectedMonth)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs ${
            isEditing
              ? 'bg-[#22C55E] text-white hover:bg-[#16a34a]'
              : 'bg-white text-[#0D3B22] border border-[#DDE8E0] hover:bg-[#F6FAF7]'
          }`}
        >
          <Edit3 size={15} />
          <span>{isEditing ? 'Salvar Metas e Limites' : 'Ajustar Limites'}</span>
        </button>
      </div>

      {/* Cards de Metas Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Teto de Gastos */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Teto Global de Gastos
          </span>
          <div className="mt-2">
            {isEditing ? (
              <MoneyInput value={expenseBudget} onChange={setExpenseBudget} />
            ) : (
              <h3 className="text-2xl font-black text-[#0D3B22]">{formatCurrency(expenseBudget)}</h3>
            )}
            <div className="flex items-center justify-between text-xs text-[#68736C] mt-2">
              <span>Gasto realizado:</span>
              <span className="font-bold text-[#18201B]">{formatCurrency(totalActualExpenses)}</span>
            </div>
            {/* Barra de Progresso Global */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallProgress > 100
                    ? 'bg-[#EF5350]'
                    : overallProgress > 80
                    ? 'bg-[#F4B942]'
                    : 'bg-[#22C55E]'
                }`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expectativa de Renda */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Entradas Previstas
          </span>
          <div className="mt-2">
            {isEditing ? (
              <MoneyInput value={incomeExpected} onChange={setIncomeExpected} />
            ) : (
              <h3 className="text-2xl font-black text-[#22C55E]">{formatCurrency(incomeExpected)}</h3>
            )}
            <p className="text-xs text-[#68736C] mt-2">
              Previsão de salários e receitas para este período.
            </p>
          </div>
        </div>

        {/* Meta de Poupança */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Meta de Sobra / Poupança
          </span>
          <div className="mt-2">
            {isEditing ? (
              <MoneyInput value={savingsTarget} onChange={setSavingsTarget} />
            ) : (
              <h3 className="text-2xl font-black text-[#06B6D4]">{formatCurrency(savingsTarget)}</h3>
            )}
            <p className="text-xs text-[#68736C] mt-2">
              Valor pretendido para reserva e metas ao fechar o mês.
            </p>
          </div>
        </div>
      </div>

      {/* Tetos por Categoria: Planejado vs Realizado */}
      <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#0D3B22]">Limites por Categoria</h3>
          <p className="text-xs text-[#68736C]">
            Acompanhe o consumo do orçamento em cada área de despesas
          </p>
        </div>

        <div className="space-y-4 divide-y divide-[#DDE8E0]/60">
          {expenseCategories.map((cat) => {
            const budget = categoryBudgets[cat.id] || 0;
            const actual = actualByCategory[cat.id] || 0;
            const pct = budget > 0 ? Math.round((actual / budget) * 100) : actual > 0 ? 100 : 0;

            // Regra Seção 14:
            // Verde: até 80%
            // Amarelo: 80% a 100%
            // Vermelho: acima de 100%
            const colorClass =
              pct > 100
                ? 'bg-[#EF5350] text-red-600'
                : pct >= 80
                ? 'bg-[#F4B942] text-amber-600'
                : 'bg-[#22C55E] text-emerald-600';

            const barBg =
              pct > 100 ? 'bg-[#EF5350]' : pct >= 80 ? 'bg-[#F4B942]' : 'bg-[#22C55E]';

            return (
              <div key={cat.id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0D3B22] text-sm">{cat.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pct > 100
                          ? 'bg-red-100 text-red-700'
                          : pct >= 80
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {pct}% do limite
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#68736C]">
                      Gasto: <strong className="text-[#18201B]">{formatCurrency(actual)}</strong>
                    </span>
                    <span className="text-[#68736C]">/</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#68736C]">Limite:</span>
                      {isEditing ? (
                        <div className="w-28">
                          <MoneyInput
                            value={budget}
                            onChange={(val) =>
                              setCategoryBudgets((prev) => ({ ...prev, [cat.id]: val }))
                            }
                          />
                        </div>
                      ) : (
                        <strong className="text-[#0D3B22]">{formatCurrency(budget)}</strong>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso com Transição Suave */}
                <div className="w-full bg-[#F6FAF7] border border-[#DDE8E0] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barBg}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
