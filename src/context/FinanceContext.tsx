import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Profile,
  FinancialSpace,
  SpaceMember,
  Category,
  Transaction,
  InstallmentPurchase,
  Installment,
  Investment,
  InvestmentMovement,
  Goal,
  GoalMovement,
  WishlistItem,
  MonthlyPlan,
  MonthlyClosing,
  NotificationItem,
  AuditLog,
  ShoppingList,
  ShoppingItem,
  ShoppingPriceReference,
} from '../types';
import {
  INITIAL_USER,
  PARTNER_USER,
  INITIAL_SPACES,
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_INSTALLMENT_PURCHASES,
  INITIAL_INSTALLMENTS,
  INITIAL_INVESTMENTS,
  INITIAL_GOALS,
  INITIAL_GOAL_MOVEMENTS,
  INITIAL_WISHLIST,
  INITIAL_MONTHLY_PLANS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SHOPPING_LISTS,
  INITIAL_SHOPPING_ITEMS,
} from '../data/mockInitialData';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { computeAccountStatus, evaluateMonthClosing } from '../lib/calculations';
import {
  supabase,
  loginUserWithSupabase,
  registerUserWithSupabase,
  updateUserPasswordWithSupabase,
  updateUserProfileMetadataWithSupabase,
} from '../lib/supabase';
import {
  saveToFirestore,
  deleteFromFirestore,
  seedSpaceDataIfEmpty,
  saveUserDataToCloud,
  subscribeToUserDataCloud,
} from '../lib/firestoreSync';

interface FinanceContextType {
  // Auth & Perfil
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  accessWallet: (name: string, email: string) => Promise<boolean>;
  login: (email: string, pass: string, authenticatedUser?: any) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (name: string, email: string, pass: string, phone?: string, authenticatedUser?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile> & { first_name?: string; last_name?: string }) => void;
  changePassword: (newPass: string) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: (usageType: 'individual' | 'shared') => void;

  // Espaços
  spaces: FinancialSpace[];
  currentSpace: FinancialSpace | null;
  currentSpaceRole: 'admin' | 'member';
  spaceMembers: SpaceMember[];
  switchSpace: (spaceId: string) => void;
  createSpace: (name: string, isShared: boolean) => Promise<FinancialSpace>;
  updateSpaceName: (spaceId: string, name: string) => void;
  inviteMemberToSpace: (spaceId: string, email: string) => Promise<void>;
  removeMemberFromSpace: (memberId: string) => void;
  leaveSpace: (spaceId: string) => void;
  transferSpaceAdmin: (spaceId: string, newAdminUserId: string) => void;

  // Navegação de Mês
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;

  // Categorias
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;

  // Lançamentos e Transações
  transactions: Transaction[];
  addTransaction: (
    data: Omit<Transaction, 'id' | 'created_at' | 'created_by' | 'status'>
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    data: Partial<Transaction>,
    recurrenceScope?: 'only_this_month' | 'this_and_future'
  ) => void;
  deleteTransaction: (id: string) => void;
  markTransactionAsPaid: (
    id: string,
    paidDate?: string,
    paidAmount?: number,
    updateFutureRecurring?: boolean
  ) => void;

  // Parcelamentos
  installmentPurchases: InstallmentPurchase[];
  installments: Installment[];
  addInstallmentPurchase: (
    data: Omit<InstallmentPurchase, 'id' | 'created_at' | 'created_by'>
  ) => Promise<void>;
  anticipateInstallment: (installmentId: string) => void;
  payInstallment: (
    installmentId: string,
    paidDate?: string,
    paidAmount?: number
  ) => void;
  updateInstallment: (
    installmentId: string,
    data: Partial<Installment>,
    applyTo?: 'single' | 'future'
  ) => void;
  deleteInstallment: (
    installmentId: string,
    applyTo?: 'single' | 'future'
  ) => void;
  deleteInstallmentPurchase: (purchaseId: string) => void;

  // Investimentos
  investments: Investment[];
  addInvestment: (data: Omit<Investment, 'id' | 'created_at'>) => void;
  updateInvestment: (id: string, data: Partial<Investment>) => void;
  addInvestmentMovement: (
    invId: string,
    type: 'deposit' | 'withdraw' | 'yield_update',
    amount: number,
    notes?: string
  ) => void;

  // Metas
  goals: Goal[];
  goalMovements: GoalMovement[];
  addGoal: (data: Omit<Goal, 'id' | 'created_at' | 'saved_amount'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, notes?: string) => boolean;
  withdrawFromGoal: (goalId: string, amount: number, reason: string) => boolean;

  // Lista de Desejos
  wishlist: WishlistItem[];
  addWishlistItem: (data: Omit<WishlistItem, 'id' | 'created_at'>) => void;
  updateWishlistItem: (id: string, data: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  convertWishlistToExpense: (
    wishId: string,
    mode: 'expense' | 'installment',
    options?: { installmentsCount?: number; creditCardId?: string }
  ) => void;

  // Planejamento Mensal
  monthlyPlans: MonthlyPlan[];
  saveMonthlyPlan: (plan: Omit<MonthlyPlan, 'id' | 'space_id'>) => void;

  // Fechamento do Mês
  monthlyClosings: MonthlyClosing[];
  closeCurrentMonth: (destination: MonthlyClosing['leftover_destination'], goalId?: string) => MonthlyClosing;
  reopenMonth: (refMonth: string, reason: string) => void;

  // Notificações
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Mercado / Lista de Compras
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingItem[];
  shoppingPriceReferences: Record<string, number>;
  createShoppingList: (name: string, budget?: number) => Promise<ShoppingList>;
  updateShoppingList: (id: string, updates: Partial<ShoppingList>) => Promise<void>;
  deleteShoppingList: (id: string) => Promise<void>;
  addShoppingItem: (listId: string, name: string, quantity?: number) => Promise<ShoppingItem>;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;
  startShopping: (listId: string) => Promise<void>;
  finishShopping: (
    listId: string
  ) => Promise<{ list: ShoppingList; total: number; boughtCount: number; skippedCount: number }>;
  registerShoppingTransaction: (listId: string) => Promise<Transaction | null>;
  duplicateShoppingList: (listId: string, newName?: string) => Promise<ShoppingList>;

  // Auditoria
  auditLogs: AuditLog[];

  // Toast Feedback
  toast: {
    message: string;
    type: 'success' | 'info' | 'error';
  } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: () => void;

  // Utilitários de Estado
  resetToMockData: () => void;
  resetDemoData: () => void;
  zeroAllValues: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'poupagaio_user',
  ONBOARDED: 'poupagaio_onboarded',
  SELECTED_SPACE_ID: 'poupagaio_selected_space_id',
  SELECTED_MONTH: 'poupagaio_selected_month',
  SPACES: 'poupagaio_spaces_data',
  MEMBERS: 'poupagaio_members_data',
  CATEGORIES: 'poupagaio_categories_data',
  TRANSACTIONS: 'poupagaio_transactions_data',
  PURCHASES: 'poupagaio_purchases_data',
  INSTALLMENTS: 'poupagaio_installments_data',
  INVESTMENTS: 'poupagaio_investments_data',
  GOALS: 'poupagaio_goals_data',
  GOAL_MOVEMENTS: 'poupagaio_goal_movements_data',
  WISHLIST: 'poupagaio_wishlist_data',
  PLANS: 'poupagaio_plans_data',
  CLOSINGS: 'poupagaio_closings_data',
  NOTIFICATIONS: 'poupagaio_notifications_data',
  AUDIT: 'poupagaio_audit_data',
  SHOPPING_LISTS: 'poupagaio_shopping_lists_data',
  SHOPPING_ITEMS: 'poupagaio_shopping_items_data',
  SHOPPING_PRICES: 'poupagaio_shopping_prices_data',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Estado de Auth & Perfil
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.full_name === 'Mateus Silva') {
          parsed.full_name = 'Mateus Araujo';
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDED);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 2. Mês Selecionado (Padrão: 2026-09)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
    return saved || '2026-09';
  });

  // 3. Espaços e Membros
  const [spaces, setSpaces] = useState<FinancialSpace[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPACES);
    return saved ? JSON.parse(saved) : INITIAL_SPACES;
  });

  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_SPACE_ID);
    return saved || 'space-couple-02';
  });

  // 4. Categorias
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // 5. Transações
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // 6. Parcelas
  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return saved ? JSON.parse(saved) : INITIAL_INSTALLMENT_PURCHASES;
  });

  const [installments, setInstallments] = useState<Installment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    return saved ? JSON.parse(saved) : INITIAL_INSTALLMENTS;
  });

  // 7. Investimentos
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
  });

  // 8. Metas
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [goalMovements, setGoalMovements] = useState<GoalMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOAL_MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_GOAL_MOVEMENTS;
  });

  // 9. Lista de Desejos
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    return saved ? JSON.parse(saved) : INITIAL_WISHLIST;
  });

  // 10. Planejamento Mensal
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_PLANS;
  });

  // 11. Fechamentos Mensais
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOSINGS);
    return saved ? JSON.parse(saved) : [];
  });

  // 12. Notificações
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // 13. Auditoria
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // 14. Mercado / Lista de Compras
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_LISTS;
  });

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_ITEMS;
  });

  const [shoppingPriceReferences, setShoppingPriceReferences] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_PRICES);
    return saved ? JSON.parse(saved) : {};
  });

  // 15. Toast Feedback
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Sincronização LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, JSON.stringify(isOnboarded));
  }, [isOnboarded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SPACE_ID, selectedSpaceId);
  }, [selectedSpaceId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(spaces));
  }, [spaces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(spaceMembers));
  }, [spaceMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(installmentPurchases));
  }, [installmentPurchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments));
  }, [installments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOAL_MOVEMENTS, JSON.stringify(goalMovements));
  }, [goalMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(monthlyPlans));
  }, [monthlyPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(monthlyClosings));
  }, [monthlyClosings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_ITEMS, JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_PRICES, JSON.stringify(shoppingPriceReferences));
  }, [shoppingPriceReferences]);

  // Espaço Ativo Atual
  const currentSpace =
    spaces.find((s) => s.id === selectedSpaceId) ||
    spaces[0] ||
    null;

  const currentMember = spaceMembers.find(
    (m) => m.space_id === currentSpace?.id && m.user_id === currentUser?.id
  );
  const currentSpaceRole = currentMember?.role || (currentSpace?.owner_id === currentUser?.id ? 'admin' : 'member');

  // Registrar Log de Auditoria
  const logAudit = (action: string, entityType: string, entityId?: string, details?: any) => {
    if (!currentSpace) return;
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
      space_id: currentSpace.id,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveToFirestore('audit_logs', newLog.id, newLog);
  };

  // Carrega e sincroniza em tempo real dados do usuário (LocalStorage + Cloud Firestore para múltiplos dispositivos)
  useEffect(() => {
    if (!currentUser?.id) return;

    // 1. Carrega de imediato do LocalStorage (se existir) para renderização instantânea sem latency
    const userKey = `poupagaio_user_data_${currentUser.id}`;
    const savedData = localStorage.getItem(userKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.spaces) setSpaces(parsed.spaces);
        if (parsed.selectedSpaceId) setSelectedSpaceId(parsed.selectedSpaceId);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.installmentPurchases) setInstallmentPurchases(parsed.installmentPurchases);
        if (parsed.installments) setInstallments(parsed.installments);
        if (parsed.investments) setInvestments(parsed.investments);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.goalMovements) setGoalMovements(parsed.goalMovements);
        if (parsed.wishlist) setWishlist(parsed.wishlist);
        if (parsed.monthlyPlans) setMonthlyPlans(parsed.monthlyPlans);
        if (parsed.monthlyClosings) setMonthlyClosings(parsed.monthlyClosings);
        if (parsed.shoppingLists) setShoppingLists(parsed.shoppingLists);
        if (parsed.shoppingItems) setShoppingItems(parsed.shoppingItems);
        if (parsed.shoppingPriceReferences) setShoppingPriceReferences(parsed.shoppingPriceReferences);
      } catch (e) {
        // Fallback gracioso
      }
    } else if (currentUser.id !== 'user-mateus-01' && currentUser.id !== 'user-luana-02') {
      // Novo usuário: Inicializa com ambiente isolado limpo
      const personalSpace: FinancialSpace = {
        id: 'space-' + currentUser.id,
        name: 'Minhas finanças',
        is_shared: false,
        owner_id: currentUser.id,
        created_at: new Date().toISOString(),
        members_count: 1,
      };

      const adminMember: SpaceMember = {
        id: 'mem-' + currentUser.id,
        space_id: personalSpace.id,
        user_id: currentUser.id,
        role: 'admin',
        user: currentUser,
        created_at: new Date().toISOString(),
      };

      const userCategories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        id: `cat-${personalSpace.id}-${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        space_id: personalSpace.id,
      }));

      setSpaces([personalSpace]);
      setSpaceMembers([adminMember]);
      setSelectedSpaceId(personalSpace.id);
      setCategories(userCategories);
      setTransactions([]);
      setInstallmentPurchases([]);
      setInstallments([]);
      setInvestments([]);
      setGoals([]);
      setGoalMovements([]);
      setWishlist([]);
      setMonthlyPlans([]);
      setMonthlyClosings([]);
      setShoppingLists([]);
      setShoppingItems([]);
      setShoppingPriceReferences({});
    }

    // 2. Inscreve no listener de sincronização em nuvem (permitindo sincronização Celular <-> Computador em tempo real)
    const unsubCloud = subscribeToUserDataCloud(currentUser.id, (remoteData) => {
      if (!remoteData) return;
      if (remoteData.spaces) setSpaces(remoteData.spaces);
      if (remoteData.selectedSpaceId) setSelectedSpaceId(remoteData.selectedSpaceId);
      if (remoteData.categories) setCategories(remoteData.categories);
      if (remoteData.transactions) setTransactions(remoteData.transactions);
      if (remoteData.installmentPurchases) setInstallmentPurchases(remoteData.installmentPurchases);
      if (remoteData.installments) setInstallments(remoteData.installments);
      if (remoteData.investments) setInvestments(remoteData.investments);
      if (remoteData.goals) setGoals(remoteData.goals);
      if (remoteData.goalMovements) setGoalMovements(remoteData.goalMovements);
      if (remoteData.wishlist) setWishlist(remoteData.wishlist);
      if (remoteData.monthlyPlans) setMonthlyPlans(remoteData.monthlyPlans);
      if (remoteData.monthlyClosings) setMonthlyClosings(remoteData.monthlyClosings);
      if (remoteData.shoppingLists) setShoppingLists(remoteData.shoppingLists);
      if (remoteData.shoppingItems) setShoppingItems(remoteData.shoppingItems);
      if (remoteData.shoppingPriceReferences) setShoppingPriceReferences(remoteData.shoppingPriceReferences);
    });

    return () => {
      unsubCloud();
    };
  }, [currentUser?.id]);

  // Salva dados do usuário no LocalStorage e no Cloud Firestore em tempo real
  useEffect(() => {
    if (!currentUser?.id) return;
    const userKey = `poupagaio_user_data_${currentUser.id}`;
    const userData = {
      spaces,
      selectedSpaceId,
      categories,
      transactions,
      installmentPurchases,
      installments,
      investments,
      goals,
      goalMovements,
      wishlist,
      monthlyPlans,
      monthlyClosings,
      shoppingLists,
      shoppingItems,
      shoppingPriceReferences,
    };
    localStorage.setItem(userKey, JSON.stringify(userData));
    saveUserDataToCloud(currentUser.id, userData);
  }, [
    currentUser?.id,
    spaces,
    selectedSpaceId,
    categories,
    transactions,
    installmentPurchases,
    installments,
    investments,
    goals,
    goalMovements,
    wishlist,
    monthlyPlans,
    monthlyClosings,
    shoppingLists,
    shoppingItems,
    shoppingPriceReferences,
  ]);

  // Monitora alterações de autenticação exclusivamente no Supabase Auth e trata o callback (Seções 7 e 13)
  useEffect(() => {
    if (!supabase) return;

    // Trata callback de troca de código por sessão (PKCE flow)
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const path = window.location.pathname;

      if (code || path.includes('/auth/callback')) {
        try {
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[Supabase PKCE Exchange Error]', error);
            } else if (data?.session) {
              console.log('[Supabase PKCE Exchange Success] Session established');
            }
          }
        } catch (err) {
          console.error('[Supabase PKCE Exchange Exception]', err);
        } finally {
          // Redireciona de volta limpando o callback e preservando uma experiência fluida
          const cleanUrl = window.location.origin + window.location.pathname.replace('/auth/callback', '');
          window.history.replaceState({}, '', cleanUrl);
        }
      }
    };

    handleCallback();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userObj = session.user;
        const first_name = userObj.user_metadata?.first_name || '';
        const last_name = userObj.user_metadata?.last_name || '';
        const full_name = userObj.user_metadata?.full_name || 
                          (first_name || last_name ? `${first_name} ${last_name}`.trim() : '') ||
                          userObj.user_metadata?.name ||
                          userObj.email?.split('@')[0] ||
                          'Usuário Poupagaio';
        const profile: Profile = {
          id: userObj.id,
          email: userObj.email || '',
          full_name,
          first_name,
          last_name,
          phone: userObj.user_metadata?.phone || userObj.phone || '',
          avatar_url: userObj.user_metadata?.avatar_url,
          due_alert_days: 3,
          created_at: userObj.created_at || new Date().toISOString(),
        };
        setCurrentUser(profile);
        saveToFirestore('users', profile.id, profile);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userObj = session.user;
        const first_name = userObj.user_metadata?.first_name || '';
        const last_name = userObj.user_metadata?.last_name || '';
        const full_name = userObj.user_metadata?.full_name || 
                          (first_name || last_name ? `${first_name} ${last_name}`.trim() : '') ||
                          userObj.user_metadata?.name ||
                          userObj.email?.split('@')[0] ||
                          'Usuário Poupagaio';
        const profile: Profile = {
          id: userObj.id,
          email: userObj.email || '',
          full_name,
          first_name,
          last_name,
          phone: userObj.user_metadata?.phone || userObj.phone || '',
          avatar_url: userObj.user_metadata?.avatar_url,
          due_alert_days: 3,
          created_at: userObj.created_at || new Date().toISOString(),
        };
        setCurrentUser(profile);
        saveToFirestore('users', profile.id, profile);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Autenticação com Google via Supabase OAuth
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          console.warn('[Supabase Google Auth Notice]', error.message);
          return false;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[Supabase Google Auth Exception]', err);
      return false;
    }
  };

  const accessWallet = async (name: string, email: string): Promise<boolean> => {
    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!cleanName || !normalizedEmail) {
      showToast('Por favor, informe seu nome e e-mail.', 'error');
      return false;
    }

    let profileId = '';
    const profilesStorageKey = 'poupagaio_all_profiles';
    const allProfilesRaw = localStorage.getItem(profilesStorageKey);
    const allProfiles: Record<string, Profile> = allProfilesRaw ? JSON.parse(allProfilesRaw) : {};

    if (allProfiles[normalizedEmail]) {
      profileId = allProfiles[normalizedEmail].id;
    } else {
      profileId = 'prof-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
    }

    const profile: Profile = {
      id: profileId,
      email: normalizedEmail,
      full_name: cleanName,
      first_name: cleanName.split(' ')[0],
      last_name: cleanName.split(' ').slice(1).join(' '),
      phone: '',
      due_alert_days: 3,
      created_at: allProfiles[normalizedEmail]?.created_at || new Date().toISOString(),
    };

    allProfiles[normalizedEmail] = profile;
    localStorage.setItem(profilesStorageKey, JSON.stringify(allProfiles));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    setCurrentUser(profile);
    setIsOnboarded(true);

    showToast(`Bem-vindo, ${cleanName}! 🦜`, 'success');
    return true;
  };

  const login = async (email: string, pass: string, authenticatedUser?: any): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Se um usuário do Supabase Auth / Local já foi autenticado e passado
    if (authenticatedUser?.id) {
      const profile: Profile = {
        id: authenticatedUser.id,
        email: authenticatedUser.email || normalizedEmail,
        full_name:
          authenticatedUser.user_metadata?.full_name ||
          authenticatedUser.full_name ||
          normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
        phone: authenticatedUser.user_metadata?.phone || authenticatedUser.phone || '',
        avatar_url: authenticatedUser.user_metadata?.avatar_url || authenticatedUser.avatar_url,
        due_alert_days: 3,
        created_at: authenticatedUser.created_at || new Date().toISOString(),
      };
      setCurrentUser(profile);
      saveToFirestore('users', profile.id, profile);
      return true;
    }

    if (pass && pass.length < 8) return false;

    // 2. Se o Supabase Auth está ativo, efetua a autenticação direta
    if (supabase) {
      const res = await loginUserWithSupabase(normalizedEmail, pass);
      if (res.success && res.user) {
        const profile: Profile = {
          id: res.user.id,
          email: res.user.email || normalizedEmail,
          full_name:
            res.user.user_metadata?.full_name ||
            res.user.full_name ||
            normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
          phone: res.user.user_metadata?.phone || res.user.phone || '',
          avatar_url: res.user.user_metadata?.avatar_url,
          due_alert_days: 3,
          created_at: res.user.created_at || new Date().toISOString(),
        };
        setCurrentUser(profile);
        saveToFirestore('users', profile.id, profile);
        return true;
      }
    }

    // 3. Fallback no armazenamento de usuários simulados locais
    const rawSim = localStorage.getItem('poupagaio_simulated_users');
    if (rawSim) {
      try {
        const simUsers = JSON.parse(rawSim);
        const simUser = simUsers[normalizedEmail];
        if (simUser) {
          const profile: Profile = {
            id: simUser.id,
            email: simUser.email,
            full_name: simUser.full_name || normalizedEmail.split('@')[0],
            due_alert_days: 3,
            created_at: simUser.created_at || new Date().toISOString(),
          };
          setCurrentUser(profile);
          saveToFirestore('users', profile.id, profile);
          return true;
        }
      } catch (e) {
        // ignore
      }
    }

    // 4. Fallback de demonstração para contas de teste Mateus e Luana
    if (normalizedEmail === 'mateus@email.com') {
      setCurrentUser(INITIAL_USER);
      saveToFirestore('users', INITIAL_USER.id, INITIAL_USER);
      return true;
    }
    if (normalizedEmail === 'luana@email.com') {
      setCurrentUser(PARTNER_USER);
      saveToFirestore('users', PARTNER_USER.id, PARTNER_USER);
      return true;
    }

    // 5. Perfil de fallback com ID determinístico
    const fallbackId = 'user-' + normalizedEmail.replace(/[^a-z0-9]/g, '-');
    const demoUser: Profile = {
      id: fallbackId,
      email: normalizedEmail,
      full_name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
      due_alert_days: 3,
      created_at: new Date().toISOString(),
    };
    setCurrentUser(demoUser);
    saveToFirestore('users', demoUser.id, demoUser);
    return true;
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    phone?: string,
    authenticatedUser?: any
  ): Promise<boolean> => {
    if (!name.trim() || !email.trim()) return false;
    if (!authenticatedUser && pass && pass.length < 8) return false;
    const normalizedEmail = email.trim().toLowerCase();

    let newUserId = authenticatedUser?.id;

    if (!newUserId && supabase) {
      const res = await registerUserWithSupabase({ name, email: normalizedEmail, phone, password: pass });
      if (res.user?.id) {
        newUserId = res.user.id;
      }
    }

    if (!newUserId) {
      const rawSim = localStorage.getItem('poupagaio_simulated_users');
      if (rawSim) {
        try {
          const simUsers = JSON.parse(rawSim);
          if (simUsers[normalizedEmail]?.id) {
            newUserId = simUsers[normalizedEmail].id;
          }
        } catch (e) {}
      }
    }

    if (!newUserId) {
      newUserId = 'user-' + Date.now();
    }

    const newUser: Profile = {
      id: newUserId,
      email: normalizedEmail,
      full_name: name.trim(),
      phone: phone?.trim(),
      due_alert_days: 3,
      created_at: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    saveToFirestore('users', newUser.id, newUser);

    // Conforme Seção 5: Todo usuário recebe automaticamente "Minhas finanças"
    const personalSpace: FinancialSpace = {
      id: 'space-' + newUserId,
      name: 'Minhas finanças',
      is_shared: false,
      owner_id: newUserId,
      created_at: new Date().toISOString(),
      members_count: 1,
    };

    const adminMember: SpaceMember = {
      id: 'mem-' + newUserId,
      space_id: personalSpace.id,
      user_id: newUserId,
      role: 'admin',
      user: newUser,
      created_at: new Date().toISOString(),
    };

    const userCategories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: `cat-${personalSpace.id}-${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      space_id: personalSpace.id,
    }));

    setSpaces([personalSpace]);
    setSpaceMembers([adminMember]);
    setSelectedSpaceId(personalSpace.id);
    setCategories(userCategories);
    setTransactions([]);
    setInstallments([]);
    setInstallmentPurchases([]);
    setInvestments([]);
    setGoals([]);
    setGoalMovements([]);
    setWishlist([]);
    setMonthlyPlans([]);
    setMonthlyClosings([]);
    setIsOnboarded(false);

    saveToFirestore('spaces', personalSpace.id, personalSpace);
    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  const updateProfile = (data: Partial<Profile> & { first_name?: string; last_name?: string }) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    if (data.first_name !== undefined || data.last_name !== undefined) {
      const fName = data.first_name !== undefined ? data.first_name : (currentUser.first_name || '');
      const lName = data.last_name !== undefined ? data.last_name : (currentUser.last_name || '');
      updated.full_name = `${fName} ${lName}`.trim() || updated.full_name;
    }
    setCurrentUser(updated);
    saveToFirestore('users', updated.id, updated);
    
    // Atualiza metadados do usuário no Supabase Auth (se ativado)
    updateUserProfileMetadataWithSupabase({
      full_name: updated.full_name,
      first_name: updated.first_name,
      last_name: updated.last_name,
      phone: updated.phone,
    }).catch(() => {});

    logAudit('Atualização de perfil', 'profiles', currentUser.id, data);
  };

  const changePassword = async (newPass: string): Promise<boolean> => {
    if (!newPass || newPass.length < 8) return false;
    
    const res = await updateUserPasswordWithSupabase(newPass);
    if (!res.success) {
      return false;
    }

    logAudit('Alteração de senha', 'profiles', currentUser?.id);
    return true;
  };

  const deleteAccount = async () => {
    logAudit('Exclusão de conta', 'profiles', currentUser?.id);
    setCurrentUser(null);
    setIsOnboarded(false);
    localStorage.clear();
  };

  const completeOnboarding = (usageType: 'individual' | 'shared') => {
    setIsOnboarded(true);
    if (usageType === 'shared' && currentUser) {
      createSpace('Finanças da Família', true);
    }
  };

  // Funções de Espaços
  const switchSpace = (spaceId: string) => {
    const found = spaces.find((s) => s.id === spaceId);
    if (found) {
      setSelectedSpaceId(spaceId);
    }
  };

  const createSpace = async (name: string, isShared: boolean): Promise<FinancialSpace> => {
    if (!currentUser) throw new Error('Não autenticado');
    const newSpaceId = 'space-' + Date.now();
    const newSpace: FinancialSpace = {
      id: newSpaceId,
      name,
      is_shared: isShared,
      owner_id: currentUser.id,
      created_at: new Date().toISOString(),
      members_count: 1,
    };

    const member: SpaceMember = {
      id: 'mem-' + Date.now(),
      space_id: newSpaceId,
      user_id: currentUser.id,
      role: 'admin',
      user: currentUser,
      created_at: new Date().toISOString(),
    };

    setSpaces((prev) => [...prev, newSpace]);
    setSpaceMembers((prev) => [...prev, member]);
    setSelectedSpaceId(newSpaceId);
    logAudit(`Espaço criado: ${name}`, 'financial_spaces', newSpaceId);
    return newSpace;
  };

  const updateSpaceName = (spaceId: string, name: string) => {
    setSpaces((prev) => prev.map((s) => (s.id === spaceId ? { ...s, name } : s)));
    logAudit(`Nome do espaço atualizado para: ${name}`, 'financial_spaces', spaceId);
  };

  const inviteMemberToSpace = async (spaceId: string, email: string) => {
    if (!currentUser) return;
    const newMemberId = 'mem-invited-' + Date.now();
    const invitedUser: Profile = {
      id: 'user-guest-' + Date.now(),
      email,
      full_name: email.split('@')[0],
      due_alert_days: 3,
      created_at: new Date().toISOString(),
    };

    const newMember: SpaceMember = {
      id: newMemberId,
      space_id: spaceId,
      user_id: invitedUser.id,
      role: 'member',
      user: invitedUser,
      created_at: new Date().toISOString(),
    };

    setSpaceMembers((prev) => [...prev, newMember]);
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, members_count: (s.members_count || 1) + 1 } : s))
    );
    logAudit(`Convite enviado para ${email}`, 'space_invitations', newMemberId);
  };

  const removeMemberFromSpace = (memberId: string) => {
    const member = spaceMembers.find((m) => m.id === memberId);
    if (!member) return;
    setSpaceMembers((prev) => prev.filter((m) => m.id !== memberId));
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === member.space_id ? { ...s, members_count: Math.max(1, (s.members_count || 2) - 1) } : s
      )
    );
    logAudit(`Membro removido do espaço`, 'space_members', memberId);
  };

  const leaveSpace = (spaceId: string) => {
    if (!currentUser) return;
    setSpaceMembers((prev) =>
      prev.filter((m) => !(m.space_id === spaceId && m.user_id === currentUser.id))
    );
    // Alternar para o espaço individual
    const personal = spaces.find((s) => !s.is_shared && s.owner_id === currentUser.id);
    if (personal) {
      setSelectedSpaceId(personal.id);
    }
  };

  const transferSpaceAdmin = (spaceId: string, newAdminUserId: string) => {
    setSpaceMembers((prev) =>
      prev.map((m) => {
        if (m.space_id === spaceId) {
          if (m.user_id === newAdminUserId) return { ...m, role: 'admin' };
          if (m.user_id === currentUser?.id) return { ...m, role: 'member' };
        }
        return m;
      })
    );
    logAudit(`Administração transferida para usuário ${newAdminUserId}`, 'financial_spaces', spaceId);
  };

  // Funções de Navegação de Mês
  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(current);
  };

  // Funções de Categorias
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now(),
      space_id: currentSpace?.id,
    };
    setCategories((prev) => [...prev, newCat]);
    saveToFirestore('categories', newCat.id, newCat);
    logAudit(`Categoria criada: ${cat.name}`, 'categories', newCat.id);
  };

  const updateCategory = (id: string, cat: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...cat };
        saveToFirestore('categories', id, updated);
        return updated;
      }
      return c;
    }));
  };

  // Funções de Lançamentos
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'created_at' | 'created_by' | 'status'>
  ): Promise<Transaction> => {
    const autoStatus = computeAccountStatus(
      data.due_date,
      data.payment_date,
      false,
      Boolean(data.payment_method === 'Débito Automático'),
      currentUser?.due_alert_days || 3
    );

    const newTx: Transaction = {
      ...data,
      id: 'tx-' + Date.now(),
      status: autoStatus,
      created_by: currentUser?.id,
      created_by_user: currentUser || undefined,
      responsible_user:
        spaceMembers.find((m) => m.user_id === data.responsible_user_id)?.user || currentUser || undefined,
      category: categories.find((c) => c.id === data.category_id),
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    saveToFirestore('transactions', newTx.id, newTx);

    // Se for recorrente, gerar lançamentos para os próximos 12 meses (Seção 5.2)
    if (data.is_recurring) {
      const futureTxs: Transaction[] = [];
      const [y, m, d] = data.due_date.split('-').map(Number);
      for (let i = 1; i <= 12; i++) {
        const totalMonthOffset = (m - 1) + i;
        const targetYear = y + Math.floor(totalMonthOffset / 12);
        const targetMonthIndex = totalMonthOffset % 12;
        const daysInTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
        const targetDay = Math.min(d, daysInTargetMonth);
        const nextMonthStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}`;
        const nextDateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

        const fTx: Transaction = {
          ...newTx,
          id: 'tx-rec-' + Date.now() + '-' + i,
          due_date: nextDateStr,
          reference_month: nextMonthStr,
          payment_date: undefined,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        futureTxs.push(fTx);
        saveToFirestore('transactions', fTx.id, fTx);
      }
      setTransactions((prev) => [...prev, ...futureTxs]);
    }

    logAudit(`Lançamento criado: ${data.description}`, 'transactions', newTx.id, {
      amount: data.amount,
      type: data.type,
    });
    showToast('Lançamento adicionado com sucesso!');
    return newTx;
  };

  const updateTransaction = (
    id: string,
    data: Partial<Transaction>,
    recurrenceScope: 'only_this_month' | 'this_and_future' = 'only_this_month'
  ) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...data, updated_at: new Date().toISOString() };
          if (data.due_date || data.payment_date) {
            updated.status = computeAccountStatus(
              updated.due_date,
              updated.payment_date,
              updated.status === 'cancelled',
              false,
              currentUser?.due_alert_days || 3
            );
          }
          saveToFirestore('transactions', id, updated);
          return updated;
        }
        return t;
      })
    );
    logAudit(`Lançamento editado: ${id}`, 'transactions', id, data);
    showToast('Lançamento atualizado!');
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteFromFirestore('transactions', id);
    logAudit(`Lançamento excluído: ${tx?.description || id}`, 'transactions', id);
    showToast('Lançamento excluído!');
  };

  const markTransactionAsPaid = (
    id: string,
    paidDate?: string,
    paidAmount?: number,
    updateFutureRecurring: boolean = false
  ) => {
    const effectiveDate = paidDate || new Date().toISOString().slice(0, 10);
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    const newAmount = paidAmount !== undefined ? paidAmount : targetTx.amount;

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated: Transaction = {
            ...t,
            amount: newAmount,
            status: 'paid' as const,
            payment_date: effectiveDate,
            paid_by: currentUser?.id,
            paid_by_user: currentUser || undefined,
            updated_at: new Date().toISOString(),
          };
          saveToFirestore('transactions', id, updated);
          return updated;
        }

        // Se marcou para atualizar valor previsto nas recorrências futuras (Seção 5.6)
        if (
          updateFutureRecurring &&
          targetTx.is_recurring &&
          t.description === targetTx.description &&
          t.type === targetTx.type &&
          t.due_date > targetTx.due_date &&
          t.status !== 'paid'
        ) {
          const updated: Transaction = {
            ...t,
            amount: newAmount,
            updated_at: new Date().toISOString(),
          };
          saveToFirestore('transactions', t.id, updated);
          return updated;
        }

        return t;
      })
    );
    logAudit(
      `Conta marcada como paga: ${targetTx.description} (R$ ${newAmount})`,
      'transactions',
      id,
      { payment_date: effectiveDate, amount: newAmount }
    );
    showToast('Pagamento registrado com sucesso!');
  };

  // Funções de Parcelamentos (Seção 3)
  const addInstallmentPurchase = async (
    data: Omit<InstallmentPurchase, 'id' | 'created_at' | 'created_by'>
  ) => {
    const purchaseId = 'pur-' + Date.now();
    const purchase: InstallmentPurchase = {
      ...data,
      id: purchaseId,
      created_by: currentUser?.id,
      created_at: new Date().toISOString(),
    };

    setInstallmentPurchases((prev) => [purchase, ...prev]);

    // 3.2 e 3.3 Distribuição de centavos no cálculo e datas sem fuso horário
    const count = data.installments_count;
    const totalCents = Math.round(data.total_amount * 100);
    const baseInstallmentCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - (baseInstallmentCents * count);

    const generatedInstallments: Installment[] = [];
    const [y, m, d] = data.first_due_date.split('-').map(Number);

    for (let i = 1; i <= count; i++) {
      const totalMonthOffset = (m - 1) + (i - 1);
      const targetYear = y + Math.floor(totalMonthOffset / 12);
      const targetMonthIndex = totalMonthOffset % 12;
      const daysInTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
      const targetDay = Math.min(d, daysInTargetMonth);

      const targetMonthStr = String(targetMonthIndex + 1).padStart(2, '0');
      const targetDayStr = String(targetDay).padStart(2, '0');
      const dueDateStr = `${targetYear}-${targetMonthStr}-${targetDayStr}`;
      const refMonth = `${targetYear}-${targetMonthStr}`;

      // A 1ª parcela absorve a diferença de centavos para garantir que a soma feche perfeitamente
      const installmentCents = i === 1 ? baseInstallmentCents + remainderCents : baseInstallmentCents;
      const instAmount = installmentCents / 100;

      generatedInstallments.push({
        id: `inst-${purchaseId}-${i}`,
        space_id: data.space_id,
        purchase_id: purchaseId,
        purchase_description: `${data.description} (${i}/${count})`,
        installment_number: i,
        total_installments: count,
        amount: instAmount,
        due_date: dueDateStr,
        reference_month: refMonth,
        status: computeAccountStatus(
          dueDateStr,
          undefined,
          false,
          false,
          currentUser?.due_alert_days || 3
        ),
        category_id: data.category_id,
      });
    }

    setInstallments((prev) => [...prev, ...generatedInstallments]);
    saveToFirestore('installment_purchases', purchaseId, purchase);
    generatedInstallments.forEach((inst) => saveToFirestore('installments', inst.id, inst));
    logAudit(
      `Compra parcelada criada: ${data.description} (${count}x de R$ ${(baseInstallmentCents / 100).toFixed(2)})`,
      'installment_purchases',
      purchaseId
    );
    showToast('Compra parcelada cadastrada!');
  };

  const anticipateInstallment = (installmentId: string) => {
    payInstallment(installmentId);
  };

  const payInstallment = (
    installmentId: string,
    paidDate?: string,
    paidAmount?: number
  ) => {
    const effectiveDate = paidDate || new Date().toISOString().slice(0, 10);
    setInstallments((prev) =>
      prev.map((i) => {
        if (i.id === installmentId) {
          const updated: Installment = {
            ...i,
            status: 'paid' as const,
            amount: paidAmount !== undefined ? paidAmount : i.amount,
            paid_date: effectiveDate,
            paid_by: currentUser?.id,
          };
          saveToFirestore('installments', installmentId, updated);
          return updated;
        }
        return i;
      })
    );
    logAudit(`Parcela paga: ${installmentId}`, 'installments', installmentId);
    showToast('Parcela paga com sucesso!');
  };

  const updateInstallment = (
    installmentId: string,
    data: Partial<Installment>,
    applyTo: 'single' | 'future' = 'single'
  ) => {
    const targetInst = installments.find((i) => i.id === installmentId);
    if (!targetInst) return;

    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === installmentId) {
          const updated = { ...inst, ...data };
          saveToFirestore('installments', inst.id, updated);
          return updated;
        }
        if (
          applyTo === 'future' &&
          inst.purchase_id === targetInst.purchase_id &&
          inst.installment_number > targetInst.installment_number &&
          inst.status !== 'paid'
        ) {
          const updated = {
            ...inst,
            ...(data.amount !== undefined ? { amount: data.amount } : {}),
            ...(data.category_id !== undefined ? { category_id: data.category_id } : {}),
          };
          saveToFirestore('installments', inst.id, updated);
          return updated;
        }
        return inst;
      })
    );
    logAudit(`Parcela editada: ${installmentId} (${applyTo})`, 'installments', installmentId);
  };

  const deleteInstallment = (
    installmentId: string,
    applyTo: 'single' | 'future' = 'single'
  ) => {
    const targetInst = installments.find((i) => i.id === installmentId);
    if (!targetInst) return;

    setInstallments((prev) => {
      const remaining = prev.filter((inst) => {
        if (inst.id === installmentId) return false;
        if (
          applyTo === 'future' &&
          inst.purchase_id === targetInst.purchase_id &&
          inst.installment_number > targetInst.installment_number
        ) {
          deleteFromFirestore('installments', inst.id);
          return false;
        }
        return true;
      });
      deleteFromFirestore('installments', installmentId);
      return remaining;
    });
    logAudit(`Parcela excluída: ${installmentId} (${applyTo})`, 'installments', installmentId);
  };

  const deleteInstallmentPurchase = (purchaseId: string) => {
    setInstallmentPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    setInstallments((prev) => prev.filter((i) => i.purchase_id !== purchaseId));
    deleteFromFirestore('installment_purchases', purchaseId);
    logAudit(`Compra parcelada excluída: ${purchaseId}`, 'installment_purchases', purchaseId);
  };

  // Funções de Investimentos
  const addInvestment = (data: Omit<Investment, 'id' | 'created_at'>) => {
    const newInv: Investment = {
      ...data,
      id: 'inv-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setInvestments((prev) => [newInv, ...prev]);
    saveToFirestore('investments', newInv.id, newInv);
    logAudit(`Investimento cadastrado: ${data.name}`, 'investments', newInv.id);
    showToast('Investimento salvo com sucesso!');
  };

  const updateInvestment = (id: string, data: Partial<Investment>) => {
    setInvestments((prev) => prev.map((inv) => {
      if (inv.id === id) {
        const updated = { ...inv, ...data };
        saveToFirestore('investments', id, updated);
        return updated;
      }
      return inv;
    }));
    logAudit(`Investimento atualizado: ${id}`, 'investments', id);
    showToast('Investimento atualizado!');
  };

  const addInvestmentMovement = (
    invId: string,
    type: 'deposit' | 'withdraw' | 'yield_update',
    amount: number,
    notes?: string
  ) => {
    setInvestments((prev) =>
      prev.map((inv) => {
        if (inv.id === invId) {
          const newCurrent =
            type === 'deposit'
              ? inv.current_amount + amount
              : type === 'withdraw'
              ? Math.max(0, inv.current_amount - amount)
              : amount; // yield_update atualiza valor
          const updated = { ...inv, current_amount: newCurrent };
          saveToFirestore('investments', invId, updated);
          return updated;
        }
        return inv;
      })
    );
    logAudit(`Movimentação de investimento: ${type} R$ ${amount}`, 'investments', invId);
  };

  // Funções de Metas
  const addGoal = (data: Omit<Goal, 'id' | 'created_at' | 'saved_amount'>) => {
    const newGoal: Goal = {
      ...data,
      id: 'goal-' + Date.now(),
      saved_amount: 0,
      created_at: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    saveToFirestore('goals', newGoal.id, newGoal);
    logAudit(`Meta criada: ${data.name}`, 'goals', newGoal.id);
    showToast('Meta financeira cadastrada!');
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id === id) {
        const updated = { ...g, ...data };
        saveToFirestore('goals', id, updated);
        return updated;
      }
      return g;
    }));
    showToast('Meta atualizada!');
  };

  const depositToGoal = (goalId: string, amount: number, notes?: string): boolean => {
    if (amount <= 0) return false;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !currentSpace) return false;

    const prevBal = goal.saved_amount;
    const newBal = prevBal + amount;

    const movement: GoalMovement = {
      id: 'gm-' + Date.now(),
      goal_id: goalId,
      space_id: currentSpace.id,
      date: new Date().toISOString().slice(0, 10),
      type: 'deposit',
      amount,
      previous_balance: prevBal,
      new_balance: newBal,
      reason: notes,
      responsible_user_id: currentUser?.id,
      responsible_user: currentUser || undefined,
      created_at: new Date().toISOString(),
    };

    setGoalMovements((prev) => [movement, ...prev]);
    saveToFirestore('goal_movements', movement.id, movement);

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = { ...g, saved_amount: newBal, status: newBal >= g.target_amount ? ('completed' as const) : g.status };
          saveToFirestore('goals', goalId, updated);
          return updated;
        }
        return g;
      })
    );
    logAudit(`Depósito em meta: R$ ${amount} na meta ${goal.name}`, 'goals', goalId);
    return true;
  };

  const withdrawFromGoal = (goalId: string, amount: number, reason: string): boolean => {
    if (amount <= 0 || !reason.trim()) return false;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !currentSpace) return false;

    // Regra Seção 17: Não permitir retirar valor maior do que o saldo disponível
    if (amount > goal.saved_amount) {
      return false;
    }

    const prevBal = goal.saved_amount;
    const newBal = prevBal - amount;

    const movement: GoalMovement = {
      id: 'gm-' + Date.now(),
      goal_id: goalId,
      space_id: currentSpace.id,
      date: new Date().toISOString().slice(0, 10),
      type: 'withdraw',
      amount,
      previous_balance: prevBal,
      new_balance: newBal,
      reason,
      responsible_user_id: currentUser?.id,
      responsible_user: currentUser || undefined,
      created_at: new Date().toISOString(),
    };

    setGoalMovements((prev) => [movement, ...prev]);
    saveToFirestore('goal_movements', movement.id, movement);

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = { ...g, saved_amount: newBal, status: 'active' as const };
          saveToFirestore('goals', goalId, updated);
          return updated;
        }
        return g;
      })
    );
    logAudit(`Retirada de meta: R$ ${amount} da meta ${goal.name}. Motivo: ${reason}`, 'goals', goalId);
    return true;
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setGoalMovements((prev) => prev.filter((gm) => gm.goal_id !== id));
    deleteFromFirestore('goals', id);
  };

  // Funções da Lista de Desejos
  const addWishlistItem = (data: Omit<WishlistItem, 'id' | 'created_at'>) => {
    const newItem: WishlistItem = {
      ...data,
      id: 'wish-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setWishlist((prev) => [newItem, ...prev]);
    saveToFirestore('wishlist', newItem.id, newItem);
    logAudit(`Desejo adicionado: ${data.name}`, 'wishlist_items', newItem.id);
    showToast('Item salvo na lista de desejos!');
  };

  const updateWishlistItem = (id: string, data: Partial<WishlistItem>) => {
    setWishlist((prev) => prev.map((w) => {
      if (w.id === id) {
        const updated = { ...w, ...data };
        saveToFirestore('wishlist', id, updated);
        return updated;
      }
      return w;
    }));
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    deleteFromFirestore('wishlist', id);
  };

  const convertWishlistToExpense = (
    wishId: string,
    mode: 'expense' | 'installment',
    options?: { installmentsCount?: number; creditCardId?: string }
  ) => {
    const wish = wishlist.find((w) => w.id === wishId);
    if (!wish || !currentSpace) return;

    if (mode === 'expense') {
      addTransaction({
        space_id: currentSpace.id,
        description: wish.name,
        amount: wish.estimated_amount,
        type: 'expense_variable',
        category_id: 'cat-exp-compras',
        due_date: new Date().toISOString().slice(0, 10),
        reference_month: selectedMonth,
        is_recurring: false,
        notes: `Convertido da Lista de Desejos: ${wish.description || ''}`,
      });
    } else {
      const count = options?.installmentsCount || 3;
      addInstallmentPurchase({
        space_id: currentSpace.id,
        description: wish.name,
        total_amount: wish.estimated_amount,
        installments_count: count,
        installment_amount: Math.round((wish.estimated_amount / count) * 100) / 100,
        first_due_date: new Date().toISOString().slice(0, 10),
        category_id: 'cat-exp-compras',
        notes: `Convertido da Lista de Desejos: ${wish.description || ''}`,
      });
    }

    updateWishlistItem(wishId, { status: 'purchased' });
    logAudit(`Desejo convertido em ${mode}: ${wish.name}`, 'wishlist_items', wishId);
  };

  // Funções de Planejamento Mensal
  const saveMonthlyPlan = (plan: Omit<MonthlyPlan, 'id' | 'space_id'>) => {
    if (!currentSpace) return;
    const existingIndex = monthlyPlans.findIndex(
      (p) => p.space_id === currentSpace.id && p.reference_month === plan.reference_month
    );

    const planToSave: MonthlyPlan = {
      ...plan,
      id: existingIndex >= 0 ? monthlyPlans[existingIndex].id : 'plan-' + Date.now(),
      space_id: currentSpace.id,
    };

    if (existingIndex >= 0) {
      setMonthlyPlans((prev) => prev.map((p, i) => (i === existingIndex ? planToSave : p)));
    } else {
      setMonthlyPlans((prev) => [...prev, planToSave]);
    }
    saveToFirestore('monthly_plans', planToSave.id, planToSave);
    logAudit(`Planejamento mensal salvo para ${plan.reference_month}`, 'monthly_plans', planToSave.id);
  };

  // Funções de Fechamento do Mês
  const closeCurrentMonth = (
    destination: MonthlyClosing['leftover_destination'],
    goalId?: string
  ): MonthlyClosing => {
    if (!currentSpace) throw new Error('Espaço não selecionado');

    const currentPlan = monthlyPlans.find(
      (p) => p.space_id === currentSpace.id && p.reference_month === selectedMonth
    );

    // Avaliar status do fechamento
    const evaluation = evaluateMonthClosing({
      transactions,
      installments,
      monthlyPlan: currentPlan,
      goalsDeposited: goalMovements
        .filter((gm) => gm.space_id === currentSpace.id && gm.date.startsWith(selectedMonth) && gm.type === 'deposit')
        .reduce((a, b) => a + b.amount, 0),
      investedAmount: 0,
      referenceMonth: selectedMonth,
      isSharedSpace: currentSpace.is_shared,
    });

    const closing: MonthlyClosing = {
      id: 'close-' + Date.now(),
      space_id: currentSpace.id,
      reference_month: selectedMonth,
      status: 'closed',
      classification: evaluation.classification,
      total_income: evaluation.actualIncome,
      total_expenses: evaluation.actualExpenses,
      total_saved: 0,
      total_withdrawn: 0,
      total_invested: 0,
      final_balance: evaluation.finalBalance,
      leftover_destination: destination,
      destination_goal_id: goalId,
      mascot_message: evaluation.mascotMessage,
      closed_by: currentUser?.id,
      closed_by_user: currentUser || undefined,
      closed_at: new Date().toISOString(),
    };

    setMonthlyClosings((prev) => [closing, ...prev.filter((c) => !(c.space_id === currentSpace.id && c.reference_month === selectedMonth))]);
    saveToFirestore('monthly_closings', closing.id, closing);
    logAudit(`Mês fechado: ${selectedMonth} com classificação ${evaluation.classification}`, 'monthly_closings', closing.id);
    return closing;
  };

  const reopenMonth = (refMonth: string, reason: string) => {
    if (!currentSpace) return;
    setMonthlyClosings((prev) =>
      prev.map((c) => {
        if (c.space_id === currentSpace.id && c.reference_month === refMonth) {
          const updated = {
            ...c,
            status: 'reopened' as const,
            reopened_by: currentUser?.id,
            reopened_by_user: currentUser || undefined,
            reopened_at: new Date().toISOString(),
            reopening_reason: reason,
          };
          saveToFirestore('monthly_closings', c.id, updated);
          return updated;
        }
        return c;
      })
    );
    logAudit(`Mês reaberto: ${refMonth}. Motivo: ${reason}`, 'monthly_closings', refMonth);
  };

  // Funções de Notificações
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Funções do Mercado / Lista de Compras
  const createShoppingList = async (name: string, budget?: number): Promise<ShoppingList> => {
    if (!currentSpace || !currentUser) throw new Error('Usuário não autenticado');
    const newList: ShoppingList = {
      id: 'shop-list-' + Date.now() + Math.random().toString(36).substring(2, 5),
      space_id: currentSpace.id,
      user_id: currentUser.id,
      name: name.trim(),
      budget: budget && budget > 0 ? budget : undefined,
      status: 'draft',
      total: 0,
      created_at: new Date().toISOString(),
    };
    setShoppingLists((prev) => [newList, ...prev]);
    saveToFirestore('shopping_lists', newList.id, newList);
    showToast('Lista de compras criada!', 'success');
    return newList;
  };

  const updateShoppingList = async (id: string, updates: Partial<ShoppingList>): Promise<void> => {
    setShoppingLists((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updated = { ...l, ...updates };
          saveToFirestore('shopping_lists', id, updated);
          return updated;
        }
        return l;
      })
    );
  };

  const deleteShoppingList = async (id: string): Promise<void> => {
    setShoppingLists((prev) => prev.filter((l) => l.id !== id));
    setShoppingItems((prev) => prev.filter((i) => i.shopping_list_id !== id));
    deleteFromFirestore('shopping_lists', id);
    showToast('Lista excluída.', 'info');
  };

  const addShoppingItem = async (listId: string, name: string, quantity?: number): Promise<ShoppingItem> => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    const normName = name.trim().toLowerCase();
    const lastPrice = shoppingPriceReferences[normName] || undefined;
    const qty = quantity && quantity > 0 ? quantity : 1;

    const newItem: ShoppingItem = {
      id: 'shop-item-' + Date.now() + Math.random().toString(36).substring(2, 5),
      shopping_list_id: listId,
      user_id: currentUser.id,
      name: name.trim(),
      quantity: qty,
      subtotal: 0,
      status: 'pending',
      last_price_reference: lastPrice,
      created_at: new Date().toISOString(),
    };

    setShoppingItems((prev) => [...prev, newItem]);
    saveToFirestore('shopping_items', newItem.id, newItem);
    return newItem;
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>): Promise<void> => {
    setShoppingItems((prev) => {
      const nextItems = prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updated.status === 'in_cart' && updated.unit_price !== undefined) {
            updated.subtotal = updated.quantity * updated.unit_price;
          } else if (updated.status !== 'in_cart') {
            updated.subtotal = 0;
          }
          updated.updated_at = new Date().toISOString();
          saveToFirestore('shopping_items', id, updated);
          return updated;
        }
        return item;
      });

      const targetItem = nextItems.find((i) => i.id === id);
      if (targetItem) {
        const listItems = nextItems.filter((i) => i.shopping_list_id === targetItem.shopping_list_id);
        const newTotal = listItems
          .filter((i) => i.status === 'in_cart')
          .reduce((sum, i) => sum + (i.subtotal || 0), 0);

        setShoppingLists((lists) =>
          lists.map((l) => (l.id === targetItem.shopping_list_id ? { ...l, total: newTotal } : l))
        );
      }

      return nextItems;
    });
  };

  const removeShoppingItem = async (id: string): Promise<void> => {
    let targetListId: string | undefined;
    setShoppingItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) targetListId = item.shopping_list_id;
      return prev.filter((i) => i.id !== id);
    });
    deleteFromFirestore('shopping_items', id);

    if (targetListId) {
      setTimeout(() => {
        setShoppingItems((latest) => {
          const listItems = latest.filter((i) => i.shopping_list_id === targetListId);
          const newTotal = listItems
            .filter((i) => i.status === 'in_cart')
            .reduce((sum, i) => sum + (i.subtotal || 0), 0);
          setShoppingLists((lists) =>
            lists.map((l) => (l.id === targetListId ? { ...l, total: newTotal } : l))
          );
          return latest;
        });
      }, 50);
    }
  };

  const startShopping = async (listId: string): Promise<void> => {
    const startedAt = new Date().toISOString();
    setShoppingLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, status: 'shopping', started_at: startedAt } : l))
    );
    showToast('Modo Compra iniciado! Bom mercado 🛒', 'success');
  };

  const finishShopping = async (
    listId: string
  ): Promise<{ list: ShoppingList; total: number; boughtCount: number; skippedCount: number }> => {
    const listItems = shoppingItems.filter((i) => i.shopping_list_id === listId);
    const boughtItems = listItems.filter((i) => i.status === 'in_cart');
    const skippedItems = listItems.filter((i) => i.status === 'skipped');
    const total = boughtItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);

    const completedAt = new Date().toISOString();

    let updatedList: ShoppingList | undefined;
    setShoppingLists((prev) =>
      prev.map((l) => {
        if (l.id === listId) {
          updatedList = { ...l, status: 'completed', total, completed_at: completedAt };
          saveToFirestore('shopping_lists', listId, updatedList);
          return updatedList;
        }
        return l;
      })
    );

    const newRefs = { ...shoppingPriceReferences };
    boughtItems.forEach((item) => {
      if (item.unit_price && item.unit_price > 0) {
        const norm = item.name.trim().toLowerCase();
        newRefs[norm] = item.unit_price;
      }
    });
    setShoppingPriceReferences(newRefs);

    return {
      list: updatedList || {
        id: listId,
        space_id: currentSpace?.id || '',
        user_id: currentUser?.id || '',
        name: 'Compras do mês',
        status: 'completed',
        total,
        created_at: completedAt,
      },
      total,
      boughtCount: boughtItems.length,
      skippedCount: skippedItems.length,
    };
  };

  const registerShoppingTransaction = async (listId: string): Promise<Transaction | null> => {
    const list = shoppingLists.find((l) => l.id === listId);
    if (!list) return null;
    if (list.financial_transaction_id) {
      showToast('Esta compra já foi registrada nas finanças!', 'info');
      return transactions.find((t) => t.id === list.financial_transaction_id) || null;
    }

    const catMercado = categories.find(
      (c) => c.name.toLowerCase().includes('mercado') || c.name.toLowerCase().includes('supermercado')
    ) || categories.find((c) => c.id === 'cat-exp-compras') || categories[0];

    const todayStr = new Date().toISOString().slice(0, 10);
    const refMonthStr = list.completed_at ? list.completed_at.slice(0, 7) : selectedMonth;

    const txData: Omit<Transaction, 'id' | 'created_at' | 'created_by' | 'status'> = {
      space_id: list.space_id,
      description: list.name || 'Compras no Mercado',
      amount: list.total,
      type: 'expense_variable',
      category_id: catMercado?.id,
      due_date: todayStr,
      payment_date: todayStr,
      reference_month: refMonthStr,
      is_recurring: false,
    };

    const newTx = await addTransaction(txData);

    setShoppingLists((prev) =>
      prev.map((l) => {
        if (l.id === listId) {
          const updated = { ...l, financial_transaction_id: newTx.id };
          saveToFirestore('shopping_lists', listId, updated);
          return updated;
        }
        return l;
      })
    );

    showToast('✓ Registrado nas suas finanças com sucesso!', 'success');
    return newTx;
  };

  const duplicateShoppingList = async (listId: string, newName?: string): Promise<ShoppingList> => {
    if (!currentSpace || !currentUser) throw new Error('Usuário não autenticado');
    const originalList = shoppingLists.find((l) => l.id === listId);
    if (!originalList) throw new Error('Lista não encontrada');

    const originalItems = shoppingItems.filter((i) => i.shopping_list_id === listId);

    const newList: ShoppingList = {
      id: 'shop-list-' + Date.now() + Math.random().toString(36).substring(2, 5),
      space_id: currentSpace.id,
      user_id: currentUser.id,
      name: newName ? newName.trim() : originalList.name,
      budget: originalList.budget,
      status: 'draft',
      total: 0,
      created_at: new Date().toISOString(),
    };

    const newItems: ShoppingItem[] = originalItems.map((item, idx) => {
      const norm = item.name.trim().toLowerCase();
      const lastPrice = shoppingPriceReferences[norm] || item.unit_price || item.last_price_reference;
      return {
        id: 'shop-item-' + Date.now() + '-' + idx,
        shopping_list_id: newList.id,
        user_id: currentUser.id,
        name: item.name,
        quantity: item.quantity || 1,
        subtotal: 0,
        status: 'pending',
        last_price_reference: lastPrice,
        created_at: new Date().toISOString(),
      };
    });

    setShoppingLists((prev) => [newList, ...prev]);
    setShoppingItems((prev) => [...prev, ...newItems]);
    saveToFirestore('shopping_lists', newList.id, newList);
    newItems.forEach((i) => saveToFirestore('shopping_items', i.id, i));

    showToast('Lista copiada! Pronta para uso 🛒', 'success');
    return newList;
  };

  // Reset para dados mock iniciais
  const resetToMockData = () => {
    setCurrentUser(INITIAL_USER);
    setIsOnboarded(true);
    setSelectedMonth('2026-09');
    setSpaces(INITIAL_SPACES);
    setSpaceMembers(INITIAL_MEMBERS);
    setSelectedSpaceId('space-couple-02');
    setCategories(DEFAULT_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setInstallmentPurchases(INITIAL_INSTALLMENT_PURCHASES);
    setInstallments(INITIAL_INSTALLMENTS);
    setInvestments(INITIAL_INVESTMENTS);
    setGoals(INITIAL_GOALS);
    setGoalMovements(INITIAL_GOAL_MOVEMENTS);
    setWishlist(INITIAL_WISHLIST);
    setMonthlyPlans(INITIAL_MONTHLY_PLANS);
    setMonthlyClosings([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setShoppingLists(INITIAL_SHOPPING_LISTS);
    setShoppingItems(INITIAL_SHOPPING_ITEMS);
    setShoppingPriceReferences({});
  };

  const zeroAllValues = () => {
    setTransactions([]);
    setInstallmentPurchases([]);
    setInstallments([]);
    setInvestments([]);
    setGoals([]);
    setGoalMovements([]);
    setWishlist([]);
    setMonthlyPlans([]);
    setMonthlyClosings([]);
    setNotifications([]);
    setShoppingLists([]);
    setShoppingItems([]);
    setShoppingPriceReferences({});
    showToast('Todos os valores e registros foram zerados com sucesso! 🧹', 'success');
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isOnboarded,
        accessWallet,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        completeOnboarding,

        spaces,
        currentSpace,
        currentSpaceRole,
        spaceMembers: spaceMembers.filter((m) => m.space_id === currentSpace?.id),
        switchSpace,
        createSpace,
        updateSpaceName,
        inviteMemberToSpace,
        removeMemberFromSpace,
        leaveSpace,
        transferSpaceAdmin,

        selectedMonth,
        setSelectedMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,

        categories,
        addCategory,
        updateCategory,

        transactions: transactions.filter((t) => t.space_id === currentSpace?.id),
        addTransaction,
        updateTransaction,
        deleteTransaction,
        markTransactionAsPaid,

        installmentPurchases: installmentPurchases.filter((p) => p.space_id === currentSpace?.id),
        installments: installments.filter((i) => i.space_id === currentSpace?.id),
        addInstallmentPurchase,
        anticipateInstallment,

        investments: investments.filter((inv) => inv.space_id === currentSpace?.id),
        addInvestment,
        updateInvestment,
        addInvestmentMovement,

        goals: goals.filter((g) => g.space_id === currentSpace?.id),
        goalMovements: goalMovements.filter((gm) => gm.space_id === currentSpace?.id),
        addGoal,
        updateGoal,
        deleteGoal,
        depositToGoal,
        withdrawFromGoal,

        wishlist: wishlist.filter((w) => w.space_id === currentSpace?.id),
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        convertWishlistToExpense,

        monthlyPlans: monthlyPlans.filter((p) => p.space_id === currentSpace?.id),
        saveMonthlyPlan,

        monthlyClosings: monthlyClosings.filter((c) => c.space_id === currentSpace?.id),
        closeCurrentMonth,
        reopenMonth,

        notifications: notifications.filter((n) => n.user_id === currentUser?.id),
        markNotificationAsRead,
        clearAllNotifications,

        shoppingLists: shoppingLists.filter((l) => l.space_id === currentSpace?.id),
        shoppingItems: shoppingItems.filter((i) => i.user_id === currentUser?.id),
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

        auditLogs: auditLogs.filter((a) => a.space_id === currentSpace?.id),

        toast,
        showToast,
        dismissToast,

        resetToMockData,
        resetDemoData: resetToMockData,
        zeroAllValues,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de FinanceProvider');
  }
  return context;
};
