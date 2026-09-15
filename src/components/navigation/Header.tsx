import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bell,
  LogOut,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { formatMonthYearBR } from '../../lib/calculations';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenSpaceModal?: () => void;
  onOpenInvite?: () => void;
  onNavigateProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onNavigateProfile,
}) => {
  const {
    currentUser,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    notifications,
    logout,
  } = useFinance();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const now = new Date();
  const currentMonthISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentMonthISO;

  return (
    <header
      id="app-top-header"
      className="w-full bg-white border-b border-[#DDE8E0] px-3.5 sm:px-4 lg:px-8 py-2.5 sm:py-3 select-none"
    >
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-0">
        {/* Linha Principal: Logo + Navegação Desktop + Notificações/Perfil */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="lg:hidden shrink-0">
              <PoupagaioLogo size="sm" />
            </div>
          </div>

          {/* Seletor Mensal para Desktop / Tablets (sm+) */}
          <div
            id="monthly-navigation-controls"
            className="hidden sm:flex items-center gap-1 sm:gap-2 bg-[#F6FAF7] px-2.5 py-1 rounded-xl border border-[#DDE8E0]"
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mês anterior"
              className="p-1 rounded-lg text-[#68736C] hover:text-[#18201B] hover:bg-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5 px-1">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                aria-label="Selecionar mês e ano"
                className="text-xs sm:text-sm font-extrabold text-[#0D3B22] bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mês seguinte"
              className="p-1 rounded-lg text-[#68736C] hover:text-[#18201B] hover:bg-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                title="Voltar para o mês atual"
                aria-label="Voltar para o mês atual"
                className="flex items-center gap-1 ml-1 px-2 py-0.5 text-[11px] font-bold text-[#22C55E] hover:bg-[#DCFCE7] rounded-lg transition-colors"
              >
                <RotateCcw size={12} />
                <span>Mês atual</span>
              </button>
            )}
          </div>

          {/* Notificações & Perfil / Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              id="btn-header-notifications"
              onClick={onOpenNotifications}
              aria-label="Central de notificações"
              className="relative p-2 rounded-xl text-[#68736C] hover:text-[#18201B] hover:bg-[#F6FAF7] border border-transparent hover:border-[#DDE8E0] transition-colors"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-[#EF5350] text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {currentUser && (
              <button
                type="button"
                id="btn-header-profile"
                onClick={onNavigateProfile}
                title={`Logado como ${currentUser.full_name}`}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F6FAF7] border border-transparent hover:border-[#DDE8E0] transition-colors"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-[#DDE8E0]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold flex items-center justify-center text-xs">
                    {currentUser.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-bold text-[#0D3B22] max-w-[100px] truncate">
                  {currentUser.full_name?.split(' ')[0]}
                </span>
              </button>
            )}

            <button
              type="button"
              id="btn-header-logout"
              onClick={logout}
              title="Sair da conta"
              className="p-2 text-[#68736C] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Barra Centralizada e Funcional de Navegação Mensal no Mobile */}
        <div className="flex sm:hidden items-center justify-center pt-1">
          <div
            id="mobile-monthly-navigation-controls"
            className="flex items-center justify-between w-full max-w-sm bg-[#F6FAF7] px-3 py-1.5 rounded-2xl border border-[#DDE8E0] shadow-2xs"
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mês anterior"
              className="p-1.5 rounded-xl text-[#68736C] hover:text-[#18201B] hover:bg-white active:scale-95 transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="relative flex items-center justify-center gap-1.5 cursor-pointer py-0.5 px-2 rounded-lg hover:bg-white/60 transition-colors">
              <span className="text-xs font-black text-[#0D3B22] uppercase tracking-wide">
                {formatMonthYearBR(selectedMonth)}
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                aria-label="Selecionar mês e ano"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <div className="flex items-center gap-1">
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={goToCurrentMonth}
                  title="Voltar para o mês atual"
                  aria-label="Voltar para o mês atual"
                  className="px-2 py-1 text-[10px] font-extrabold text-[#22C55E] bg-[#DCFCE7] rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Atual</span>
                </button>
              )}
              <button
                type="button"
                onClick={goToNextMonth}
                aria-label="Mês seguinte"
                className="p-1.5 rounded-xl text-[#68736C] hover:text-[#18201B] hover:bg-white active:scale-95 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
