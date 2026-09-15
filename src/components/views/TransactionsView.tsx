import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle2,
  Trash2,
  Edit2,
  FastForward,
  Layers,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, Installment } from '../../types';
import { formatCurrency, formatDateBR, formatMonthYearBR } from '../../lib/calculations';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { QuickPayModal, QuickPayItem } from '../modals/QuickPayModal';
import { InstallmentActionModal } from '../modals/InstallmentActionModal';

interface TransactionsViewProps {
  onOpenAddTransaction: (type?: any) => void;
  onOpenEditTransaction: (tx: Transaction) => void;
  onOpenAddInstallment: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onOpenEditTransaction,
  onOpenAddInstallment,
}) => {
  const {
    selectedMonth,
    transactions,
    installments,
    installmentPurchases,
    markTransactionAsPaid,
    payInstallment,
    deleteTransaction,
  } = useFinance();

  const [activeTypeTab, setActiveTypeTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  // Sub-aba de parcelamentos: 'month' (parcelas do mês) ou 'overview' (compras ativas completas)
  const [installmentSubTab, setInstallmentSubTab] = useState<'month' | 'overview'>('month');

  // Controle do QuickPayModal
  const [quickPayItem, setQuickPayItem] = useState<QuickPayItem | null>(null);

  // Controle do InstallmentActionModal (edição e exclusão com escopo)
  const [activeInstallmentForAction, setActiveInstallmentForAction] = useState<Installment | null>(null);
  const [installmentActionMode, setInstallmentActionMode] = useState<'edit' | 'delete'>('edit');

  // Filtrar transações pelo mês e filtros de busca/tipo/status
  const filteredTransactions = transactions.filter((tx) => {
    // Mês de referência
    const inMonth = tx.due_date.startsWith(selectedMonth);
    if (!inMonth) return false;

    // Tipo
    if (activeTypeTab === 'income' && tx.type !== 'income') return false;
    if (activeTypeTab === 'expense_fixed' && tx.type !== 'expense_fixed') return false;
    if (activeTypeTab === 'expense_variable' && tx.type !== 'expense_variable') return false;
    if (activeTypeTab === 'installment') return false; // Aba exclusiva de parcelas

    // Status
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Busca textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(term);
      const matchCat = tx.category?.name?.toLowerCase().includes(term);
      const matchResp = tx.responsible_user?.full_name?.toLowerCase().includes(term);
      if (!matchDesc && !matchCat && !matchResp) return false;
    }

    return true;
  });

  // Filtrar parcelas que caem no mês selecionado
  const monthInstallments = installments.filter((inst) => inst.reference_month === selectedMonth);

  // Handler de confirmação de pagamento vindo do QuickPayModal
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

  return (
    <div id="transactions-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Lançamentos e Contas</h2>
          <p className="text-xs text-[#68736C]">
            Movimentações financeiras de {formatMonthYearBR(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAddInstallment}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-bold text-[#0D3B22] bg-white border border-[#DDE8E0] hover:bg-[#F6FAF7] rounded-xl shadow-2xs transition-colors active:scale-95"
          >
            <CreditCard size={15} />
            <span>Novo Parcelamento</span>
          </button>
          <button
            type="button"
            id="btn-add-transaction-view"
            onClick={() => onOpenAddTransaction()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors active:scale-95"
          >
            <Plus size={16} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Abas Superiores de Filtro por Tipo */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F6FAF7] border border-[#DDE8E0] rounded-2xl overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Todos os Lançamentos' },
          { id: 'income', label: 'Entradas' },
          { id: 'expense_fixed', label: 'Gastos Fixos' },
          { id: 'expense_variable', label: 'Gastos Variáveis' },
          { id: 'installment', label: 'Parcelamentos' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTypeTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTypeTab === tab.id
                ? 'bg-white text-[#0D3B22] shadow-xs border border-[#DDE8E0]/70'
                : 'text-[#68736C] hover:text-[#0D3B22]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barra de Filtros e Busca */}
      {activeTypeTab !== 'installment' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, categoria ou responsável..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE8E0] rounded-xl text-xs font-medium text-[#18201B] placeholder-[#68736C]/70 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todos status' },
              { id: 'paid', label: 'Pagos' },
              { id: 'due_soon', label: 'Vencem em breve' },
              { id: 'overdue', label: 'Atrasados' },
              { id: 'pending', label: 'Pendentes' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                  statusFilter === s.id
                    ? 'bg-[#0D3B22] text-white border-[#0D3B22]'
                    : 'bg-white text-[#68736C] border-[#DDE8E0] hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      {activeTypeTab === 'installment' ? (
        <div className="space-y-4">
          {/* Sub-abas de Parcelamento */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Gestão de Parcelamentos
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Total a pagar neste mês:{' '}
                <strong>
                  {formatCurrency(monthInstallments.reduce((s, i) => s + i.amount, 0))}
                </strong>{' '}
                • {monthInstallments.filter((i) => i.status === 'paid').length} de{' '}
                {monthInstallments.length} parcelas pagas
              </p>
            </div>

            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-amber-200">
              <button
                type="button"
                onClick={() => setInstallmentSubTab('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  installmentSubTab === 'month'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Calendar size={13} />
                <span>Parcelas do Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setInstallmentSubTab('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  installmentSubTab === 'overview'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Layers size={13} />
                <span>Visão Geral das Compras</span>
              </button>
            </div>
          </div>

          {installmentSubTab === 'month' ? (
            /* Sub-Aba 1: Parcelas do Mês */
            monthInstallments.length === 0 ? (
              <EmptyState
                title="Nenhuma parcela neste mês"
                description="Você não possui compras parceladas com vencimento neste período."
                actionLabel="Cadastrar Parcelamento"
                onAction={onOpenAddInstallment}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {monthInstallments.map((inst) => {
                  const parent = installmentPurchases.find((p) => p.id === inst.purchase_id);
                  return (
                    <div
                      key={inst.id}
                      className="p-4 rounded-2xl bg-white border border-[#DDE8E0] shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                            <CreditCard size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-[#0D3B22] truncate">
                              {parent?.description || inst.purchase_description}
                            </h4>
                            <span className="text-xs text-[#68736C]">
                              Parcela {inst.installment_number} de {inst.total_installments}
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={inst.status} size="sm" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#DDE8E0]/60 text-xs">
                        <div>
                          <span className="text-[#68736C] block text-[10px] uppercase font-bold">
                            Vencimento
                          </span>
                          <span className="font-semibold text-[#18201B]">
                            {formatDateBR(inst.due_date)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[#68736C] block text-[10px] uppercase font-bold">
                            Valor da Parcela
                          </span>
                          <span className="font-extrabold text-sm text-[#0D3B22]">
                            {formatCurrency(inst.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Ações da Parcela */}
                      <div className="flex items-center gap-2 pt-1">
                        {inst.status !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setQuickPayItem({
                                id: inst.id,
                                type: 'installment',
                                description: `${parent?.description || inst.purchase_description} (${inst.installment_number}/${inst.total_installments})`,
                                expectedAmount: inst.amount,
                                dueDate: inst.due_date,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            <CheckCircle2 size={14} />
                            <span>Pagar Parcela</span>
                          </button>
                        ) : (
                          <div className="flex-1 py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                            Pago em {formatDateBR(inst.paid_date)}
                          </div>
                        )}

                        <button
                          type="button"
                          title="Editar parcela"
                          onClick={() => {
                            setActiveInstallmentForAction(inst);
                            setInstallmentActionMode('edit');
                          }}
                          className="p-2 text-[#68736C] hover:text-[#0D3B22] hover:bg-gray-100 rounded-xl transition-colors border border-[#DDE8E0]"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          title="Excluir parcela"
                          onClick={() => {
                            setActiveInstallmentForAction(inst);
                            setInstallmentActionMode('delete');
                          }}
                          className="p-2 text-[#68736C] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-[#DDE8E0]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Sub-Aba 2: Visão Geral das Compras Parceladas (Seção 3.6) */
            installmentPurchases.length === 0 ? (
              <EmptyState
                title="Nenhum parcelamento cadastrado"
                description="Cadastre compras parceladas para acompanhar o valor total, parcelas pagas e saldo restante."
                actionLabel="Cadastrar Parcelamento"
                onAction={onOpenAddInstallment}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {installmentPurchases.map((purchase) => {
                  const purchaseInsts = installments.filter((i) => i.purchase_id === purchase.id);
                  const paidCount = purchaseInsts.filter((i) => i.status === 'paid').length;
                  const remainingCount = purchase.installments_count - paidCount;
                  const paidAmount = purchaseInsts
                    .filter((i) => i.status === 'paid')
                    .reduce((sum, i) => sum + i.amount, 0);
                  const remainingAmount = Math.max(0, purchase.total_amount - paidAmount);
                  const progressPct = Math.round((paidCount / purchase.installments_count) * 100);

                  // Próxima parcela pendente
                  const nextPending = purchaseInsts
                    .filter((i) => i.status !== 'paid')
                    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

                  return (
                    <div
                      key={purchase.id}
                      className="p-5 rounded-3xl bg-white border border-[#DDE8E0] shadow-xs space-y-4"
                    >
                      {/* Topo do Card de Compra */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <CreditCard size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-[#0D3B22] truncate">
                              {purchase.description}
                            </h4>
                            <span className="text-xs text-[#68736C]">
                              Cadastrado em {formatDateBR(purchase.created_at.slice(0, 10))}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${
                            remainingCount === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {remainingCount === 0 ? 'Quitado' : `${progressPct}% pago`}
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Grid de Detalhes Conforme Seção 3.6 */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-[#F6FAF7] rounded-2xl border border-[#DDE8E0]/70 text-center">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#68736C] block">
                            Valor Total
                          </span>
                          <span className="text-xs font-black text-[#18201B]">
                            {formatCurrency(purchase.total_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#68736C] block">
                            Parcela Média
                          </span>
                          <span className="text-xs font-black text-[#18201B]">
                            {formatCurrency(purchase.installment_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#68736C] block">
                            Saldo Restante
                          </span>
                          <span className="text-xs font-black text-red-600">
                            {formatCurrency(remainingAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Estatísticas de Parcelas */}
                      <div className="flex items-center justify-between text-xs text-[#68736C] px-1">
                        <span>
                          Parcelas Pagas: <strong className="text-emerald-700">{paidCount}</strong>
                        </span>
                        <span>
                          Parcelas Restantes: <strong className="text-amber-700">{remainingCount}</strong> de {purchase.installments_count}
                        </span>
                      </div>

                      {/* Próximo Vencimento & Ação */}
                      {nextPending && (
                        <div className="pt-2 border-t border-[#DDE8E0]/60 flex items-center justify-between gap-2">
                          <div className="text-xs">
                            <span className="text-[#68736C] block text-[10px]">Próxima Parcela ({nextPending.installment_number}/{nextPending.total_installments})</span>
                            <span className="font-bold text-[#18201B]">{formatDateBR(nextPending.due_date)} • {formatCurrency(nextPending.amount)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setQuickPayItem({
                                id: nextPending.id,
                                type: 'installment',
                                description: `${purchase.description} (${nextPending.installment_number}/${nextPending.total_installments})`,
                                expectedAmount: nextPending.amount,
                                dueDate: nextPending.due_date,
                              })
                            }
                            className="px-3 py-1.5 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            Pagar Parcela
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      ) : (
        /* Aba de Lançamentos Normais */
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="Nenhum lançamento encontrado"
              description="Nenhuma movimentação corresponde aos filtros selecionados neste mês."
              actionLabel="Novo Lançamento"
              onAction={() => onOpenAddTransaction()}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDE8E0] shadow-xs overflow-hidden">
              <div className="divide-y divide-[#DDE8E0]/70">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6FAF7]/50 transition-colors"
                    >
                      {/* Lado Esquerdo */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
                            isIncome
                              ? 'bg-emerald-50 text-[#22C55E]'
                              : tx.type === 'expense_fixed'
                              ? 'bg-rose-50 text-[#EF5350]'
                              : 'bg-orange-50 text-[#F97316]'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#0D3B22] truncate">
                              {tx.description}
                            </h4>
                            {tx.is_recurring && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                Recorrente
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#68736C] mt-0.5">
                            <span>{formatDateBR(tx.due_date)}</span>
                            {tx.category && (
                              <>
                                <span>•</span>
                                <span>{tx.category.name}</span>
                              </>
                            )}
                            {tx.responsible_user && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-[#18201B]">
                                  {tx.responsible_user.full_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DDE8E0]/40">
                        <StatusBadge status={tx.status} size="sm" />

                        <div className="text-right">
                          <span
                            className={`text-sm sm:text-base font-extrabold ${
                              isIncome ? 'text-[#22C55E]' : 'text-[#18201B]'
                            }`}
                          >
                            {isIncome ? '+ ' : '- '}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1 pl-2">
                          {tx.status !== 'paid' && (
                            <button
                              type="button"
                              title="Pagar Conta Rápida"
                              onClick={() =>
                                setQuickPayItem({
                                  id: tx.id,
                                  type: 'transaction',
                                  description: tx.description,
                                  expectedAmount: tx.amount,
                                  dueDate: tx.due_date,
                                  isRecurring: tx.is_recurring,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={14} />
                              <span>Pagar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            title="Editar lançamento"
                            onClick={() => onOpenEditTransaction(tx)}
                            className="p-1.5 text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            title="Excluir lançamento"
                            onClick={() => setItemToDelete(tx)}
                            className="p-1.5 text-[#68736C] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Pagamento Rápido (Seção 5.5 e 5.6) */}
      <QuickPayModal
        isOpen={Boolean(quickPayItem)}
        onClose={() => setQuickPayItem(null)}
        item={quickPayItem}
        onConfirmPay={handleConfirmQuickPay}
      />

      {/* Modal de Ação para Parcelas (Edição e Exclusão com escopo - Seções 3.7 e 3.8) */}
      <InstallmentActionModal
        isOpen={Boolean(activeInstallmentForAction)}
        onClose={() => setActiveInstallmentForAction(null)}
        installment={activeInstallmentForAction}
        mode={installmentActionMode}
      />

      {/* Modal de Confirmação de Exclusão de Transação */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Excluir Lançamento"
        message={`Deseja realmente excluir o lançamento "${itemToDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        onConfirm={() => {
          if (itemToDelete) {
            deleteTransaction(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
