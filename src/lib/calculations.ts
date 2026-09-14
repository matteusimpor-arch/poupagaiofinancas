import {
  AccountStatus,
  StatusMeta,
  Transaction,
  Installment,
  Goal,
  GoalMovement,
  Investment,
  MonthlyPlan,
  MonthlyClosing,
  MonthClassification,
} from '../types';

/**
 * Formata um número para moeda brasileira (Real - BRL)
 * Exemplo: 1250.9 -> "R$ 1.250,90"
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte string formatada monetária brasileira para número
 * Exemplo: "R$ 1.250,90" -> 1250.90
 */
export function parseCurrency(input: string): number {
  if (!input) return 0;
  // Remove "R$", espaços e pontos de milhar, troca vírgula por ponto
  const clean = input
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA a partir de YYYY-MM-DD
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

/**
 * Converte data DD/MM/AAAA para YYYY-MM-DD
 */
export function parseDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * Retorna o mês e ano por extenso em português
 * Exemplo: "2026-09" -> "Setembro de 2026"
 */
export function formatMonthYearBR(refMonth: string): string {
  if (!refMonth) return '';
  const [yearStr, monthStr] = refMonth.split('-');
  const monthNum = parseInt(monthStr, 10) - 1;
  const yearNum = parseInt(yearStr, 10);
  const date = new Date(yearNum, monthNum, 1);
  const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Metadados completos para cada status de conta
 * Garante que NENHUM status dependa apenas de cor:
 * Todos possuem Cor, Texto, Ícone, Etiqueta acessível e Descrição para leitores de tela.
 */
export const STATUS_METAS: Record<AccountStatus, StatusMeta> = {
  paid: {
    status: 'paid',
    label: 'Pago',
    color: '#22C55E',
    bgLight: '#DCFCE7',
    borderColor: '#86EFAC',
    iconName: 'CheckCircle2',
    ariaLabel: 'Status da conta: Pago',
    screenReaderDescription: 'Pagamento confirmado e liquidado.',
  },
  due_soon: {
    status: 'due_soon',
    label: 'Vence em breve',
    color: '#EAB308',
    bgLight: '#FEF9C3',
    borderColor: '#FDE047',
    iconName: 'Clock',
    ariaLabel: 'Status da conta: Vence em breve',
    screenReaderDescription: 'Atenção: esta conta vence nos próximos dias.',
  },
  due_today: {
    status: 'due_today',
    label: 'Vence hoje',
    color: '#F97316',
    bgLight: '#FFEDD5',
    borderColor: '#FDBA74',
    iconName: 'AlertCircle',
    ariaLabel: 'Status da conta: Vence hoje',
    screenReaderDescription: 'Atenção urgente: esta conta tem vencimento no dia de hoje.',
  },
  overdue: {
    status: 'overdue',
    label: 'Atrasado',
    color: '#EF4444',
    bgLight: '#FEE2E2',
    borderColor: '#FCA5A5',
    iconName: 'AlertTriangle',
    ariaLabel: 'Status da conta: Atrasada',
    screenReaderDescription: 'Alerta crítico: esta conta está vencida e não foi paga.',
  },
  pending: {
    status: 'pending',
    label: 'Pendente',
    color: '#3B82F6',
    bgLight: '#DBEAFE',
    borderColor: '#93C5FD',
    iconName: 'Calendar',
    ariaLabel: 'Status da conta: Pendente',
    screenReaderDescription: 'Conta em aberto com prazo de vencimento regular.',
  },
  scheduled: {
    status: 'scheduled',
    label: 'Agendado',
    color: '#06B6D4',
    bgLight: '#CFFAFE',
    borderColor: '#67E8F9',
    iconName: 'CalendarClock',
    ariaLabel: 'Status da conta: Agendado',
    screenReaderDescription: 'Pagamento programado no banco ou agendado no sistema.',
  },
  cancelled: {
    status: 'cancelled',
    label: 'Cancelado',
    color: '#94A3B8',
    bgLight: '#F1F5F9',
    borderColor: '#CBD5E1',
    iconName: 'XCircle',
    ariaLabel: 'Status da conta: Cancelado',
    screenReaderDescription: 'Lançamento cancelado ou desconsiderado.',
  },
};

/**
 * Determina o status automático de um lançamento
 * Conforme Seção 13:
 * - Pagamento confirmado: Pago
 * - Cancelado: Cancelado
 * - Pagamento programado: Agendado
 * - Data vencida sem pagamento: Atrasado
 * - Vencimento no dia atual: Vence hoje
 * - Faltam até alertDays (3, 5 ou 7): Vence em breve
 * - Mais de alertDays: Pendente
 */
export function computeAccountStatus(
  dueDate: string,
  paidDate?: string,
  isCancelled: boolean = false,
  isScheduled: boolean = false,
  alertDays: 3 | 5 | 7 = 3,
  referenceDate: Date = new Date()
): AccountStatus {
  if (isCancelled) return 'cancelled';
  if (paidDate) return 'paid';
  if (isScheduled) return 'scheduled';

  const todayStr = referenceDate.toISOString().slice(0, 10);
  if (dueDate === todayStr) return 'due_today';

  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [dY, dM, dD] = dueDate.split('-').map(Number);

  const todayTime = new Date(tY, tM - 1, tD).getTime();
  const dueTime = new Date(dY, dM - 1, dD).getTime();

  const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  } else if (diffDays <= alertDays) {
    return 'due_soon';
  } else {
    return 'pending';
  }
}

/**
 * Cálculo do Saldo Mensal Conforme Seção 24:
 * Entradas recebidas
 * menos gastos pagos (fixos e variáveis)
 * menos parcelas pagas do mês
 * menos investimentos realizados no mês
 * menos valores guardados em metas no mês
 * mais retiradas das metas destinadas ao saldo no mês
 */
export function calculateMonthlyBalance(params: {
  transactions: Transaction[];
  installments: Installment[];
  investments: Investment[];
  goalMovements: GoalMovement[];
  referenceMonth: string;
  investedAmount?: number;
}) {
  const { transactions, installments, goalMovements, referenceMonth, investedAmount } = params;

  // Filtrar apenas do mês de referência
  const monthTransactions = transactions.filter((t) => t.reference_month === referenceMonth);
  const monthInstallments = installments.filter((i) => i.reference_month === referenceMonth);
  const monthGoalMovements = goalMovements.filter((gm) =>
    gm.date.startsWith(referenceMonth)
  );

  // 1. Entradas recebidas
  const incomeReceived = monthTransactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  // Entradas previstas (total do mês para planejamento)
  const incomeTotal = monthTransactions
    .filter((t) => t.type === 'income' && t.status !== 'cancelled')
    .reduce((acc, t) => acc + t.amount, 0);

  // 2. Gastos pagos (fixos e variáveis)
  const expensesPaid = monthTransactions
    .filter(
      (t) =>
        (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
        t.status === 'paid'
    )
    .reduce((acc, t) => acc + t.amount, 0);

  // Gastos totais do mês (planejados/lançados)
  const expensesTotal = monthTransactions
    .filter(
      (t) =>
        (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
        t.status !== 'cancelled'
    )
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. Parcelas pagas do mês
  const installmentsPaid = monthInstallments
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.amount, 0);

  const installmentsTotal = monthInstallments
    .filter((i) => i.status !== 'cancelled')
    .reduce((acc, i) => acc + i.amount, 0);

  // Total de gastos pagos (despesas diretas + parcelas pagas)
  const totalExpensesPaid = expensesPaid + installmentsPaid;
  const totalExpensesMonthly = expensesTotal + installmentsTotal;

  // 4. Guardado em metas no mês (depósitos)
  const goalsDeposited = monthGoalMovements
    .filter((gm) => gm.type === 'deposit')
    .reduce((acc, gm) => acc + gm.amount, 0);

  // 5. Retiradas das metas destinadas ao saldo no mês
  const goalsWithdrawn = monthGoalMovements
    .filter((gm) => gm.type === 'withdraw')
    .reduce((acc, gm) => acc + gm.amount, 0);

  // 6. Investimentos realizados no mês
  const investedThisMonth = investedAmount || 0;

  // Saldo disponível líquido daquele mês
  const availableBalance =
    incomeReceived -
    totalExpensesPaid -
    investedThisMonth -
    goalsDeposited +
    goalsWithdrawn;

  return {
    incomeReceived,
    incomeTotal,
    totalIncome: incomeTotal,
    totalExpensesPaid,
    totalExpensesMonthly,
    totalExpenses: totalExpensesMonthly,
    expensesPaid,
    expensesPending: Math.max(0, totalExpensesMonthly - totalExpensesPaid),
    totalFixedExpenses: monthTransactions
      .filter((t) => t.type === 'expense_fixed' && t.status !== 'cancelled')
      .reduce((acc, t) => acc + t.amount, 0),
    totalVariableExpenses: monthTransactions
      .filter((t) => t.type === 'expense_variable' && t.status !== 'cancelled')
      .reduce((acc, t) => acc + t.amount, 0),
    totalInstallmentsAmount: installmentsTotal,
    installmentsPaid,
    goalsDeposited,
    goalsWithdrawn,
    investedThisMonth,
    availableBalance,
  };
}

/**
 * Cálculo de Parcelamentos Conforme Seção 14
 */
export function calculateInstallmentSummary(
  totalAmount: number,
  installmentsCount: number,
  installments: Installment[]
) {
  const installmentAmount = Math.round((totalAmount / installmentsCount) * 100) / 100;
  const paidInstallments = installments.filter((i) => i.status === 'paid');
  const paidCount = paidInstallments.length;
  const remainingCount = Math.max(0, installmentsCount - paidCount);

  const amountPaid = paidInstallments.reduce((acc, i) => acc + i.amount, 0);
  const remainingDebt = Math.max(0, totalAmount - amountPaid);

  // Próximo vencimento (primeira parcela não paga)
  const pendingInstallments = installments
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const nextDueDate = pendingInstallments.length > 0 ? pendingInstallments[0].due_date : undefined;

  // Data prevista para conclusão (vencimento da última parcela)
  const lastInstallment = [...installments].sort((a, b) =>
    a.installment_number - b.installment_number
  ).pop();
  const completionDate = lastInstallment ? lastInstallment.due_date : undefined;

  return {
    installmentAmount,
    paidCount,
    remainingCount,
    amountPaid,
    remainingDebt,
    nextDueDate,
    completionDate,
  };
}

/**
 * Cálculo de Metas Conforme Seção 17
 */
export function calculateGoalMetrics(goal: Goal, movements: GoalMovement[]) {
  const goalMovements = movements.filter((m) => m.goal_id === goal.id);

  // Saldo = depósitos menos retiradas
  const deposits = goalMovements
    .filter((m) => m.type === 'deposit')
    .reduce((acc, m) => acc + m.amount, 0);

  const withdrawals = goalMovements
    .filter((m) => m.type === 'withdraw')
    .reduce((acc, m) => acc + m.amount, 0);

  const currentSaved = Math.max(0, deposits - withdrawals);
  const target = goal.target_amount;
  const remaining = Math.max(0, target - currentSaved);
  const percentage = target > 0 ? Math.min(100, Math.round((currentSaved / target) * 100)) : 0;

  return {
    deposits,
    withdrawals,
    currentSaved,
    remaining,
    percentage,
  };
}

/**
 * Verificações e Classificação do Fechamento do Mês Conforme Seção 19
 */
export function evaluateMonthClosing(params: {
  transactions: Transaction[];
  installments: Installment[];
  monthlyPlan?: MonthlyPlan;
  goalsDeposited: number;
  investedAmount: number;
  referenceMonth: string;
  isSharedSpace: boolean;
}) {
  const {
    transactions,
    installments,
    monthlyPlan,
    goalsDeposited,
    investedAmount,
    referenceMonth,
    isSharedSpace,
  } = params;

  const monthTransactions = transactions.filter((t) => t.reference_month === referenceMonth);
  const monthInstallments = installments.filter((i) => i.reference_month === referenceMonth);

  // Verificações
  const unpaidExpenses = monthTransactions.filter(
    (t) =>
      (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
      t.status !== 'paid' &&
      t.status !== 'cancelled'
  );

  const unpaidInstallments = monthInstallments.filter(
    (i) => i.status !== 'paid' && i.status !== 'cancelled'
  );

  const overdueItems = [
    ...monthTransactions.filter((t) => t.status === 'overdue'),
    ...monthInstallments.filter((i) => i.status === 'overdue'),
  ];

  const pendingItems = [
    ...monthTransactions.filter((t) => t.status === 'pending' || t.status === 'due_soon'),
    ...monthInstallments.filter((i) => i.status === 'pending' || i.status === 'due_soon'),
  ];

  const uncategorizedItems = monthTransactions.filter(
    (t) => !t.category_id && t.status !== 'cancelled'
  );

  const allBillsPaid = unpaidExpenses.length === 0 && unpaidInstallments.length === 0;

  // Comparação com o plano
  const actualIncome = monthTransactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const actualExpenses =
    monthTransactions
      .filter(
        (t) =>
          (t.type === 'expense_fixed' || t.type === 'expense_variable') &&
          t.status === 'paid'
      )
      .reduce((acc, t) => acc + t.amount, 0) +
    monthInstallments
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + i.amount, 0);

  const spendingLimit = monthlyPlan?.spending_limit || 0;
  const spendingLimitRespected = spendingLimit > 0 ? actualExpenses <= spendingLimit : true;

  const plannedSave = monthlyPlan?.target_to_save || 0;
  const saveGoalMet = plannedSave > 0 ? goalsDeposited >= plannedSave : true;

  const plannedInvest = monthlyPlan?.target_to_invest || 0;
  const investGoalMet = plannedInvest > 0 ? investedAmount >= plannedInvest : true;

  const finalBalance = actualIncome - actualExpenses - goalsDeposited - investedAmount;

  // Classificação do mês
  let classification: MonthClassification = 'goal_achieved';

  if (!allBillsPaid || overdueItems.length > 0 || !spendingLimitRespected || finalBalance < 0) {
    classification = 'out_of_target';
  } else if (!saveGoalMet || !investGoalMet) {
    classification = 'partially_achieved';
  } else {
    classification = 'goal_achieved';
  }

  // Mensagem do Mascote Poupagaio conforme Seção 19
  let mascotMessage = '';
  if (classification === 'goal_achieved') {
    mascotMessage = isSharedSpace
      ? 'Mandaram bem demais! Todas as contas foram pagas e vocês terminaram o mês voando alto dentro da meta!'
      : 'Mandou bem demais! Todas as suas contas foram pagas e você terminou o mês com saldo positivo e metas cumpridas!';
  } else if (classification === 'partially_achieved') {
    mascotMessage = isSharedSpace
      ? 'Parabéns pela disciplina! As contas estão quitadas, embora nem todas as reservas tenham atingido a meta completa. No próximo mês decolamos ainda mais!'
      : 'Boa jornada! Suas contas essenciais foram quitadas com sucesso. Com pequenos ajustes, mês que vem suas reservas atingem a meta cheia!';
  } else {
    mascotMessage = isSharedSpace
      ? 'Atenção aos ventos! Temos contas em aberto ou o orçamento foi ultrapassado. Vamos juntos colocar a casa em ordem para o próximo mês!'
      : 'Atenção aos ventos! O limite de gastos oscilou ou há contas pendentes. Respire fundo, organize os passos e vamos retomar o voo firme!';
  }

  return {
    allBillsPaid,
    unpaidCount: unpaidExpenses.length + unpaidInstallments.length,
    overdueCount: overdueItems.length,
    pendingCount: pendingItems.length,
    uncategorizedCount: uncategorizedItems.length,
    budgetPlanned: spendingLimit > 0,
    plannedSpendingLimit: spendingLimit,
    plannedSave,
    plannedInvest,
    spendingLimitRespected,
    saveGoalMet,
    investGoalMet,
    actualIncome,
    actualExpenses,
    finalBalance,
    classification,
    mascotMessage,
  };
}
