import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  SlidersHorizontal,
  MoreHorizontal,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenMenu?: () => void;
  onOpenDrawer?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenMenu,
  onOpenDrawer,
}) => {
  const handleOpenMore = onOpenMenu || onOpenDrawer || (() => {});

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navegação inferior mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDE8E0] px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg select-none"
    >
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        {/* 1. Início */}
        <button
          type="button"
          id="btn-nav-mobile-home"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Início"
          className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 transition-all ${
            currentTab === 'dashboard' ? 'text-[#22C55E]' : 'text-[#68736C] hover:text-[#0D3B22]'
          }`}
        >
          <LayoutDashboard size={21} />
          <span className="text-[10px] font-extrabold mt-0.5 tracking-tight">Início</span>
          {currentTab === 'dashboard' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-0.5" />
          )}
        </button>

        {/* 2. Movimentações */}
        <button
          type="button"
          id="btn-nav-mobile-transactions"
          onClick={() => onSelectTab('movimentacoes')}
          aria-label="Movimentações"
          className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 transition-all ${
            currentTab === 'movimentacoes' ? 'text-[#22C55E]' : 'text-[#68736C] hover:text-[#0D3B22]'
          }`}
        >
          <ArrowLeftRight size={21} />
          <span className="text-[10px] font-extrabold mt-0.5 tracking-tight">Lançamentos</span>
          {currentTab === 'movimentacoes' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-0.5" />
          )}
        </button>

        {/* 3. Botão Central '+' (destacado e perfeitamente centralizado) */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-5">
          <button
            type="button"
            id="mobile-central-add-btn"
            onClick={onOpenQuickAdd}
            aria-label="Abrir opções de cadastro"
            className="w-14 h-14 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:bg-[#16a34a] active:scale-90 transition-transform border-4 border-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <Plus size={28} strokeWidth={2.8} />
          </button>
          <span className="text-[9px] font-black text-[#0D3B22] mt-0.5 uppercase tracking-wider">Novo</span>
        </div>

        {/* 4. Planejamento */}
        <button
          type="button"
          id="btn-nav-mobile-planning"
          onClick={() => onSelectTab('planejamento')}
          aria-label="Planejamento"
          className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 transition-all ${
            currentTab === 'planejamento' ? 'text-[#22C55E]' : 'text-[#68736C] hover:text-[#0D3B22]'
          }`}
        >
          <SlidersHorizontal size={21} />
          <span className="text-[10px] font-extrabold mt-0.5 tracking-tight">Planejamento</span>
          {currentTab === 'planejamento' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-0.5" />
          )}
        </button>

        {/* 5. Mais (Menu) */}
        <button
          type="button"
          id="btn-nav-mobile-more"
          onClick={handleOpenMore}
          aria-label="Mais opções"
          className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 transition-all ${
            ['investimentos', 'metas', 'desejos', 'relatorios', 'perfil'].includes(currentTab)
              ? 'text-[#22C55E]'
              : 'text-[#68736C] hover:text-[#0D3B22]'
          }`}
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-extrabold mt-0.5 tracking-tight">Mais</span>
          {['investimentos', 'metas', 'desejos', 'relatorios', 'perfil'].includes(currentTab) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
