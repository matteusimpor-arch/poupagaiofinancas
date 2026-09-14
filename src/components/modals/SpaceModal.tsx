import React, { useState } from 'react';
import { X, Plus, Users, Lock, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceModal: React.FC<SpaceModalProps> = ({ isOpen, onClose }) => {
  const { spaces, currentSpace, switchSpace, createSpace } = useFinance();

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isShared, setIsShared] = useState(true);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    await createSpace(newSpaceName, isShared);
    setNewSpaceName('');
    setMode('list');
    onClose();
  };

  return (
    <div
      id="space-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="space-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                {mode === 'list' ? 'Seus Espaços Financeiros' : 'Criar Novo Espaço'}
              </h3>
              <p className="text-xs text-[#68736C]">
                {mode === 'list'
                  ? 'Alterne entre suas contas individuais ou compartilhadas'
                  : 'Separe suas contas pessoais das finanças a dois'}
              </p>
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

        <div className="p-5 space-y-4">
          {mode === 'list' ? (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {spaces.map((space) => {
                  const isCurrent = space.id === currentSpace?.id;
                  return (
                    <div
                      key={space.id}
                      onClick={() => {
                        switchSpace(space.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-[#22C55E] ring-1 ring-[#22C55E]'
                          : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            space.is_shared
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {space.is_shared ? <Users size={16} /> : <Lock size={16} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0D3B22]">{space.name}</h4>
                          <span className="text-xs text-[#68736C]">
                            {space.is_shared ? 'Compartilhado com parceiro/família' : 'Individual e privado'}
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#DDE8E0] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#22C55E] hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  <span>Criar Novo Espaço</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="space-new-name"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
                >
                  Nome do Espaço <span className="text-red-500">*</span>
                </label>
                <input
                  id="space-new-name"
                  type="text"
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ex: Finanças da Casa, Nós Dois, Projeto Viagem"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-semibold focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#68736C] uppercase tracking-wide">
                  Tipo de Espaço
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShared(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isShared
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-[#0D3B22]">
                      <Users size={15} className="text-[#06B6D4]" /> Compartilhado
                    </div>
                    <p className="text-[11px] text-[#68736C] mt-1">
                      Para casais ou família com visão conjunta
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShared(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !isShared
                        ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                        : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-[#0D3B22]">
                      <Lock size={15} className="text-[#68736C]" /> Individual
                    </div>
                    <p className="text-[11px] text-[#68736C] mt-1">
                      100% privado, visível apenas para você
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE8E0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-4 py-2 text-sm font-semibold text-[#68736C] hover:text-[#18201B] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
                >
                  Criar Espaço
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
