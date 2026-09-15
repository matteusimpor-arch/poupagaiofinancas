import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { WishlistItem } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { DateInput } from '../common/DateInput';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: WishlistItem | null;
  wishToEdit?: WishlistItem | null;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  wishToEdit,
}) => {
  const activeWish = editingItem || wishToEdit;
  const { currentSpace, addWishlistItem, updateWishlistItem } = useFinance();

  const [name, setName] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [desiredDate, setDesiredDate] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (activeWish) {
      setName(activeWish.name);
      setEstimatedAmount(activeWish.estimated_amount);
      setPriority(activeWish.priority);
      setDesiredDate(activeWish.desired_date || '');
      setExternalLink(activeWish.external_link || '');
      setDescription(activeWish.description || '');
    } else {
      setName('');
      setEstimatedAmount(0);
      setPriority('medium');
      setDesiredDate('');
      setExternalLink('');
      setDescription('');
    }
  }, [activeWish, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || estimatedAmount <= 0 || !currentSpace) return;

    if (activeWish) {
      updateWishlistItem(activeWish.id, {
        name,
        estimated_amount: estimatedAmount,
        priority,
        desired_date: desiredDate || undefined,
        external_link: externalLink || undefined,
        description: description || undefined,
      });
    } else {
      addWishlistItem({
        space_id: currentSpace.id,
        name,
        estimated_amount: estimatedAmount,
        reserved_amount: 0,
        priority,
        desired_date: desiredDate || undefined,
        external_link: externalLink || undefined,
        description: description || undefined,
        status: 'planning',
      });
    }

    onClose();
  };

  return (
    <div
      id="wishlist-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="wishlist-modal-content"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#DDE8E0] overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-10 h-1 bg-[#DDE8E0] rounded-full mx-auto mt-2.5" />

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DDE8E0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D3B22]">
                {activeWish ? 'Editar Desejo' : 'Novo Item na Lista de Desejos'}
              </h3>
              <p className="text-xs text-[#68736C]">Planeje antes de comprar por impulso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-[#68736C] hover:text-[#18201B] hover:bg-[#F6FAF7] rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
              O que você deseja comprar? *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tênis novo, Smartphone, Cafeteira..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:bg-white focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
              Preço Estimado *
            </label>
            <MoneyInput value={estimatedAmount} onChange={setEstimatedAmount} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:bg-white focus:border-[#22C55E] outline-none"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
                Data Desejada
              </label>
              <DateInput value={desiredDate} onChange={setDesiredDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
              Link do Produto (Opcional)
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://loja.com/produto"
              className="w-full px-3.5 py-2 text-xs font-semibold bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:bg-white focus:border-[#22C55E] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5">
              Anotações / Motivação
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que você quer esse item? É essencial agora?"
              className="w-full px-3.5 py-2 text-xs font-medium bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl focus:bg-white focus:border-[#22C55E] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#68736C] hover:bg-[#F6FAF7] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || estimatedAmount <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            >
              {activeWish ? 'Salvar Alterações' : 'Salvar Desejo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
