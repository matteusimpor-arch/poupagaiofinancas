import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Bell,
  Users,
  Shield,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  FolderPlus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateBR } from '../../lib/calculations';
import { PoupagaioLogo } from '../common/PoupagaioLogo';

interface ProfileViewProps {
  onOpenInviteModal: () => void;
  onOpenSpaceModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenInviteModal,
  onOpenSpaceModal,
}) => {
  const {
    currentUser,
    currentSpace,
    currentSpaceRole,
    spaceMembers,
    categories,
    addCategory,
    auditLogs,
    resetDemoData,
    logout,
  } = useFinance();

  const [name, setName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [dueAlertDays, setDueAlertDays] = useState<number>(3);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: '#22C55E',
      icon: 'Tag',
      is_default: false,
    });
    setNewCatName('');
  };

  return (
    <div id="profile-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-[#0D3B22]">Perfil e Configurações</h2>
        <p className="text-xs text-[#68736C]">
          Gerencie sua conta, preferências de notificação e membros do espaço
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Dados Pessoais & Preferências */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Dados do Perfil */}
          <div className="p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold text-lg flex items-center justify-center">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D3B22]">{currentUser?.full_name}</h3>
                <p className="text-xs text-[#68736C]">{currentUser?.email}</p>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} /> Preferências salvas com sucesso!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:ring-2 focus:ring-[#22C55E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-gray-100 border border-[#DDE8E0] rounded-xl text-[#68736C] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Alerta de Vencimento de Contas (Seção 11) */}
              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1">
                  Aviso de Vencimento de Contas
                </label>
                <p className="text-xs text-[#68736C] mb-2">
                  Defina quantos dias antes do vencimento as contas devem receber o aviso "Vence em
                  breve".
                </p>
                <div className="flex gap-2">
                  {[3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDueAlertDays(days)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        dueAlertDays === days
                          ? 'bg-[#DCFCE7] border-[#22C55E] text-[#14532D]'
                          : 'bg-white border-[#DDE8E0] text-[#68736C] hover:bg-[#F6FAF7]'
                      }`}
                    >
                      {days} dias antes
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Salvar Preferências
                </button>
              </div>
            </form>
          </div>

          {/* Categorias Personalizadas */}
          <div className="p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0D3B22]">Categorias Financeiras</h3>
                <p className="text-xs text-[#68736C]">Personalize as categorias do seu espaço</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da nova categoria..."
                className="flex-1 px-3.5 py-2 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:ring-2 focus:ring-[#22C55E]"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#0D3B22]"
              >
                <option value="expense">Despesa</option>
                <option value="income">Entrada</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                Adicionar
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                    cat.type === 'income'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-[#F6FAF7] text-[#0D3B22] border-[#DDE8E0]'
                  }`}
                >
                  <Tag size={12} />
                  <span>{cat.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Espaço, Membros, Auditoria & Ações */}
        <div className="space-y-6">
          {/* Gestão do Espaço Ativo */}
          <div className="p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0D3B22]">Espaço Financeiro</h3>
              <button
                type="button"
                onClick={onOpenSpaceModal}
                className="text-xs font-bold text-[#22C55E] hover:underline"
              >
                Trocar / Criar
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#68736C]">Nome do Espaço</span>
              <p className="text-sm font-black text-[#0D3B22]">{currentSpace?.name}</p>
              <p className="text-xs text-[#68736C]">
                {currentSpace?.is_shared ? 'Espaço Compartilhado' : 'Espaço Individual'} • Papel:{' '}
                <strong className="text-[#0D3B22]">
                  {currentSpaceRole === 'admin' ? 'Administrador' : 'Membro'}
                </strong>
              </p>
            </div>

            {currentSpace?.is_shared && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#68736C]">Membros Conectados</span>
                  <button
                    type="button"
                    onClick={onOpenInviteModal}
                    className="text-xs font-bold text-[#22C55E] hover:underline flex items-center gap-1"
                  >
                    <Users size={13} /> Convidar
                  </button>
                </div>

                <div className="space-y-1.5">
                  {spaceMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-white border border-[#DDE8E0] flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-[#0D3B22]">{m.user?.full_name}</span>
                      <span className="text-[10px] font-semibold text-[#68736C]">
                        {m.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Registro de Auditoria Recente (Seção 5) */}
          <div className="p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#0D3B22]">Auditoria Recente</h3>
            <p className="text-xs text-[#68736C]">Registro de ações no espaço ativo</p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#68736C]">Nenhuma ação registrada ainda.</p>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-[#F6FAF7] border border-[#DDE8E0] text-[11px]">
                    <div className="flex justify-between font-bold text-[#0D3B22]">
                      <span>{log.user_name}</span>
                      <span className="text-[#68736C]">{formatDateBR(log.created_at.slice(0, 10))}</span>
                    </div>
                    <p className="text-[#68736C] mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reset Demo & Logout */}
          <div className="p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#0D3B22]">Ações de Conta & Sistema</h3>

            <button
              type="button"
              id="btn-profile-create-new-account"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <User size={14} />
              <span>Cadastrar Nova Conta / Alternar</span>
            </button>

            <button
              type="button"
              onClick={resetDemoData}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Restaurar Dados de Exemplo</span>
            </button>

            <button
              type="button"
              id="btn-profile-logout"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors"
            >
              <LogOut size={14} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
