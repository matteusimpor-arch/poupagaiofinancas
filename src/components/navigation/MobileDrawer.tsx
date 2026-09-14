import React from 'react';
import {
  X,
  LayoutDashboard,
  ArrowLeftRight,
  SlidersHorizontal,
  TrendingUp,
  Target,
  Heart,
  BarChart3,
  User,
  LogOut,
  Users,
  Shield,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSpaceModal: () => void;
  onOpenInviteModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenSpaceModal,
  onOpenInviteModal,
}) => {
  const { currentSpace, currentSpaceRole, currentUser, logout } = useFinance();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'movimentacoes', label: 'Lançamentos e Contas', icon: ArrowLeftRight },
    { id: 'planejamento', label: 'Planejamento Mensal', icon: SlidersHorizontal },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'metas', label: 'Metas Financeiras', icon: Target },
    { id: 'desejos', label: 'Lista de Desejos', icon: Heart },
    { id: 'relatorios', label: 'Relatórios & Gráficos', icon: BarChart3 },
    { id: 'perfil', label: 'Perfil e Configurações', icon: User },
  ];

  return (
    <div
      id="mobile-drawer-overlay"
      className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
    >
      <div
        id="mobile-drawer-content"
        className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
      >
        <div>
          {/* Header */}
          <div className="p-5 border-b border-[#DDE8E0] flex items-center justify-between">
            <PoupagaioLogo size="sm" showSlogan={false} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="p-1.5 rounded-lg text-[#68736C] hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Espaço Ativo */}
          <div className="p-4 bg-[#F6FAF7] border-b border-[#DDE8E0]/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736C]">
                Espaço Ativo
              </span>
              <p className="text-sm font-bold text-[#0D3B22] truncate">{currentSpace?.name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSpaceModal();
              }}
              className="text-xs font-bold text-[#22C55E] hover:underline"
            >
              Trocar
            </button>
          </div>

          {/* Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[60vh]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#DCFCE7] text-[#14532D] font-bold'
                      : 'text-[#68736C] hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#22C55E]' : 'text-[#68736C]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE8E0] bg-[#F6FAF7] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#18201B] truncate">{currentUser?.full_name}</p>
              <p className="text-[10px] text-[#68736C] truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
