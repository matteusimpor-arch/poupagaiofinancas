import React, { useState } from 'react';
import {
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { WishlistItem } from '../../types';
import { formatCurrency } from '../../lib/calculations';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';

interface WishlistViewProps {
  onOpenAddWishlist: () => void;
  onOpenEditWishlist: (item: WishlistItem) => void;
  onConvertWishlistToTransaction: (item: WishlistItem) => void;
  onConvertWishlistToInstallment: (item: WishlistItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  onOpenAddWishlist,
  onOpenEditWishlist,
  onConvertWishlistToTransaction,
  onConvertWishlistToInstallment,
}) => {
  const { wishlist, updateWishlistItem, deleteWishlistItem } = useFinance();

  const [activeTab, setActiveTab] = useState<'pending' | 'bought' | 'given_up'>('pending');
  const [itemToPurchase, setItemToPurchase] = useState<WishlistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);

  const isPending = (status: string) =>
    status === 'planning' || status === 'saving' || status === 'ready_to_buy';

  const filteredItems = wishlist.filter((item) => {
    if (activeTab === 'pending') return isPending(item.status);
    if (activeTab === 'bought') return item.status === 'purchased';
    if (activeTab === 'given_up') return item.status === 'cancelled';
    return true;
  });

  const totalPendingAmount = wishlist
    .filter((w) => isPending(w.status))
    .reduce((s, w) => s + w.estimated_amount, 0);

  const totalSavedByGivingUp = wishlist
    .filter((w) => w.status === 'cancelled')
    .reduce((s, w) => s + w.estimated_amount, 0);

  return (
    <div id="wishlist-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0D3B22]">Lista de Desejos</h2>
          <p className="text-xs text-[#68736C]">
            Evite compras por impulso e planeje seus sonhos com calma
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddWishlist}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#22C55E] hover:bg-[#16a34a] rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Adicionar Desejo</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#DDE8E0] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#68736C]">
            Total em Desejos Planejados
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-[#0D3B22] mt-1">
            {formatCurrency(totalPendingAmount)}
          </h3>
          <span className="text-[11px] font-semibold text-[#68736C] block mt-1">
            {wishlist.filter((w) => isPending(w.status)).length} item(ns) na fila de espera
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Economia por Desistência
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-emerald-900 mt-1">
            {formatCurrency(totalSavedByGivingUp)}
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 block mt-1">
            Dinheiro poupado ao evitar compras por impulso
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-[#DDE8E0] pb-2">
        {[
          { id: 'pending', label: 'Planejados' },
          { id: 'bought', label: 'Comprados' },
          { id: 'given_up', label: 'Desistências (Economia)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-[#DCFCE7] text-[#14532D]'
                : 'text-[#68736C] hover:text-[#18201B] hover:bg-[#F6FAF7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="Nenhum item nesta lista"
          description="Adicione itens que você tem vontade de comprar para pensar com calma antes de gastar."
          actionLabel="Novo Desejo"
          onAction={onOpenAddWishlist}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const priorityColor =
              item.priority === 'high'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : item.priority === 'medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200';

            const priorityLabel =
              item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa';

            return (
              <div
                key={item.id}
                className="p-5 bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityColor}`}
                    >
                      Prioridade {priorityLabel}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditWishlist(item)}
                        className="p-1 text-[#68736C] hover:text-[#18201B] rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1 text-[#68736C] hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#0D3B22] mt-2">{item.name}</h4>
                  <p className="text-xl font-black text-[#18201B] mt-1">
                    {formatCurrency(item.estimated_amount)}
                  </p>

                  {item.external_link && (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#22C55E] hover:underline mt-2"
                    >
                      <span>Ver produto / loja</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {item.description && <p className="text-xs text-[#68736C] mt-2">{item.description}</p>}
                </div>

                {/* Ações para itens Pendentes */}
                {isPending(item.status) && (
                  <div className="pt-3 border-t border-[#DDE8E0]/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemToPurchase(item)}
                      className="flex-1 py-1.5 px-2.5 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      <span>Comprar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWishlistItem(item.id, { status: 'cancelled' })}
                      className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-[#68736C] text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Desistir</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Escolha: Comprar à vista ou parcelado? (Seção 18) */}
      {itemToPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#DDE8E0] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0D3B22]">Como foi realizada a compra?</h3>
            <p className="text-xs text-[#68736C]">
              Ao marcar "{itemToPurchase.name}" como comprado, integraremos o valor às suas contas:
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const item = itemToPurchase;
                  setItemToPurchase(null);
                  updateWishlistItem(item.id, { status: 'purchased' });
                  onConvertWishlistToTransaction(item);
                }}
                className="w-full p-3 rounded-xl border border-[#DDE8E0] hover:bg-emerald-50 hover:border-[#22C55E] text-left flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-emerald-100 text-[#22C55E] rounded-lg">
                  <Wallet size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0D3B22]">À Vista (Débito ou Pix)</h4>
                  <p className="text-[11px] text-[#68736C]">Gera uma despesa única no mês atual</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = itemToPurchase;
                  setItemToPurchase(null);
                  updateWishlistItem(item.id, { status: 'purchased' });
                  onConvertWishlistToInstallment(item);
                }}
                className="w-full p-3 rounded-xl border border-[#DDE8E0] hover:bg-amber-50 hover:border-[#F4B942] text-left flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0D3B22]">Parcelado no Cartão</h4>
                  <p className="text-[11px] text-[#68736C]">Divide o valor em X parcelas mensais</p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setItemToPurchase(null)}
                className="text-xs font-bold text-[#68736C] hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Exclusão */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Excluir Desejo"
        message={`Deseja remover "${itemToDelete?.name}" da sua lista de desejos?`}
        confirmLabel="Sim, remover"
        onConfirm={() => {
          if (itemToDelete) {
            deleteWishlistItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
