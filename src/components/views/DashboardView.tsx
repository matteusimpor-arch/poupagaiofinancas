import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
  CreditCard,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import {
  calculateMonthlyBalance,
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
} from '../../lib/calculations';
import { StatusBadge } from '../common/StatusBadge';
import { MascotMessage } from '../common/MascotMessage';
import { QuickPayModal, QuickPayItem } from '../modals/QuickPayModal';
import { AccountStatus } from '../../types';

interface DashboardViewProps {
  onOpenQuickAdd: () => void;
  onOpenTransactionModal: (tx?: any) => void;
  onOpenClosingModal: () => void;
  onOpenReopenModal: (month: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickAdd,
  onOpenTransactionModal,
  onOpenClosingModal,
  onOpenReopenModal,
  onNavigateTab,
}) => {
  const {
    currentSpace,
    selectedMonth,
    transactions,
    installments,
    investments,
    goals,
    goalMovements,
    monthlyPlans,
    monthlyClosings,
    markTransactionAsPaid,
    payInstallment,
  } = useFinance();

  const [quickPayItem, setQuickPayItem] = useState<QuickPayItem | null>(null);

  // Handler de pagamento rápido
  const handleConfirmQuickPay = (
    id: string,
    type: 'transaction' | 'installment',
    paidDate: string,
    paidAmount: number,
    updateFutureRecurring?: boolean
  ) => {
    if (type === 'transaction') {
      markTransactionAsPaid(id, paidDate, paidAmount, updateFutureRecurring);
    } else {
      payInstallment(id, paidDate, paidAmount);
    }
  };

  // Calcular totais e saldos financeiros segundo a regra central de calculations.ts
  const currentPlan = monthlyPlans.find(
    (p) => p.space_id === currentSpace?.id && p.reference_month === selectedMonth
  );

  const depositedToGoalsThisMonth = goalMovements
    .filter(
      (gm) =>
        gm.space_id === currentSpace?.id &&
        gm.date.startsWith(selectedMonth) &&
        gm.type === 'deposit'
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const withdrawnFromGoalsThisMonth = goalMovements
    .filter(
      (gm) =>
        gm.space_id === currentSpace?.id &&
        gm.date.startsWith(selectedMonth) &&
        gm.type === 'withdraw'
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const totalInvestmentsBalance = investments.reduce((sum, i) => sum + i.current_amount, 0);

  const balance = calculateMonthlyBalance({
    transactions,
    installments,
    investments,
    goalMovements,
    referenceMonth: selectedMonth,
  });

  // Fechamento do mês atual (se existir)
  const activeClosing = monthlyClosings.find(
    (c) => c.space_id === currentSpace?.id && c.reference_month === selectedMonth
  );

  // Próximas contas a vencer ou atrasadas (incluindo despesas fixas, variáveis e parcelas)
  const pendingTransactions: {
    id: string;
    type: 'transaction' | 'installment';
    description: string;
    amount: number;
    due_date: string;
    status: AccountStatus;
    isRecurring?: boolean;
  }[] = [
    ...transactions
      .filter((t) => t.status !== 'paid' && t.status !== 'cancelled' && t.type !== 'income')
      .map((t) => ({
        id: t.id,
        type: 'transaction' as const,
        description: t.description,
        amount: t.amount,
        due_date: t.due_date,
        status: t.status,
        isRecurring: t.is_recurring,
      })),
    ...installments
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.reference_month === selectedMonth)
      .map((i) => ({
        id: i.id,
        type: 'installment' as const,
        description: `${i.purchase_description || 'Parcela'} (${i.installment_number}/${i.total_installments})`,
        amount: i.amount,
        due_date: i.due_date,
        status: i.status,
      })),
  ]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6);

  // Dados para Gráfico de Barras (Receitas vs Despesas)
  const barChartData = [
    { name: 'Entradas', valor: balance.totalIncome, fill: '#22C55E' },
    { name: 'Gastos Fixos', valor: balance.totalFixedExpenses, fill: '#EF5350' },
    { name: 'Gastos Variáveis', valor: balance.totalVariableExpenses, fill: '#F97316' },
    { name: 'Parcelas', valor: balance.totalInstallmentsAmount, fill: '#F4B942' },
  ];

  // Dados para Gráfico de Pizza (Categorias de Gastos)
  const categoryExpensesMap: Record<string, number> = {};
  transactions
    .filter(
      (t) =>
        (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
        t.due_date.startsWith(selectedMonth)
    )
    .forEach((t) => {
      const catName = t.category?.name || 'Outros';
      categoryExpensesMap[catName] = (categoryExpensesMap[catName] || 0) + t.amount;
    });

  const pieChartData = Object.entries(categoryExpensesMap).map(([name, value]) => ({
    name,
    value,
  }));

  const PIE_COLORS = ['#EF5350', '#F97316', '#F4B942', '#06B6D4', '#8B5CF6', '#10B981', '#64748B'];

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Mês Fechado (se aplicável) */}
      {activeClosing && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Mês de {formatMonthYearBR(selectedMonth)} está consolidado e fechado
              </h4>
              <p className="text-xs text-emerald-700">
                Classificação:{' '}
                {activeClosing.classification === 'goal_achieved'
                  ? 'Meta Atingida'
                  : activeClosing.classification === 'partially_achieved'
                  ? 'Parcialmente Atingida'
                  : 'Fora da Meta'}{' '}
                • Saldo Final: {formatCurrency(activeClosing.final_balance)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenReopenModal(selectedMonth)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reabrir Mês</span>
          </button>
        </div>
      )}

      {/* Grid de Cards de Saldo e Resumos Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido Disponível */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
              Saldo Disponível
            </span>
            <div
              className={`p-2 rounded-xl ${
                balance.availableBalance >= 0
                  ? 'bg-emerald-50 text-[#22C55E]'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl lg:text-3xl font-black tracking-tight ${
                balance.availableBalance >= 0 ? 'text-[#0D3B22]' : 'text-[#EF5350]'
              }`}
            >
              {formatCurrency(balance.availableBalance)}
            </h3>
            <span className="text-[11px] font-semibold text-[#68736C] block mt-0.5">
              {formatMonthYearBR(selectedMonth)}
            </span>
          </div>
        </div>

        {/* Total Entradas */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
              Total Entradas
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#22C55E]">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-[#0D3B22]">
              {formatCurrency(balance.totalIncome)}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
              Recebido: {formatCurrency(balance.incomeReceived)}
            </span>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
              Total Gastos
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-[#18201B]">
              {formatCurrency(balance.totalExpenses)}
            </h3>
            <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">
              Pago: {formatCurrency(balance.expensesPaid)} • Falta:{' '}
              {formatCurrency(balance.expensesPending)}
            </span>
          </div>
        </div>

        {/* Investimentos & Metas */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
              Patrimônio Guardado
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-[#0D3B22]">
              {formatCurrency(
                totalInvestmentsBalance + goals.reduce((s, g) => s + g.saved_amount, 0)
              )}
            </h3>
            <span className="text-[11px] font-semibold text-cyan-700 block mt-0.5">
              {goals.length} metas ativas • {investments.length} ativos
            </span>
          </div>
        </div>
      </div>

      {/* Dica Contextual do Mascote Poupagaio */}
      <MascotMessage
        title={currentSpace?.is_shared ? 'Dica para o Casal' : 'Dica do Poupagaio'}
        message={
          balance.availableBalance >= 0
            ? 'Tudo sob controle! As contas estão equilibradas e sobra margem para investir ou alimentar suas metas.'
            : 'Atenção aos gastos deste mês. Vale a pena revisar as despesas variáveis para recuperar o fôlego financeiro.'
        }
        mood={balance.availableBalance >= 0 ? 'celebrate' : 'alert'}
      />

      {/* Seção Central: Gráficos e Próximos Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras: Comparativo do Mês */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0D3B22]">Fluxo do Mês</h3>
              <p className="text-xs text-[#68736C]">Entradas vs Categorias de despesa</p>
            </div>
            {!activeClosing && (
              <button
                type="button"
                onClick={onOpenClosingModal}
                className="px-3 py-1.5 text-xs font-bold text-[#22C55E] bg-[#DCFCE7] hover:bg-[#bbf7d0] rounded-xl transition-colors shadow-2xs"
              >
                Fechar Mês
              </button>
            )}
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#68736C' }} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#68736C' }}
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #DDE8E0',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Próximos Vencimentos */}
        <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0D3B22]">Próximos Vencimentos</h3>
              <p className="text-xs text-[#68736C]">Contas a pagar em breve</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('movimentacoes')}
              className="text-xs font-bold text-[#22C55E] hover:underline flex items-center gap-0.5"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
            {pendingTransactions.length === 0 ? (
              <div className="py-8 text-center text-[#68736C] space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-[#22C55E]" />
                <p className="text-xs font-bold text-[#0D3B22]">Nenhuma conta pendente!</p>
                <p className="text-[11px]">Você está com todas as contas em dia.</p>
              </div>
            ) : (
              pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl border border-[#DDE8E0] bg-[#F6FAF7] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#18201B] truncate">{tx.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-[#68736C]">
                        {formatDateBR(tx.due_date)}
                      </span>
                      <StatusBadge status={tx.status} size="sm" />
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-[#18201B]">
                      {formatCurrency(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickPayItem({
                          id: tx.id,
                          type: tx.type,
                          description: tx.description,
                          expectedAmount: tx.amount,
                          dueDate: tx.due_date,
                          isRecurring: tx.isRecurring,
                        })
                      }
                      className="text-[10px] font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] px-2.5 py-1 rounded-md shadow-2xs transition-colors"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seção Inferior: Distribuição de Gastos & Metas Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Categoria (Gráfico Donut) */}
        <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[#0D3B22]">Despesas por Categoria</h3>
            <p className="text-xs text-[#68736C]">Para onde está indo o dinheiro</p>
          </div>

          {pieChartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#68736C]">
              Sem despesas registradas neste mês.
            </div>
          ) : (
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Gasto']}
                    contentStyle={{ borderRadius: 10, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Metas em Destaque */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0D3B22]">Suas Metas Financeiras</h3>
              <p className="text-xs text-[#68736C]">Acompanhe o ritmo de realização</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('metas')}
              className="text-xs font-bold text-[#22C55E] hover:underline flex items-center gap-0.5"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
              return (
                <div
                  key={goal.id}
                  onClick={() => onNavigateTab('metas')}
                  className="p-4 rounded-xl border border-[#DDE8E0] bg-[#F6FAF7] cursor-pointer hover:border-[#22C55E]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#0D3B22] truncate">{goal.name}</span>
                    <span className="text-xs font-black text-[#22C55E]">{pct}%</span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full bg-[#DDE8E0] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#22C55E] h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] font-semibold text-[#68736C]">
                    <span>{formatCurrency(goal.saved_amount)}</span>
                    <span>Alvo: {formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Pagamento Rápido */}
      <QuickPayModal
        isOpen={Boolean(quickPayItem)}
        onClose={() => setQuickPayItem(null)}
        item={quickPayItem}
        onConfirmPay={handleConfirmQuickPay}
      />
    </div>
  );
};
