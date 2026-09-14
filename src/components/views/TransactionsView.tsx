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
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { formatCurrency, formatDateBR, formatMonthYearBR } from '../../lib/calculations';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';

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
    deleteTransaction,
    anticipateInstallment,
  } = useFinance();

  const [activeTypeTab, setActiveTypeTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddInstallment}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0D3B22] bg-white border border-[#DDE8E0] hover:bg-[#F6FAF7] rounded-xl shadow-2xs transition-colors"
          >
            <CreditCard size={15} />
            <span>Novo Parcelamento</span>
          </button>
          <button
            type="button"
            id="btn-add-transaction-view"
            onClick={() => onOpenAddTransaction()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Adicionar Lançamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
        {/* Abas de Tipos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#DDE8E0]/70">
          {[
            { id: 'all', label: 'Todos os Lançamentos' },
            { id: 'income', label: 'Entradas' },
            { id: 'expense_fixed', label: 'Gastos Fixos' },
            { id: 'expense_variable', label: 'Gastos Variáveis' },
            { id: 'installment', label: `Parcelamentos (${monthInstallments.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTypeTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                activeTypeTab === tab.id
                  ? 'bg-[#DCFCE7] text-[#14532D]'
                  : 'text-[#68736C] hover:text-[#18201B] hover:bg-[#F6FAF7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, categoria..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filtro de Status */}
          {activeTypeTab !== 'installment' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#68736C] whitespace-nowrap">Situação:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#0D3B22] focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="all">Todas as situações</option>
                <option value="paid">Pagas / Recebidas</option>
                <option value="pending">Pendentes</option>
                <option value="due_soon">Vencem em breve</option>
                <option value="overdue">Atrasadas</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo: Lista de Transações OU Parcelamentos */}
      {activeTypeTab === 'installment' ? (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Parcelas do Mês de {formatMonthYearBR(selectedMonth)}
              </h4>
              <p className="text-xs text-amber-800">
                Total parcelado neste mês:{' '}
                <strong>
                  {formatCurrency(monthInstallments.reduce((s, i) => s + i.amount, 0))}
                </strong>
              </p>
            </div>
          </div>

          {monthInstallments.length === 0 ? (
            <EmptyState
              title="Nenhuma parcela neste mês"
              description="Você não possui faturas ou compras parceladas com vencimento neste período."
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

                    {inst.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => anticipateInstallment(inst.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#F6FAF7] hover:bg-emerald-50 text-[#22C55E] text-xs font-bold rounded-xl border border-[#DDE8E0] transition-colors"
                      >
                        <FastForward size={14} />
                        <span>Antecipar / Quitar Parcela</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
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
                              title="Marcar como Pago"
                              onClick={() => markTransactionAsPaid(tx.id)}
                              className="p-1.5 text-xs font-bold text-[#22C55E] hover:bg-[#DCFCE7] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={16} />
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

      {/* Modal de Confirmação de Exclusão */}
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
