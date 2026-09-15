import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ShoppingList, ShoppingItem } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/calculations';
import { MascotMessage } from '../common/MascotMessage';

interface MercadoViewProps {
  initialListId?: string;
  onNavigateTab?: (tab: string) => void;
}

export const MercadoView: React.FC<MercadoViewProps> = ({ initialListId, onNavigateTab }) => {
  const {
    currentSpace,
    shoppingLists,
    shoppingItems,
    shoppingPriceReferences,
    createShoppingList,
    updateShoppingList,
    deleteShoppingList,
    addShoppingItem,
    updateShoppingItem,
    removeShoppingItem,
    startShopping,
    finishShopping,
    registerShoppingTransaction,
    duplicateShoppingList,
    transactions,
  } = useFinance();

  // Navigation / View State
  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'shopping' | 'completed'>('all');

  // Modals & Forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');

  // Item Addition Form state (inside Minha Lista)
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  // In-store price entry modal (inside Modo Compra)
  const [priceItemModal, setPriceItemModal] = useState<ShoppingItem | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Completion Summary modal
  const [completionSummary, setCompletionSummary] = useState<{
    list: ShoppingList;
    total: number;
    boughtCount: number;
    skippedCount: number;
  } | null>(null);

  // Quick edit item modal
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQty, setEditItemQty] = useState('1');

  // Edit List Modal
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editListNameInput, setEditListNameInput] = useState('');
  const [editListBudgetInput, setEditListBudgetInput] = useState('');

  // Synchronize initialListId if prop changes
  useEffect(() => {
    if (initialListId) {
      setSelectedListId(initialListId);
    }
  }, [initialListId]);

  // Focus price input when price modal opens
  useEffect(() => {
    if (priceItemModal && priceInputRef.current) {
      setTimeout(() => {
        priceInputRef.current?.focus();
        priceInputRef.current?.select();
      }, 100);
    }
  }, [priceItemModal]);

  // Selected List data
  const currentSelectedList = shoppingLists.find((l) => l.id === selectedListId);
  const currentItems = currentSelectedList
    ? shoppingItems.filter((i) => i.shopping_list_id === currentSelectedList.id)
    : [];

  // Handlers: Create List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const budgetVal = newListBudget ? parseFloat(newListBudget.replace(',', '.')) : undefined;
    const created = await createShoppingList(newListName.trim(), budgetVal);
    setNewListName('');
    setNewListBudget('');
    setIsCreateModalOpen(false);
    setSelectedListId(created.id);
  };

  // Handler: Add item to draft list
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedListId) return;
    const qty = parseInt(newItemQty, 10) || 1;
    await addShoppingItem(selectedListId, newItemName.trim(), qty);
    setNewItemName('');
    setNewItemQty('1');
    itemNameInputRef.current?.focus();
  };

  // Handler: Open Price modal for item check
  const handleOpenPriceModal = (item: ShoppingItem) => {
    setPriceItemModal(item);
    // Pre-fill with current unit_price or last_price_reference or empty
    const initialVal = item.unit_price
      ? item.unit_price.toString()
      : item.last_price_reference
      ? item.last_price_reference.toString()
      : '';
    setPriceInput(initialVal);
  };

  // Handler: Save price & put in cart
  const handleConfirmPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceItemModal) return;
    const priceVal = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(priceVal) || priceVal < 0) return;

    await updateShoppingItem(priceItemModal.id, {
      unit_price: priceVal,
      status: 'in_cart',
    });
    setPriceItemModal(null);
    setPriceInput('');
  };

  // Handler: Skip item
  const handleSkipItem = async (item: ShoppingItem) => {
    await updateShoppingItem(item.id, {
      status: 'skipped',
    });
    setPriceItemModal(null);
  };

  // Handler: Uncheck item from cart back to pending
  const handleUncheckFromCart = async (item: ShoppingItem) => {
    await updateShoppingItem(item.id, {
      status: 'pending',
    });
  };

  // Handler: Finish Shopping Mode
  const handleFinishShopping = async () => {
    if (!selectedListId) return;
    const result = await finishShopping(selectedListId);
    setCompletionSummary(result);
  };

  // Filtered lists for main screen
  const filteredLists = shoppingLists.filter((l) => {
    if (activeTab === 'draft') return l.status === 'draft';
    if (activeTab === 'shopping') return l.status === 'shopping';
    if (activeTab === 'completed') return l.status === 'completed';
    return true;
  });

  // Calculate stats for current active shopping session
  const itemsInCart = currentItems.filter((i) => i.status === 'in_cart');
  const itemsPending = currentItems.filter((i) => i.status === 'pending');
  const itemsSkipped = currentItems.filter((i) => i.status === 'skipped');
  const currentTotal = itemsInCart.reduce((acc, i) => acc + (i.subtotal || 0), 0);

  const budget = currentSelectedList?.budget || 0;
  const remainingBudget = budget > 0 ? budget - currentTotal : 0;
  const isOverBudget = budget > 0 && currentTotal > budget;

  // ==========================================
  // VIEW: SINGLE LIST DETAIL (DRAFT or SHOPPING)
  // ==========================================
  if (currentSelectedList) {
    const isShoppingMode = currentSelectedList.status === 'shopping';
    const isCompletedMode = currentSelectedList.status === 'completed';

    return (
      <div className="space-y-4 max-w-4xl mx-auto pb-24 animate-in fade-in duration-200">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-[#DDE8E0] shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedListId(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#68736C] hover:text-[#0D3B22] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Minhas Listas</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isShoppingMode
                  ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                  : isCompletedMode
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {isShoppingMode
                ? '🛒 Modo Compra'
                : isCompletedMode
                ? '✓ Concluída'
                : '📝 Em Preparação'}
            </span>

            <button
              type="button"
              onClick={() => {
                setEditingList(currentSelectedList);
                setEditListNameInput(currentSelectedList.name);
                setEditListBudgetInput(
                  currentSelectedList.budget ? currentSelectedList.budget.toString() : ''
                );
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar nome/orçamento"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Excluir esta lista de compras?')) {
                  deleteShoppingList(currentSelectedList.id);
                  setSelectedListId(null);
                }
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Excluir lista"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List Header Info */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE8E0] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0D3B22]">
                {currentSelectedList.name}
              </h1>
              <p className="text-xs text-[#68736C]">
                Criada em {formatDateBR(currentSelectedList.created_at)} •{' '}
                {currentItems.length} {currentItems.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            {/* Total / Budget display card */}
            <div className="bg-[#F6FAF7] p-3.5 rounded-xl border border-[#DDE8E0] flex items-center justify-between sm:justify-end gap-6">
              {budget > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-medium text-[#68736C] uppercase block">
                    Orçamento
                  </span>
                  <span className="text-sm font-semibold text-[#0D3B22]">
                    {formatCurrency(budget)}
                  </span>
                </div>
              )}

              <div className="text-right">
                <span className="text-[10px] font-medium text-[#68736C] uppercase block">
                  {isShoppingMode ? 'Total no Carrinho' : isCompletedMode ? 'Total Pago' : 'Total Estimado'}
                </span>
                <span
                  className={`text-lg sm:text-xl font-bold ${
                    isOverBudget ? 'text-rose-600' : 'text-[#22C55E]'
                  }`}
                >
                  {formatCurrency(currentTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Alert Progress Bar in Shopping Mode */}
          {budget > 0 && (isShoppingMode || isCompletedMode) && (
            <div className="pt-2 border-t border-[#DDE8E0]/70 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#68736C]">
                  {isOverBudget ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Acima do orçamento em {formatCurrency(currentTotal - budget)}
                    </span>
                  ) : (
                    <span>
                      Restante disponível:{' '}
                      <strong className="text-emerald-700 font-bold">
                        {formatCurrency(remainingBudget)}
                      </strong>
                    </span>
                  )}
                </span>
                <span className="font-semibold text-[#0D3B22]">
                  {Math.min(Math.round((currentTotal / budget) * 100), 999)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverBudget ? 'bg-rose-500' : 'bg-[#22C55E]'
                  }`}
                  style={{ width: `${Math.min((currentTotal / budget) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            MODE 1: MINHA LISTA (DRAFT MODE)
            ========================================== */}
        {!isShoppingMode && !isCompletedMode && (
          <div className="space-y-4">
            {/* Quick Item Input Form (Single hand mobile optimized) */}
            <form
              onSubmit={handleAddItem}
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#DDE8E0] shadow-2xs flex gap-2 items-center"
            >
              <input
                ref={itemNameInputRef}
                type="text"
                placeholder="Nome do produto (ex: Leite, Arroz, Pão)..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50 focus:bg-white transition-all placeholder:text-gray-400"
              />

              <div className="w-20 shrink-0 flex items-center bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl px-2 py-1">
                <span className="text-xs text-gray-400 mr-1 select-none">Qtd:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-[#0D3B22] focus:outline-none text-center"
                />
              </div>

              <button
                type="submit"
                disabled={!newItemName.trim()}
                className="px-4 py-2.5 bg-[#22C55E] text-white font-bold rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-40 shrink-0 text-sm flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </form>

            {/* List of Planned Items */}
            <div className="bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#DDE8E0] bg-[#F6FAF7]/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0D3B22] flex items-center gap-2">
                  <span>Itens Planejados</span>
                  <span className="bg-[#DCFCE7] text-[#16A34A] text-xs px-2 py-0.5 rounded-full font-bold">
                    {currentItems.length}
                  </span>
                </h3>
              </div>

              {currentItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#22C55E] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0D3B22] text-sm">Sua lista está vazia</h4>
                    <p className="text-xs text-[#68736C]">
                      Digite os produtos no campo acima para planejar suas compras.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0D3B22]">{item.name}</p>
                          {item.last_price_reference && item.last_price_reference > 0 && (
                            <p className="text-[11px] text-gray-400">
                              Último preço de ref: {formatCurrency(item.last_price_reference)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditItemName(item.name);
                            setEditItemQty(item.quantity.toString());
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Editar item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeShoppingItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Bar: Start Shopping */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => startShopping(currentSelectedList.id)}
                disabled={currentItems.length === 0}
                className="w-full py-3.5 px-4 bg-[#22C55E] text-white font-bold rounded-2xl hover:bg-[#16A34A] transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Ir para o Mercado (Iniciar Compra)</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            MODE 2: MODO COMPRA (SHOPPING IN-STORE MODE)
            ========================================== */}
        {isShoppingMode && (
          <div className="space-y-4">
            {/* Header Status Bar for Shopping */}
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white flex items-center justify-center font-bold">
                  🛒
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0D3B22]">Você está no mercado!</h3>
                  <p className="text-xs text-[#0D3B22]/80">
                    {itemsInCart.length} de {currentItems.length} itens no carrinho
                  </p>
                </div>
              </div>

              {/* Add item extra on the fly button */}
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Nome do novo item para adicionar à lista:');
                  if (name && name.trim()) {
                    addShoppingItem(currentSelectedList.id, name.trim(), 1);
                  }
                }}
                className="px-3 py-1.5 bg-white text-[#22C55E] font-bold text-xs rounded-xl border border-[#22C55E]/30 hover:bg-[#DCFCE7] transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Item Extra</span>
              </button>
            </div>

            {/* SECTION: PENDENTES (TO PICK) */}
            <div className="bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs overflow-hidden">
              <div className="p-3.5 sm:p-4 bg-[#F6FAF7] border-b border-[#DDE8E0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0D3B22] flex items-center gap-2">
                  <span>A Colocar no Carrinho</span>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {itemsPending.length}
                  </span>
                </h3>
                <span className="text-[11px] text-[#68736C]">Toque no produto para informar preço</span>
              </div>

              {itemsPending.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Todos os itens planejados foram coletados!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {itemsPending.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenPriceModal(item)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-emerald-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md border-2 border-gray-300 group-hover:border-[#22C55E] flex items-center justify-center transition-colors bg-white">
                          <Check className="w-3.5 h-3.5 text-transparent group-hover:text-[#22C55E]/40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0D3B22]">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Quantidade: <strong className="text-black">{item.quantity}x</strong>
                            {item.last_price_reference && item.last_price_reference > 0 ? (
                              <span className="ml-2 text-gray-400">
                                (Último preço: {formatCurrency(item.last_price_reference)})
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 bg-[#F6FAF7] text-[#22C55E] text-xs font-bold rounded-xl border border-[#DDE8E0] group-hover:bg-[#22C55E] group-hover:text-white transition-all">
                        Informar R$
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION: NO CARRINHO (PICKED & PRICED) */}
            <div className="bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs overflow-hidden">
              <div className="p-3.5 sm:p-4 bg-emerald-50/70 border-b border-[#DDE8E0] flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <span>✓ No Carrinho</span>
                  <span className="bg-[#22C55E] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {itemsInCart.length}
                  </span>
                </h3>
                <span className="text-xs font-bold text-emerald-800">
                  {formatCurrency(currentTotal)}
                </span>
              </div>

              {itemsInCart.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  Nenhum item no carrinho ainda.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {itemsInCart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between bg-emerald-50/20 hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUncheckFromCart(item)}
                          className="w-6 h-6 rounded-md bg-[#22C55E] text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                          title="Desmarcar / Voltar para pendentes"
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <div>
                          <p className="text-sm font-bold text-[#0D3B22] line-through opacity-80">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.quantity}x a {formatCurrency(item.unit_price || 0)} cada
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenPriceModal(item)}
                          className="text-xs text-gray-400 hover:text-[#0D3B22] underline"
                        >
                          Alterar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION: SKIPPED / NÃO ENCONTRADOS */}
            {itemsSkipped.length > 0 && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Não encontrados / Pulados ({itemsSkipped.length})
                  </h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {itemsSkipped.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500 line-through">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => handleUncheckFromCart(item)}
                        className="text-emerald-700 font-bold hover:underline text-xs"
                      >
                        Recuperar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Bottom Finish Button */}
            <div className="pt-2 sticky bottom-4">
              <button
                type="button"
                onClick={handleFinishShopping}
                className="w-full py-4 px-4 bg-[#22C55E] text-white font-bold rounded-2xl hover:bg-[#16A34A] transition-all text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Finalizar Compra ({formatCurrency(currentTotal)})</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            MODE 3: HISTÓRICO / COMPRA CONCLUÍDA
            ========================================== */}
        {isCompletedMode && (
          <div className="space-y-4">
            <div className="bg-[#DCFCE7] border border-[#22C55E]/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-[#0D3B22] text-lg">Compra Concluída</h3>
                  <p className="text-xs text-[#0D3B22]/80">
                    Finalizada em {formatDateBR(currentSelectedList.completed_at || currentSelectedList.created_at)}
                  </p>
                </div>
              </div>

              {/* Transaction Registration Banner */}
              <div className="bg-white p-4 rounded-xl border border-[#22C55E]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs text-[#68736C] block">Integração Financeira</span>
                  <p className="text-sm font-bold text-[#0D3B22]">
                    {currentSelectedList.financial_transaction_id
                      ? '✓ Lançamento financeiro registrado com sucesso!'
                      : `Registrar ${formatCurrency(currentSelectedList.total)} nas suas finanças?`}
                  </p>
                </div>

                {!currentSelectedList.financial_transaction_id && (
                  <button
                    type="button"
                    onClick={() => registerShoppingTransaction(currentSelectedList.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-[#22C55E] text-white font-bold text-xs rounded-xl hover:bg-[#16A34A] transition-colors shrink-0 shadow-2xs"
                  >
                    Registrar Finanças Agora
                  </button>
                )}
              </div>
            </div>

            {/* Items Purchased List */}
            <div className="bg-white rounded-2xl border border-[#DDE8E0] shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-[#DDE8E0] bg-[#F6FAF7] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0D3B22]">Resumo dos Produtos Adquiridos</h3>
                <span className="text-xs font-bold text-[#22C55E]">
                  Total: {formatCurrency(currentSelectedList.total)}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {currentItems.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0D3B22]">{item.name}</span>
                      <span className="text-gray-400 ml-2">({item.quantity}x)</span>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {item.status === 'in_cart'
                        ? `${formatCurrency(item.subtotal)} (${formatCurrency(item.unit_price || 0)} ea)`
                        : 'Não comprado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-use this list button */}
            <button
              type="button"
              onClick={async () => {
                const dup = await duplicateShoppingList(currentSelectedList.id);
                setSelectedListId(dup.id);
              }}
              className="w-full py-3.5 px-4 bg-white text-[#0D3B22] border border-[#DDE8E0] font-bold rounded-2xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-[#22C55E]" />
              <span>Usar esta lista novamente em uma nova compra</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN LISTS OVERVIEW (ROOT SCREEN)
  // ==========================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#DDE8E0] shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-2xl shrink-0 shadow-2xs">
            🛒
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0D3B22]">Mercado</h1>
            <p className="text-xs sm:text-sm text-[#68736C]">
              Crie sua lista em casa e acompanhe o total da compra em tempo real.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 bg-[#22C55E] text-white font-bold text-sm rounded-2xl hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Lista</span>
        </button>
      </div>

      {/* Mascot tip */}
      <MascotMessage
        message="Dica do Poupagaio: Defina um orçamento prévio para sua lista e informe os preços enquanto coloca no carrinho. Isso evita surpresas no caixa!"
        type="tip"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDE8E0] pb-2 overflow-x-auto">
        {(
          [
            { id: 'all', label: 'Todas as Listas' },
            { id: 'draft', label: 'Em Preparação' },
            { id: 'shopping', label: 'Em Andamento' },
            { id: 'completed', label: 'Concluídas' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0D3B22] text-white shadow-2xs'
                : 'bg-white text-[#68736C] border border-[#DDE8E0] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lists Grid / Cards */}
      {filteredLists.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#DDE8E0] shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#22C55E] flex items-center justify-center mx-auto">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-[#0D3B22] text-base">Nenhuma lista encontrada</h3>
            <p className="text-xs text-[#68736C] max-w-sm mx-auto mt-1">
              Comece criando uma lista de compras para supermercado ou feira.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#22C55E] text-white font-bold text-xs rounded-xl hover:bg-[#16A34A] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira lista</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => {
            const listItems = shoppingItems.filter((i) => i.shopping_list_id === list.id);
            const isShopping = list.status === 'shopping';
            const isCompleted = list.status === 'completed';

            return (
              <div
                key={list.id}
                className="bg-white rounded-2xl p-5 border border-[#DDE8E0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isShopping
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isShopping ? '🛒 Em andamento' : isCompleted ? '✓ Concluída' : '📝 Em preparação'}
                    </span>

                    <span className="text-[11px] text-[#68736C]">
                      {formatDateBR(list.created_at)}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0D3B22] text-lg group-hover:text-[#22C55E] transition-colors">
                    {list.name}
                  </h3>

                  <p className="text-xs text-[#68736C]">
                    {listItems.length} {listItems.length === 1 ? 'item' : 'itens'}
                    {list.budget ? ` • Orçamento: ${formatCurrency(list.budget)}` : ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#68736C] font-semibold block">
                      {isCompleted ? 'Total gasto' : 'Total acumulado'}
                    </span>
                    <span className="text-base font-bold text-[#0D3B22]">
                      {formatCurrency(list.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const dup = await duplicateShoppingList(list.id);
                          setSelectedListId(dup.id);
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1"
                        title="Usar lista novamente"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reutilizar</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSelectedListId(list.id)}
                      className="px-3.5 py-1.5 bg-[#22C55E] text-white font-bold text-xs rounded-xl hover:bg-[#16A34A] transition-colors"
                    >
                      {isShopping ? 'Continuar compra →' : 'Abrir lista'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          MODAL 1: CRIAR NOVA LISTA
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#DDE8E0] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DDE8E0] pb-3">
              <h3 className="font-bold text-[#0D3B22] text-lg flex items-center gap-2">
                <span>🛒 Nova Lista de Mercado</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase mb-1">
                  Nome da Lista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compras da semana, Feira de sábado..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase mb-1">
                  Orçamento limite (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#68736C]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newListBudget}
                    onChange={(e) => setNewListBudget(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50"
                  />
                </div>
                <p className="text-[11px] text-[#68736C] mt-1">
                  Você poderá comparar o valor gasto com este limite durante as compras.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-5 py-2.5 bg-[#22C55E] text-white font-bold text-xs rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-50 shadow-2xs"
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: INFORMAR PREÇO EM TEMPO REAL (IN-STORE)
          ========================================== */}
      {priceItemModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-sm border border-[#DDE8E0] shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#DDE8E0] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Informe o Preço Encontrado
                </span>
                <h3 className="font-bold text-[#0D3B22] text-lg mt-0.5">
                  {priceItemModal.name} ({priceItemModal.quantity}x)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPriceItemModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase mb-1">
                  Preço unitário no supermercado
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-base font-bold text-[#22C55E]">
                    R$
                  </span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-3 bg-[#F6FAF7] border-2 border-[#22C55E] rounded-2xl text-xl font-bold text-[#0D3B22] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                </div>
              </div>

              {/* Calculated Subtotal */}
              {priceInput && parseFloat(priceInput) > 0 && (
                <div className="bg-[#DCFCE7]/70 p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#0D3B22] font-semibold">Subtotal ({priceItemModal.quantity}x):</span>
                  <span className="font-bold text-[#16A34A] text-sm">
                    {formatCurrency(parseFloat(priceInput.replace(',', '.')) * priceItemModal.quantity)}
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={!priceInput || parseFloat(priceInput) <= 0}
                  className="w-full py-3.5 bg-[#22C55E] text-white font-bold text-sm rounded-2xl hover:bg-[#16A34A] transition-colors disabled:opacity-40 shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Colocar no carrinho</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSkipItem(priceItemModal)}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Não encontrei / Pular este produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: COMPRA FINALIZADA & RESUMO
          ========================================== */}
      {completionSummary && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md border border-[#DDE8E0] shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-3xl mx-auto shadow-sm">
              🦜
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#0D3B22]">Compra Concluída!</h3>
              <p className="text-xs text-[#68736C] mt-1">
                Sua lista foi atualizada com os valores reais pagos.
              </p>
            </div>

            <div className="bg-[#F6FAF7] p-4 rounded-2xl border border-[#DDE8E0] grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] text-[#68736C] uppercase font-bold block">
                  Itens Comprados
                </span>
                <span className="text-sm font-bold text-[#0D3B22]">
                  {completionSummary.boughtCount} itens
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#68736C] uppercase font-bold block">
                  Total Final
                </span>
                <span className="text-base font-bold text-[#22C55E]">
                  {formatCurrency(completionSummary.total)}
                </span>
              </div>
            </div>

            {/* Prompt for Financial Transaction */}
            <div className="bg-[#22C55E]/10 p-4 rounded-2xl border border-[#22C55E]/30 space-y-2 text-left">
              <span className="text-xs font-bold text-[#0D3B22]">Registrar nas finanças?</span>
              <p className="text-xs text-[#0D3B22]/80">
                Lançar {formatCurrency(completionSummary.total)} como gasto de Mercado no mês de {formatDateBR(new Date().toISOString()).slice(3)}?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await registerShoppingTransaction(completionSummary.list.id);
                  setCompletionSummary(null);
                }}
                className="w-full py-3.5 bg-[#22C55E] text-white font-bold text-sm rounded-2xl hover:bg-[#16A34A] transition-all shadow-md"
              >
                Sim, registrar no Poupagaio
              </button>

              <button
                type="button"
                onClick={() => setCompletionSummary(null)}
                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Agora não (Manter apenas na lista)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs space-y-3">
            <h4 className="font-bold text-sm text-[#0D3B22]">Editar Item</h4>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome</label>
              <input
                type="text"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                value={editItemQty}
                onChange={(e) => setEditItemQty(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editItemName.trim()) {
                    await updateShoppingItem(editingItem.id, {
                      name: editItemName.trim(),
                      quantity: parseInt(editItemQty, 10) || 1,
                    });
                  }
                  setEditingItem(null);
                }}
                className="px-3 py-1.5 bg-[#22C55E] text-white text-xs font-bold rounded-xl"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LIST MODAL */}
      {editingList && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h4 className="font-bold text-sm text-[#0D3B22]">Editar Lista</h4>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome da Lista</label>
              <input
                type="text"
                value={editListNameInput}
                onChange={(e) => setEditListNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Orçamento (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editListBudgetInput}
                onChange={(e) => setEditListBudgetInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingList(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editListNameInput.trim()) {
                    const b = editListBudgetInput ? parseFloat(editListBudgetInput.replace(',', '.')) : undefined;
                    await updateShoppingList(editingList.id, {
                      name: editListNameInput.trim(),
                      budget: b,
                    });
                  }
                  setEditingList(null);
                }}
                className="px-3 py-1.5 bg-[#22C55E] text-white text-xs font-bold rounded-xl"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
