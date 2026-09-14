import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarClock,
  XCircle,
} from 'lucide-react';
import { AccountStatus } from '../../types';
import { STATUS_METAS } from '../../lib/calculations';

interface StatusBadgeProps {
  status: AccountStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const meta = STATUS_METAS[status] || STATUS_METAS.pending;

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'due_soon':
        return <Clock size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'due_today':
        return <AlertCircle size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'overdue':
        return <AlertTriangle size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'scheduled':
        return <CalendarClock size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'cancelled':
        return <XCircle size={iconSize} className="shrink-0" aria-hidden="true" />;
      case 'pending':
      default:
        return <Calendar size={iconSize} className="shrink-0" aria-hidden="true" />;
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs md:text-sm font-medium gap-1.5';

  return (
    <span
      id={`status-badge-${status}`}
      role="status"
      aria-label={meta.ariaLabel}
      title={meta.screenReaderDescription}
      style={{
        backgroundColor: meta.bgLight,
        color: meta.color,
        borderColor: meta.borderColor,
      }}
      className={`inline-flex items-center rounded-full font-semibold border whitespace-nowrap select-none transition-colors ${sizeClasses} ${className}`}
    >
      {renderIcon()}
      <span>{meta.label}</span>
      {/* Descrição acessível para leitores de tela */}
      <span className="sr-only">({meta.screenReaderDescription})</span>
    </span>
  );
};
