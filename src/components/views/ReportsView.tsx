import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  formatDateBR,
  formatMonthYearBR,
  calculateMonthlyBalance,
} from '../../lib/calculations';

export const ReportsView: React.FC = () => {
  const {
    currentSpace,
    transactions,
    installments,
    monthlyClosings,
    goalMovements,
  } = useFinance();

  // Gerar dados dos últimos 6 meses (ex: 2026-04 até 2026-09)
  const lastMonths = [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
  ];

  const chartData = lastMonths.map((month) => {
    const bal = calculateMonthlyBalance({
      transactions,
      installments,
      investments: [],
      goalMovements: [],
      referenceMonth: month,
    });

    return {
      mes: formatMonthYearBR(month).split(' ')[0], // Apenas nome do mês
      fullMonth: month,
      entradas: bal.totalIncome,
      gastos: bal.totalExpenses,
      saldo: bal.availableBalance,
    };
  });

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Status'];
    const rows = transactions.map((t) => [
      t.due_date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category?.name || 'Geral'}"`,
      t.amount.toFixed(2),
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `poupagaio-relatorio-${currentSpace?.name || 'financeiro'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Relatórios & Análises</h2>
          <p className="text-xs text-[#68736C]">
            Visão histórica e evolução das finanças de {currentSpace?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0D3B22] bg-white border border-[#DDE8E0] hover:bg-[#F6FAF7] rounded-xl shadow-2xs transition-colors"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0D3B22] bg-white border border-[#DDE8E0] hover:bg-[#F6FAF7] rounded-xl shadow-2xs transition-colors"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Gráfico 1: Evolução de Entradas vs Gastos */}
      <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#0D3B22]">Evolução de Entradas vs Gastos</h3>
          <p className="text-xs text-[#68736C]">Últimos 6 meses de movimentações consolidadas</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#68736C' }} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#68736C' }}
                axisLine={false}
                tickFormatter={(v) => `R$ ${v}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #DDE8E0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="entradas" name="Entradas" fill="#22C55E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#EF5350" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Evolução do Saldo Mês a Mês */}
      <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#0D3B22]">Evolução do Saldo Líquido</h3>
          <p className="text-xs text-[#68736C]">Histórico de sobra ou déficit mensal</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#68736C' }} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#68736C' }}
                axisLine={false}
                tickFormatter={(v) => `R$ ${v}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), 'Saldo']}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #DDE8E0' }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#22C55E"
                strokeWidth={3}
                dot={{ r: 5, fill: '#22C55E' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Fechamentos Mensais Anteriores */}
      <div className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#0D3B22]">Histórico de Fechamentos</h3>
          <p className="text-xs text-[#68736C]">
            Meses consolidados e avaliados pelo Poupagaio
          </p>
        </div>

        {monthlyClosings.length === 0 ? (
          <p className="text-xs text-[#68736C] py-6 text-center">
            Nenhum mês fechado até o momento. Utilize o botão "Fechar Mês" no painel inicial ao final de cada período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDE8E0] text-[#68736C] uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Mês</th>
                  <th className="py-2.5 px-3">Saldo Final</th>
                  <th className="py-2.5 px-3">Classificação</th>
                  <th className="py-2.5 px-3">Fechado em</th>
                  <th className="py-2.5 px-3">Anotações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E0]/60">
                {monthlyClosings.map((closing) => {
                  const classBadge =
                    closing.classification === 'goal_achieved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : closing.classification === 'partially_achieved'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800';

                  const classText =
                    closing.classification === 'goal_achieved'
                      ? 'Meta Atingida'
                      : closing.classification === 'partially_achieved'
                      ? 'Parcialmente Atingida'
                      : 'Fora da Meta';

                  return (
                    <tr key={closing.id} className="hover:bg-[#F6FAF7]">
                      <td className="py-3 px-3 font-bold text-[#0D3B22]">
                        {formatMonthYearBR(closing.reference_month)}
                      </td>
                      <td className="py-3 px-3 font-black text-[#18201B]">
                        {formatCurrency(closing.final_balance)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${classBadge}`}>
                          {classText}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#68736C]">
                        {formatDateBR(closing.closed_at.slice(0, 10))}
                      </td>
                      <td className="py-3 px-3 text-[#68736C] max-w-xs truncate">
                        {closing.mascot_message || closing.reopening_reason || 'Fechamento regular'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
