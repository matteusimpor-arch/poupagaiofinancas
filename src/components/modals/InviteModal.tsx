import React, { useState } from 'react';
import { X, Mail, Users, Shield, UserMinus, LogOut, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const {
    currentSpace,
    currentSpaceRole,
    spaceMembers,
    currentUser,
    inviteMemberToSpace,
    removeMemberFromSpace,
    leaveSpace,
    transferSpaceAdmin,
  } = useFinance();

  const [inviteEmail, setInviteEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentSpace) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    await inviteMemberToSpace(currentSpace.id, inviteEmail);
    setSuccessMsg(`Convite enviado com sucesso para ${inviteEmail}!`);
    setInviteEmail('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div
      id="invite-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="invite-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">Membros do Espaço</h3>
              <p className="text-xs text-[#68736C]">{currentSpace.name}</p>
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

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Convidar Novo Membro (se for admin) */}
          {currentSpaceRole === 'admin' ? (
            <form onSubmit={handleInvite} className="space-y-2">
              <label
                htmlFor="invite-email"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide"
              >
                Convidar por E-mail
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@parceiro.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DDE8E0] bg-white text-xs font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs shrink-0"
                >
                  Enviar
                </button>
              </div>

              {successMsg && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 size={14} /> {successMsg}
                </p>
              )}
            </form>
          ) : (
            <div className="p-3 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs text-[#68736C]">
              Você é membro deste espaço compartilhado. Apenas o administrador pode convidar novas pessoas.
            </div>
          )}

          {/* Lista de Membros Atuais */}
          <div className="space-y-2 pt-2 border-t border-[#DDE8E0]">
            <span className="block text-xs font-bold text-[#68736C] uppercase tracking-wide">
              Membros Conectados ({spaceMembers.length})
            </span>

            <div className="space-y-2">
              {spaceMembers.map((member) => {
                const isMe = member.user_id === currentUser?.id;
                const isAdmin = member.role === 'admin';

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F6FAF7] border border-[#DDE8E0]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.full_name}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold text-xs flex items-center justify-center">
                          {member.user?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#18201B] truncate">
                          {member.user?.full_name || member.user_id} {isMe ? '(Você)' : ''}
                        </p>
                        <span className="text-[11px] text-[#68736C] flex items-center gap-1">
                          {isAdmin ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              <Shield size={11} /> Administrador
                            </span>
                          ) : (
                            <span>Membro</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Ações de Gestão de Membros */}
                    <div className="flex items-center gap-1">
                      {currentSpaceRole === 'admin' && !isMe && (
                        <>
                          <button
                            type="button"
                            title="Tornar Administrador"
                            onClick={() => transferSpaceAdmin(currentSpace.id, member.user_id)}
                            className="p-1.5 text-[#68736C] hover:text-[#22C55E] rounded-lg hover:bg-white"
                          >
                            <Shield size={15} />
                          </button>
                          <button
                            type="button"
                            title="Remover membro"
                            onClick={() => removeMemberFromSpace(member.id)}
                            className="p-1.5 text-[#68736C] hover:text-red-600 rounded-lg hover:bg-white"
                          >
                            <UserMinus size={15} />
                          </button>
                        </>
                      )}

                      {/* Sair do espaço (se for membro comum) */}
                      {!isAdmin && isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            leaveSpace(currentSpace.id);
                            onClose();
                          }}
                          className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <LogOut size={13} /> Sair
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#DDE8E0] bg-[#F6FAF7] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#68736C] hover:text-[#18201B] bg-white rounded-xl border border-[#DDE8E0]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
