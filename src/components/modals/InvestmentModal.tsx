import React, { useState, useEffect } from 'react';
import { X, TrendingUp, PiggyBank } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentToEdit?: Investment | null;
  editingInvestment?: Investment | null;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  investmentToEdit,
  editingInvestment,
}) => {
  const activeInvestment = investmentToEdit || editingInvestment;
  const { currentSpace, addInvestment, updateInvestment } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState('Tesouro Direto');
  const [institution, setInstitution] = useState('NuInvest');
  const [initialAmount, setInitialAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [applicationDate, setApplicationDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [estimatedYield, setEstimatedYield] = useState('100% CDI');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeInvestment) {
      setName(activeInvestment.name);
      setType(activeInvestment.type);
      setInstitution(activeInvestment.institution || '');
      setInitialAmount(activeInvestment.initial_amount);
      setCurrentAmount(activeInvestment.current_amount);
      setApplicationDate(activeInvestment.application_date || '');
      setEstimatedYield(activeInvestment.estimated_yield || '');
      setNotes(activeInvestment.notes || '');
    } else {
      setName('');
      setType('Tesouro Direto');
      setInstitution('NuInvest');
      setInitialAmount(0);
      setCurrentAmount(0);
      setApplicationDate(new Date().toISOString().slice(0, 10));
      setEstimatedYield('100% CDI');
      setNotes('');
    }
  }, [activeInvestment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || initialAmount <= 0 || !currentSpace) return;

    if (activeInvestment) {
      updateInvestment(activeInvestment.id, {
        name,
        type,
        institution,
        initial_amount: initialAmount,
        current_amount: currentAmount || initialAmount,
        application_date: applicationDate,
        estimated_yield: estimatedYield,
        notes,
      });
    } else {
      addInvestment({
        space_id: currentSpace.id,
        name,
        type,
        institution,
        initial_amount: initialAmount,
        current_amount: currentAmount || initialAmount,
        application_date: applicationDate,
        estimated_yield: estimatedYield,
        notes,
      });
    }

    onClose();
  };

  return (
    <div
      id="investment-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="investment-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto mt-2.5" />

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <PiggyBank size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                {activeInvestment ? 'Editar Investimento' : 'Novo Investimento'}
              </h3>
              <p className="text-xs text-[#68736C]">Cadastre ativos e acompanhe a evolução</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label
              htmlFor="inv-name"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Nome do Ativo / Aplicação <span className="text-red-500">*</span>
            </label>
            <input
              id="inv-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tesouro Selic 2029, CDB 110% CDI, Fundo Imobiliário"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-semibold focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inv-type"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Tipo de Ativo
              </label>
              <select
                id="inv-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              >
                <option value="Tesouro Direto">Tesouro Direto</option>
                <option value="CDB / Renda Fixa">CDB / Renda Fixa</option>
                <option value="LCI / LCA">LCI / LCA</option>
                <option value="Ações (B3)">Ações (B3)</option>
                <option value="Fundos Imobiliários">Fundos Imobiliários (FIIs)</option>
                <option value="Fundos de Investimento">Fundos Mútuos</option>
                <option value="Previdência Privada">Previdência Privada</option>
                <option value="Criptoativos">Criptomoedas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="inv-institution"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Corretora / Banco
              </label>
              <input
                id="inv-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Nubank, XP, Rico, BTG"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inv-initial"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor Aplicado <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="inv-initial"
                value={initialAmount}
                onChange={(v) => {
                  setInitialAmount(v);
                  if (!currentAmount || currentAmount === initialAmount) {
                    setCurrentAmount(v);
                  }
                }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="inv-current"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Valor Atual (com rendimentos)
              </label>
              <MoneyInput id="inv-current" value={currentAmount} onChange={setCurrentAmount} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inv-date"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Data da Aplicação
              </label>
              <DateInput id="inv-date" value={applicationDate} onChange={setApplicationDate} />
            </div>

            <div>
              <label
                htmlFor="inv-yield"
                className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
              >
                Rentabilidade Estimada
              </label>
              <input
                id="inv-yield"
                type="text"
                value={estimatedYield}
                onChange={(e) => setEstimatedYield(e.target.value)}
                placeholder="Ex: 100% CDI, IPCA + 6%"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-xs focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inv-notes"
              className="block text-xs font-bold text-[#68736C] uppercase tracking-wide mb-1"
            >
              Observações
            </label>
            <input
              id="inv-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Liquidez diária, resgate em D+1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] text-xs focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[#DDE8E0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-investment"
              className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-[#22C55E]"
            >
              {investmentToEdit ? 'Salvar Alterações' : 'Cadastrar Ativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
