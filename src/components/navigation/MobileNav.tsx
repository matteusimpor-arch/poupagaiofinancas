import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Target,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenDrawer,
}) => {
  return (
    <div
      id="mobile-bottom-navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDE8E0] px-3 py-1.5 shadow-lg select-none"
    >
      <div className="flex items-center justify-around relative">
        {/* Início */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Ir para a tela inicial"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            currentTab === 'dashboard' ? 'text-[#22C55E]' : 'text-[#68736C]'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Início</span>
        </button>

        {/* Movimentações */}
        <button
          type="button"
          onClick={() => onSelectTab('movimentacoes')}
          aria-label="Ir para movimentações financeiras"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            currentTab === 'movimentacoes' ? 'text-[#22C55E]' : 'text-[#68736C]'
          }`}
        >
          <ArrowLeftRight size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Lançamentos</span>
        </button>

        {/* Botão Central Adicionar (Sempre acessível) */}
        <div className="relative -top-5">
          <button
            type="button"
            id="mobile-central-add-btn"
            onClick={onOpenQuickAdd}
            aria-label="Abrir menu para adicionar novo lançamento ou meta"
            className="w-13 h-13 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg hover:bg-[#16a34a] active:scale-95 transition-transform border-4 border-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <Plus size={26} strokeWidth={2.6} />
          </button>
        </div>

        {/* Metas */}
        <button
          type="button"
          onClick={() => onSelectTab('metas')}
          aria-label="Ir para metas financeiras"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            currentTab === 'metas' ? 'text-[#22C55E]' : 'text-[#68736C]'
          }`}
        >
          <Target size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Metas</span>
        </button>

        {/* Menu Geral */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Abrir menu com opções adicionais"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 text-[#68736C] hover:text-[#18201B] transition-colors"
        >
          <Menu size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Menu</span>
        </button>
      </div>
    </div>
  );
};
