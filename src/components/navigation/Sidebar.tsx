import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  TrendingUp,
  SlidersHorizontal,
  BarChart3,
  User,
  LogOut,
  Users,
  ChevronDown,
  Plus,
  Bell,
  Heart,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenSpaceModal: () => void;
  onOpenInviteModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenSpaceModal,
  onOpenInviteModal,
}) => {
  const {
    spaces,
    currentSpace,
    currentSpaceRole,
    switchSpace,
    currentUser,
    logout,
    notifications,
  } = useFinance();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'planejamento', label: 'Planejamento', icon: SlidersHorizontal },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'desejos', label: 'Lista de Desejos', icon: Heart },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'perfil', label: 'Perfil e Ajustes', icon: User },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-72 bg-white border-r border-[#DDE8E0] h-screen sticky top-0 shrink-0 select-none z-30"
    >
      {/* Brand & Logo */}
      <div className="p-6 border-b border-[#DDE8E0]/70 flex items-center justify-between">
        <PoupagaioLogo size="md" showSlogan={true} />
      </div>

      {/* Seletor de Espaço Financeiro */}
      <div className="p-4 border-b border-[#DDE8E0]/50 bg-[#F6FAF7]/50">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#68736C]">
            Espaço Financeiro
          </span>
          {currentSpace?.is_shared && currentSpaceRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="text-[11px] font-semibold text-[#22C55E] hover:underline flex items-center gap-1"
            >
              <Users size={12} /> Convidar
            </button>
          )}
        </div>

        <div className="relative">
          <select
            id="space-selector-select"
            value={currentSpace?.id}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                onOpenSpaceModal();
              } else {
                switchSpace(e.target.value);
              }
            }}
            className="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-[#DDE8E0] text-sm font-semibold text-[#0D3B22] shadow-2xs focus:ring-2 focus:ring-[#22C55E] focus:outline-none appearance-none cursor-pointer"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.is_shared ? '👥 ' : '🔒 '} {s.name}
              </option>
            ))}
            <option value="__new__">➕ Criar novo espaço...</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736C] pointer-events-none"
          />
        </div>
      </div>

      {/* Botão Adicionar Rápido */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          id="btn-quick-add-sidebar"
          onClick={onOpenQuickAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm shadow-xs transition-all active:scale-[0.98] focus:ring-2 focus:ring-[#22C55E]"
        >
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1" aria-label="Menu Principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#DCFCE7] text-[#14532D] shadow-2xs font-bold'
                  : 'text-[#68736C] hover:text-[#18201B] hover:bg-[#F6FAF7]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={19}
                  className={isActive ? 'text-[#22C55E]' : 'text-[#68736C]'}
                />
                <span>{item.label}</span>
              </div>
              {item.id === 'perfil' && unreadCount > 0 && (
                <span className="w-5 h-5 text-[10px] font-bold rounded-full bg-[#EF5350] text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé do Perfil */}
      <div className="p-4 border-t border-[#DDE8E0]/70 bg-white">
        <div className="flex items-center justify-between">
          <div
            onClick={() => onSelectTab('perfil')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-[#DDE8E0]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold flex items-center justify-center text-sm">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#18201B] truncate">
                {currentUser?.full_name || 'Usuário'}
              </p>
              <p className="text-[11px] text-[#68736C] truncate">{currentUser?.email}</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-logout"
            onClick={logout}
            aria-label="Sair da conta"
            title="Sair da conta"
            className="p-2 text-[#68736C] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};
