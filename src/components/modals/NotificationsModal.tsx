import React from 'react';
import { X, Bell, Check, Clock, AlertTriangle, Target, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateBR } from '../../lib/calculations';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useFinance();

  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'due_alert':
        return <Clock size={16} className="text-amber-600" />;
      case 'overdue_alert':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'goal_reached':
        return <Target size={16} className="text-emerald-600" />;
      default:
        return <Bell size={16} className="text-[#22C55E]" />;
    }
  };

  return (
    <div
      id="notifications-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="notifications-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">Notificações e Avisos</h3>
              <p className="text-xs text-[#68736C]">Avisos de vencimentos e lembretes</p>
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

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check size={22} />
              </div>
              <p className="text-sm font-bold text-[#0D3B22]">Tudo tranquilo por aqui!</p>
              <p className="text-xs text-[#68736C]">Nenhuma notificação pendente no momento.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.is_read
                    ? 'bg-white border-[#DDE8E0]/70 opacity-80'
                    : 'bg-emerald-50/50 border-[#22C55E]/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5">
                    {renderIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#0D3B22] truncate">{n.title}</h4>
                      <span className="text-[10px] text-[#68736C] shrink-0">
                        {formatDateBR(n.created_at.slice(0, 10))}
                      </span>
                    </div>
                    <p className="text-xs text-[#18201B] mt-1 leading-snug">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-[#DDE8E0] bg-[#F6FAF7] flex justify-between items-center">
            <button
              type="button"
              onClick={clearAllNotifications}
              className="text-xs font-semibold text-[#68736C] hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} /> Limpar todas
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl transition-colors"
            >
              Concluído
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
