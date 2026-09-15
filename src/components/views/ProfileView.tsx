import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Bell,
  Users,
  Shield,
  Tag,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateBR } from '../../lib/calculations';
import { normalizePhoneNumber } from '../../lib/supabase';

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
    zeroAllValues,
    logout,
    updateProfile,
  } = useFinance();

  // Estados do formulário de Perfil (Seções 17 e 18)
  const [firstName, setFirstName] = useState(currentUser?.first_name || currentUser?.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || currentUser?.full_name?.split(' ').slice(1).join(' ') || '');
  const [email] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [dueAlertDays, setDueAlertDays] = useState<number>(currentUser?.due_alert_days || 3);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estados de Categorias
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

  // Máscara e formatação de telefone para exibição: (XX) XXXXX-XXXX
  const formatPhoneMask = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneMask(e.target.value));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      due_alert_days: dueAlertDays,
    });
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
    <div id="profile-view" className="space-y-6 pb-12 animate-in fade-in duration-200 selection:bg-[#22C55E] selection:text-white">
      {/* Header Principal da Tela */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0D3B22]">Perfil e Configurações</h2>
        <p className="text-xs sm:text-sm text-[#68736C] mt-0.5">
          Gerencie seus dados pessoais, segurança da conta e preferências do Poupagaio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Dados Pessoais & Segurança */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Perfil Pessoal (Nome, E-mail, Telefone) */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-5">
            <div className="flex items-center gap-3.5 pb-2 border-b border-[#DDE8E0]/60">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold text-lg flex items-center justify-center shrink-0 border border-[#22C55E]/30">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#0D3B22] truncate">
                  {currentUser?.full_name || 'Usuário Poupagaio'}
                </h3>
                <p className="text-xs text-[#68736C] truncate">{currentUser?.email}</p>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                <span>Perfil atualizado com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label
                    htmlFor="input-profile-firstname"
                    className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
                  >
                    Nome
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
                    <input
                      id="input-profile-firstname"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nome"
                      className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#18201B] focus:bg-white focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sobrenome */}
                <div>
                  <label
                    htmlFor="input-profile-lastname"
                    className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
                  >
                    Sobrenome
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
                    <input
                      id="input-profile-lastname"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sobrenome"
                      className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#18201B] focus:bg-white focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* E-mail (somente leitura vinculada à conta) */}
                <div>
                  <label
                    htmlFor="input-profile-email"
                    className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
                  >
                    E-mail Autenticado
                  </label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
                    <input
                      id="input-profile-email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold bg-gray-100 border border-[#DDE8E0] rounded-xl text-[#68736C] cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Telefone (opcional) */}
                <div>
                  <label
                    htmlFor="input-profile-phone"
                    className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
                  >
                    Telefone (Opcional)
                  </label>
                  <div className="relative">
                    <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]" />
                    <input
                      id="input-profile-phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#18201B] focus:bg-white focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preferências de Alerta */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1">
                  Aviso de Vencimento de Contas
                </label>
                <p className="text-xs text-[#68736C] mb-2.5">
                  Defina quantos dias antes do vencimento as contas devem receber o aviso "Vence em breve".
                </p>
                <div className="flex flex-wrap gap-2">
                  {[3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDueAlertDays(days)}
                      className={`px-4 py-2 min-h-[42px] rounded-xl text-xs font-bold border transition-colors ${
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

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  id="btn-save-profile"
                  className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors active:scale-95"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Categorias Personalizadas */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0D3B22]">Categorias Financeiras</h3>
                <p className="text-xs text-[#68736C]">Personalize as categorias do seu espaço</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da nova categoria..."
                className="flex-1 px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#22C55E]"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="px-3.5 py-2.5 min-h-[44px] text-xs font-bold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-[#0D3B22]"
              >
                <option value="expense">Despesa</option>
                <option value="income">Entrada</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[44px] bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                Adicionar
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
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

        {/* Coluna Lateral: Espaço, Auditoria & Encerramento */}
        <div className="space-y-6">
          {/* Espaço Financeiro */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-4">
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
              <span className="text-[10px] uppercase font-bold text-[#68736C]">Espaço Ativo</span>
              <p className="text-sm font-black text-[#0D3B22] truncate">{currentSpace?.name}</p>
              <p className="text-xs text-[#68736C]">
                {currentSpace?.is_shared ? 'Compartilhado' : 'Individual'} • Papel:{' '}
                <strong className="text-[#0D3B22]">
                  {currentSpaceRole === 'admin' ? 'Admin' : 'Membro'}
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
                      <span className="font-bold text-[#0D3B22] truncate">{m.user?.full_name}</span>
                      <span className="text-[10px] font-semibold text-[#68736C]">
                        {m.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Registro de Auditoria */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#0D3B22]">Auditoria Recente</h3>
            <p className="text-xs text-[#68736C]">Ações registradas no seu espaço</p>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#68736C]">Nenhuma ação registrada ainda.</p>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-[#F6FAF7] border border-[#DDE8E0] text-[11px]">
                    <div className="flex justify-between font-bold text-[#0D3B22]">
                      <span className="truncate">{log.user_name}</span>
                      <span className="text-[#68736C] shrink-0 ml-1">
                        {formatDateBR(log.created_at.slice(0, 10))}
                      </span>
                    </div>
                    <p className="text-[#68736C] mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ações de Conta & Logout */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#DDE8E0] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#0D3B22]">Ações de Conta</h3>

            <button
              type="button"
              onClick={zeroAllValues}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
            >
              <RotateCcw size={15} />
              <span>Zerar Todos os Valores</span>
            </button>

            <button
              type="button"
              onClick={resetDemoData}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors"
            >
              <RotateCcw size={15} />
              <span>Restaurar Dados de Exemplo</span>
            </button>

            <button
              type="button"
              id="btn-profile-logout"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors"
            >
              <LogOut size={15} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
