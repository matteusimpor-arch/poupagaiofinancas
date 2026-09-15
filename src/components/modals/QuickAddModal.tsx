import React from 'react';
import {
  X,
  TrendingUp,
  Receipt,
  ShoppingBag,
  CreditCard,
  PiggyBank,
  Target,
  Heart,
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption?: (
    type:
      | 'income'
      | 'expense_fixed'
      | 'expense_variable'
      | 'installment'
      | 'investment'
      | 'goal'
      | 'wishlist'
  ) => void;
  onSelectType?: (
    type:
      | 'income'
      | 'expense_fixed'
      | 'expense_variable'
      | 'installment'
      | 'investment'
      | 'goal'
      | 'wishlist'
  ) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  onSelectType,
}) => {
  if (!isOpen) return null;

  const handleSelect = onSelectType || onSelectOption;

  const options = [
    {
      type: 'income' as const,
      label: 'Entrada',
      description: 'Salário, renda extra, benefício, reembolso',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
    },
    {
      type: 'expense_fixed' as const,
      label: 'Gasto Fixo',
      description: 'Aluguel, internet, condomínio, assinaturas',
      icon: Receipt,
      color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100',
    },
    {
      type: 'expense_variable' as const,
      label: 'Gasto Variável',
      description: 'Mercado, transporte, alimentação, lazer',
      icon: ShoppingBag,
      color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
    },
    {
      type: 'installment' as const,
      label: 'Parcelamento',
      description: 'Compra parcelada no cartão (dividir em N meses)',
      icon: CreditCard,
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
    },
    {
      type: 'investment' as const,
      label: 'Investimento',
      description: 'Tesouro, renda fixa, ações, fundos',
      icon: PiggyBank,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100',
    },
    {
      type: 'goal' as const,
      label: 'Meta Financeira',
      description: 'Reserva, viagem dos sonhos, compras futuras',
      icon: Target,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    },
    {
      type: 'wishlist' as const,
      label: 'Lista de Desejos',
      description: 'Itens que você quer comprar sem pressa',
      icon: Heart,
      color: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100',
    },
  ];

  return (
    <div
      id="quick-add-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="quick-add-modal-content"
        className="w-full sm:max-w-lg p-5 sm:p-6 bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#DDE8E0] space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto -mt-2 mb-1" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-poupagaio-principal.png"
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-8 h-8 object-contain"
            />
            <h3 className="text-base sm:text-lg font-bold text-[#0D3B22]">O que você deseja adicionar?</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#68736C] hover:text-[#18201B] p-2 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[65vh] overflow-y-auto py-1">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                id={`btn-quick-add-${opt.type}`}
                onClick={() => {
                  handleSelect?.(opt.type);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3.5 text-left rounded-xl border transition-all min-h-[52px] active:scale-[0.98] ${opt.color}`}
              >
                <div className="p-2 rounded-lg bg-white/80 shrink-0 shadow-2xs">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{opt.label}</h4>
                  <p className="text-xs opacity-80 leading-snug mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
