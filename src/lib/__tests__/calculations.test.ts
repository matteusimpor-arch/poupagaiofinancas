import {
  computeAccountStatus,
  calculateInstallmentSummary,
  calculateGoalMetrics,
  calculateMonthlyBalance,
  evaluateMonthClosing,
  formatCurrency,
  parseCurrency,
} from '../calculations';
import { Transaction, Installment, Goal, GoalMovement } from '../../types';

describe('Poupagaio Calculations & Financial Rules', () => {
  // Teste 1: Máscara e parse monetário
  test('Moeda brasileira: formatação e parse de R$', () => {
    expect(formatCurrency(1250.9)).toBe('R$\u00A01.250,90');
    expect(parseCurrency('R$ 1.250,90')).toBe(1250.9);
    expect(parseCurrency('R$ 0,00')).toBe(0);
  });

  // Teste 2: Status por vencimento (Seção 13)
  test('Status automáticos por vencimento', () => {
    const today = new Date(2026, 8, 14); // 2026-09-14
    
    // Pago
    expect(computeAccountStatus('2026-09-14', '2026-09-14', false, false, 3, today)).toBe('paid');
    
    // Cancelado
    expect(computeAccountStatus('2026-09-14', undefined, true, false, 3, today)).toBe('cancelled');
    
    // Vence hoje
    expect(computeAccountStatus('2026-09-14', undefined, false, false, 3, today)).toBe('due_today');
    
    // Vence em breve (faltam 2 dias, alertDays = 3)
    expect(computeAccountStatus('2026-09-16', undefined, false, false, 3, today)).toBe('due_soon');
    
    // Pendente (faltam 10 dias, alertDays = 3)
    expect(computeAccountStatus('2026-09-24', undefined, false, false, 3, today)).toBe('pending');
    
    // Atrasado (venceu ontem)
    expect(computeAccountStatus('2026-09-13', undefined, false, false, 3, today)).toBe('overdue');
  });

  // Teste 3: Parcelamentos (Seção 14)
  test('Cálculo de parcelamentos', () => {
    const totalAmount = 1200;
    const count = 3;
    const mockInstallments: Installment[] = [
      {
        id: '1',
        space_id: 'space-1',
        purchase_id: 'p-1',
        purchase_description: 'Notebook',
        installment_number: 1,
        total_installments: 3,
        amount: 400,
        due_date: '2026-09-10',
        reference_month: '2026-09',
        status: 'paid',
        paid_date: '2026-09-08',
      },
      {
        id: '2',
        space_id: 'space-1',
        purchase_id: 'p-1',
        purchase_description: 'Notebook',
        installment_number: 2,
        total_installments: 3,
        amount: 400,
        due_date: '2026-10-10',
        reference_month: '2026-10',
        status: 'pending',
      },
      {
        id: '3',
        space_id: 'space-1',
        purchase_id: 'p-1',
        purchase_description: 'Notebook',
        installment_number: 3,
        total_installments: 3,
        amount: 400,
        due_date: '2026-11-10',
        reference_month: '2026-11',
        status: 'pending',
      },
    ];

    const summary = calculateInstallmentSummary(totalAmount, count, mockInstallments);
    expect(summary.installmentAmount).toBe(400);
    expect(summary.paidCount).toBe(1);
    expect(summary.remainingCount).toBe(2);
    expect(summary.amountPaid).toBe(400);
    expect(summary.remainingDebt).toBe(800);
    expect(summary.nextDueDate).toBe('2026-10-10');
    expect(summary.completionDate).toBe('2026-11-10');
  });

  // Teste 4: Saldo das Metas e Retiradas (Seção 17)
  test('Saldo das metas: depósitos menos retiradas', () => {
    const goal: Goal = {
      id: 'g-1',
      space_id: 'space-1',
      name: 'Reserva de Emergência',
      target_amount: 10000,
      saved_amount: 0,
      monthly_target: 1000,
      priority: 'high',
      status: 'active',
      created_at: '2026-01-01',
    };

    const movements: GoalMovement[] = [
      {
        id: 'm-1',
        goal_id: 'g-1',
        space_id: 'space-1',
        date: '2026-09-01',
        type: 'deposit',
        amount: 2000,
        previous_balance: 0,
        new_balance: 2000,
        created_at: '2026-09-01',
      },
      {
        id: 'm-2',
        goal_id: 'g-1',
        space_id: 'space-1',
        date: '2026-09-05',
        type: 'withdraw',
        amount: 500,
        previous_balance: 2000,
        new_balance: 1500,
        reason: 'Manutenção do carro',
        created_at: '2026-09-05',
      },
    ];

    const metrics = calculateGoalMetrics(goal, movements);
    expect(metrics.deposits).toBe(2000);
    expect(metrics.withdrawals).toBe(500);
    expect(metrics.currentSaved).toBe(1500);
    expect(metrics.remaining).toBe(8500);
    expect(metrics.percentage).toBe(15);
  });

  // Teste 5: Saldo Mensal (Seção 24)
  test('Saldo Mensal: entradas recebidas - gastos pagos - metas guardadas + retiradas', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        space_id: 's-1',
        description: 'Salário',
        amount: 6000,
        type: 'income',
        due_date: '2026-09-05',
        payment_date: '2026-09-05',
        reference_month: '2026-09',
        status: 'paid',
        is_recurring: true,
        created_at: '2026-09-01',
      },
      {
        id: 't-2',
        space_id: 's-1',
        description: 'Aluguel',
        amount: 2000,
        type: 'expense_fixed',
        due_date: '2026-09-10',
        payment_date: '2026-09-10',
        reference_month: '2026-09',
        status: 'paid',
        is_recurring: true,
        created_at: '2026-09-01',
      },
      {
        id: 't-3',
        space_id: 's-1',
        description: 'Mercado',
        amount: 800,
        type: 'expense_variable',
        due_date: '2026-09-12',
        payment_date: '2026-09-12',
        reference_month: '2026-09',
        status: 'paid',
        is_recurring: false,
        created_at: '2026-09-01',
      },
    ];

    const mockInstallments: Installment[] = [
      {
        id: 'i-1',
        space_id: 's-1',
        purchase_id: 'p-1',
        purchase_description: 'Geladeira 1/10',
        installment_number: 1,
        total_installments: 10,
        amount: 300,
        due_date: '2026-09-15',
        reference_month: '2026-09',
        status: 'paid',
      },
    ];

    const mockGoalMovements: GoalMovement[] = [
      {
        id: 'gm-1',
        goal_id: 'g-1',
        space_id: 's-1',
        date: '2026-09-06',
        type: 'deposit',
        amount: 500,
        previous_balance: 0,
        new_balance: 500,
        created_at: '2026-09-06',
      },
    ];

    const balance = calculateMonthlyBalance({
      transactions: mockTransactions,
      installments: mockInstallments,
      investments: [],
      goalMovements: mockGoalMovements,
      referenceMonth: '2026-09',
    });

    // 6000 (entradas recebidas)
    // - 2000 (aluguel)
    // - 800 (mercado)
    // - 300 (parcela geladeira)
    // - 500 (guardado na meta)
    // = 2400
    expect(balance.incomeReceived).toBe(6000);
    expect(balance.totalExpensesPaid).toBe(3100);
    expect(balance.goalsDeposited).toBe(500);
    expect(balance.availableBalance).toBe(2400);
  });

  // Teste 6: Fechamento do Mês (Seção 19)
  test('Fechamento do Mês: classificação meta alcançada', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        space_id: 's-1',
        description: 'Salário',
        amount: 6000,
        type: 'income',
        due_date: '2026-09-05',
        payment_date: '2026-09-05',
        reference_month: '2026-09',
        status: 'paid',
        category_id: 'cat-salario',
        is_recurring: true,
        created_at: '2026-09-01',
      },
      {
        id: 't-2',
        space_id: 's-1',
        description: 'Despesa Quitada',
        amount: 2500,
        type: 'expense_fixed',
        due_date: '2026-09-10',
        payment_date: '2026-09-10',
        reference_month: '2026-09',
        status: 'paid',
        category_id: 'cat-moradia',
        is_recurring: true,
        created_at: '2026-09-01',
      },
    ];

    const result = evaluateMonthClosing({
      transactions: mockTransactions,
      installments: [],
      monthlyPlan: {
        id: 'plan-1',
        space_id: 's-1',
        reference_month: '2026-09',
        expected_income: 6000,
        spending_limit: 3000,
        target_to_save: 500,
        target_to_invest: 500,
      },
      goalsDeposited: 500,
      investedAmount: 500,
      referenceMonth: '2026-09',
      isSharedSpace: true,
    });

    expect(result.allBillsPaid).toBe(true);
    expect(result.spendingLimitRespected).toBe(true);
    expect(result.saveGoalMet).toBe(true);
    expect(result.investGoalMet).toBe(true);
    expect(result.classification).toBe('goal_achieved');
    expect(result.mascotMessage).toContain('Mandaram bem demais!');
  });
});
