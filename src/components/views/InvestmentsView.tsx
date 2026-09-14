import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Building,
  Edit2,
  Percent,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/calculations';
import { EmptyState } from '../common/EmptyState';
import { MoneyInput } from '../common/MoneyInput';

interface InvestmentsViewProps {
  onOpenAddInvestment: () => void;
  onOpenEditInvestment: (inv: Investment) => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  onOpenAddInvestment,
  onOpenEditInvestment,
}) => {
  const { investments, addInvestmentMovement } = useFinance();

  const [selectedInvForMovement, setSelectedInvForMovement] = useState<Investment | null>(null);
  const [movementType, setMovementType] = useState<'deposit' | 'withdraw' | 'yield_update'>('deposit');
  const [movementAmount, setMovementAmount] = useState(0);

  // Totais consolidados
  const totalInitial = investments.reduce((s, i) => s + i.initial_amount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.current_amount, 0);
  const totalYield = totalCurrent - totalInitial;
  const yieldPct = totalInitial > 0 ? (totalYield / totalInitial) * 100 : 0;

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForMovement || movementAmount <= 0) return;

    addInvestmentMovement(selectedInvForMovement.id, movementType, movementAmount);
    setSelectedInvForMovement(null);
    setMovementAmount(0);
  };

  return (
    <div id="investments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Investimentos & Patrimônio</h2>
          <p className="text-xs text-[#68736C]">
            Acompanhe a rentabilidade e a evolução das suas aplicações
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddInvestment}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Cadastrar Ativo</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Patrimônio Atual */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Patrimônio Atual
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-[#0D3B22] mt-1">
            {formatCurrency(totalCurrent)}
          </h3>
          <span className="text-[11px] font-semibold text-[#68736C] block mt-1">
            {investments.length} aplicação(ões) cadastradas
          </span>
        </div>

        {/* Total Aplicado */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Total Aportado
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-[#18201B] mt-1">
            {formatCurrency(totalInitial)}
          </h3>
          <span className="text-[11px] font-semibold text-[#68736C] block mt-1">
            Capital investido inicialmente
          </span>
        </div>

        {/* Rentabilidade Acumulada */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Rentabilidade Acumulada
          </span>
          <h3
            className={`text-2xl lg:text-3xl font-black mt-1 ${
              totalYield >= 0 ? 'text-[#22C55E]' : 'text-[#EF5350]'
            }`}
          >
            {totalYield >= 0 ? '+ ' : ''}
            {formatCurrency(totalYield)}
          </h3>
          <span
            className={`text-[11px] font-bold block mt-1 ${
              totalYield >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {totalYield >= 0 ? '▲ +' : '▼ '}
            {yieldPct.toFixed(2)}% de rendimento
          </span>
        </div>
      </div>

      {/* Lista de Ativos */}
      {investments.length === 0 ? (
        <EmptyState
          title="Nenhum investimento cadastrado"
          description="Cadastre seus ativos de renda fixa, tesouro direto, ações ou fundos para acompanhar sua evolução."
          actionLabel="Novo Investimento"
          onAction={onOpenAddInvestment}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((inv) => {
            const yieldVal = inv.current_amount - inv.initial_amount;
            const pct = inv.initial_amount > 0 ? (yieldVal / inv.initial_amount) * 100 : 0;

            return (
              <div
                key={inv.id}
                className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                        {inv.type}
                      </span>
                      <h4 className="text-base font-bold text-[#0D3B22] mt-1.5 truncate">
                        {inv.name}
                      </h4>
                      {inv.institution && (
                        <p className="text-xs text-[#68736C] flex items-center gap-1 mt-0.5">
                          <Building size={12} /> {inv.institution}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenEditInvestment(inv)}
                      className="p-1.5 text-[#68736C] hover:text-[#18201B] rounded-lg hover:bg-gray-100"
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DDE8E0]/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#68736C] block text-[10px] uppercase font-bold">
                        Valor Atual
                      </span>
                      <strong className="text-base font-black text-[#0D3B22]">
                        {formatCurrency(inv.current_amount)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[#68736C] block text-[10px] uppercase font-bold">
                        Aportado
                      </span>
                      <strong className="text-sm font-bold text-[#18201B]">
                        {formatCurrency(inv.initial_amount)}
                      </strong>
                    </div>
                  </div>

                  {inv.estimated_yield && (
                    <div className="mt-2 text-xs text-[#68736C] flex items-center justify-between bg-[#F6FAF7] p-2 rounded-xl">
                      <span>Estimativa:</span>
                      <span className="font-bold text-[#0D3B22]">{inv.estimated_yield}</span>
                    </div>
                  )}
                </div>

                {/* Ações Rápidas de Movimentação */}
                <div className="pt-2 border-t border-[#DDE8E0]/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvForMovement(inv);
                      setMovementType('deposit');
                      setMovementAmount(0);
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#22C55E] text-xs font-bold rounded-xl transition-colors text-center"
                  >
                    + Aportar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvForMovement(inv);
                      setMovementType('withdraw');
                      setMovementAmount(0);
                    }}
                    className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors text-center"
                  >
                    - Resgatar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvForMovement(inv);
                      setMovementType('yield_update');
                      setMovementAmount(inv.current_amount);
                    }}
                    className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-[#68736C] text-xs font-bold rounded-xl transition-colors"
                    title="Atualizar saldo atual com rendimentos"
                  >
                    Atualizar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Rápido de Movimentação de Investimento */}
      {selectedInvForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#DDE8E0] p-5 space-y-4">
            <h3 className="text-base font-bold text-[#0D3B22]">
              {movementType === 'deposit'
                ? 'Novo Aporte em Investimento'
                : movementType === 'withdraw'
                ? 'Resgate de Investimento'
                : 'Atualizar Saldo Atual'}
            </h3>
            <p className="text-xs text-[#68736C]">{selectedInvForMovement.name}</p>

            <form onSubmit={handleConfirmMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1">
                  {movementType === 'yield_update' ? 'Novo Saldo Consolidado' : 'Valor'}
                </label>
                <MoneyInput value={movementAmount} onChange={setMovementAmount} autoFocus required />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDE8E0]">
                <button
                  type="button"
                  onClick={() => setSelectedInvForMovement(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#68736C] hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
