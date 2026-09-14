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
} from '../data/mockInitialData';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { computeAccountStatus, evaluateMonthClosing } from '../lib/calculations';
import {
  auth,
  loginWithGoogle as firebaseLoginGoogle,
  loginWithEmail,
  signupWithEmail,
  logoutUser,
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  saveToFirestore,
  deleteFromFirestore,
  seedSpaceDataIfEmpty,
} from '../lib/firestoreSync';

interface FinanceContextType {
  // Auth & Perfil
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;
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
  markTransactionAsPaid: (id: string, paidDate?: string) => void;

  // Parcelamentos
  installmentPurchases: InstallmentPurchase[];
  installments: Installment[];
  addInstallmentPurchase: (
    data: Omit<InstallmentPurchase, 'id' | 'created_at' | 'created_by'>
  ) => Promise<void>;
  anticipateInstallment: (installmentId: string) => void;

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

  // Auditoria
  auditLogs: AuditLog[];

  // Utilitários de Estado
  resetToMockData: () => void;
  resetDemoData: () => void;
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
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Estado de Auth & Perfil
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  // Monitora alterações de autenticação no Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userProfile: Profile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name:
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Usuário Poupagaio',
          avatar_url: firebaseUser.photoURL || undefined,
          due_alert_days: 3,
          created_at: new Date().toISOString(),
        };
        setCurrentUser(userProfile);
        saveToFirestore('users', userProfile.id, userProfile);

        // Inicializa dados no Firebase Firestore se o espaço ainda estiver vazio
        seedSpaceDataIfEmpty('space-couple-02', {
          categories: DEFAULT_CATEGORIES,
          transactions: INITIAL_TRANSACTIONS,
          goals: INITIAL_GOALS,
          investments: INITIAL_INVESTMENTS,
          wishlist: INITIAL_WISHLIST,
          plans: INITIAL_MONTHLY_PLANS,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Funções de Autenticação Firebase
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const fbUser = await firebaseLoginGoogle();
      if (fbUser) {
        const profile: Profile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          full_name:
            fbUser.displayName ||
            fbUser.email?.split('@')[0] ||
            'Usuário Poupagaio',
          avatar_url: fbUser.photoURL || undefined,
          due_alert_days: 3,
          created_at: new Date().toISOString(),
        };
        setCurrentUser(profile);
        saveToFirestore('users', profile.id, profile);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro no login com Google:', err);
      return false;
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (pass.length < 8) return false;
    try {
      const fbUser = await loginWithEmail(email, pass);
      if (fbUser) {
        const profile: Profile = {
          id: fbUser.uid,
          email: fbUser.email || email,
          full_name:
            fbUser.displayName ||
            email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          due_alert_days: 3,
          created_at: new Date().toISOString(),
        };
        setCurrentUser(profile);
        saveToFirestore('users', profile.id, profile);
        return true;
      }
    } catch (fbErr) {
      console.warn('Login Firebase fallback para conta demonstrativa:', fbErr);
    }

    // Fallback gracioso para contas demonstrativas rápidas
    if (email.toLowerCase().includes('luana')) {
      setCurrentUser(PARTNER_USER);
      saveToFirestore('users', PARTNER_USER.id, PARTNER_USER);
    } else {
      const demoUser: Profile = {
        ...INITIAL_USER,
        email,
        full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      };
      setCurrentUser(demoUser);
      saveToFirestore('users', demoUser.id, demoUser);
    }
    return true;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (!name.trim() || !email.trim() || pass.length < 8) return false;
    let newUserId = 'user-' + Date.now();
    try {
      const fbUser = await signupWithEmail(email.trim(), pass);
      if (fbUser) {
        newUserId = fbUser.uid;
      }
    } catch (fbErr) {
      console.warn('Cadastro Firebase Auth:', fbErr);
    }

    const newUser: Profile = {
      id: newUserId,
      email: email.trim().toLowerCase(),
      full_name: name.trim(),
      due_alert_days: 3,
      created_at: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    saveToFirestore('users', newUser.id, newUser);

    // Conforme Seção 5: Todo usuário recebe automaticamente "Minhas finanças"
    const personalSpace: FinancialSpace = {
      id: 'space-' + Date.now(),
      name: 'Minhas finanças',
      is_shared: false,
      owner_id: newUserId,
      created_at: new Date().toISOString(),
      members_count: 1,
    };

    const adminMember: SpaceMember = {
      id: 'mem-' + Date.now(),
      space_id: personalSpace.id,
      user_id: newUserId,
      role: 'admin',
      user: newUser,
      created_at: new Date().toISOString(),
    };

    // Cria categorias padrões no novo espaço
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

  const logout = () => {
    logoutUser().catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    saveToFirestore('users', updated.id, updated);
    logAudit('Atualização de perfil', 'profiles', currentUser.id, data);
  };

  const changePassword = async (newPass: string): Promise<boolean> => {
    if (newPass.length < 8) return false;
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

    // Se for recorrente, gerar lançamentos para os próximos meses conforme Seção 11
    if (data.is_recurring) {
      const futureTxs: Transaction[] = [];
      const [y, m, d] = data.due_date.split('-').map(Number);
      for (let i = 1; i <= 3; i++) {
        const nextDate = new Date(y, m - 1 + i, d);
        const nextDateStr = nextDate.toISOString().slice(0, 10);
        const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
        
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
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteFromFirestore('transactions', id);
    logAudit(`Lançamento excluído: ${tx?.description || id}`, 'transactions', id);
  };

  const markTransactionAsPaid = (id: string, paidDate?: string) => {
    const effectiveDate = paidDate || new Date().toISOString().slice(0, 10);
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = {
            ...t,
            status: 'paid' as const,
            payment_date: effectiveDate,
            paid_by: currentUser?.id,
            paid_by_user: currentUser || undefined,
            updated_at: new Date().toISOString(),
          };
          saveToFirestore('transactions', id, updated);
          return updated;
        }
        return t;
      })
    );
    logAudit(`Conta marcada como paga: ${id}`, 'transactions', id, { payment_date: effectiveDate });
  };

  // Funções de Parcelamentos
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

    // Gerar as N parcelas nos meses correspondentes
    const generatedInstallments: Installment[] = [];
    const [y, m, d] = data.first_due_date.split('-').map(Number);

    for (let i = 1; i <= data.installments_count; i++) {
      const dueDate = new Date(y, m - 1 + (i - 1), d);
      const dueDateStr = dueDate.toISOString().slice(0, 10);
      const refMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

      generatedInstallments.push({
        id: `inst-${purchaseId}-${i}`,
        space_id: data.space_id,
        purchase_id: purchaseId,
        purchase_description: `${data.description} (${i}/${data.installments_count})`,
        installment_number: i,
        total_installments: data.installments_count,
        amount: data.installment_amount,
        due_date: dueDateStr,
        reference_month: refMonth,
        status: computeAccountStatus(dueDateStr, undefined, false, false, currentUser?.due_alert_days || 3),
        category_id: data.category_id,
      });
    }

    setInstallments((prev) => [...prev, ...generatedInstallments]);
    saveToFirestore('installment_purchases', purchaseId, purchase);
    generatedInstallments.forEach((inst) => saveToFirestore('installments', inst.id, inst));
    logAudit(
      `Compra parcelada criada: ${data.description} (${data.installments_count}x)`,
      'installment_purchases',
      purchaseId
    );
  };

  const anticipateInstallment = (installmentId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setInstallments((prev) =>
      prev.map((i) => {
        if (i.id === installmentId) {
          const updated = {
            ...i,
            status: 'paid' as const,
            paid_date: today,
            paid_by: currentUser?.id,
          };
          saveToFirestore('installments', installmentId, updated);
          return updated;
        }
        return i;
      })
    );
    logAudit(`Parcela antecipada: ${installmentId}`, 'installments', installmentId);
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
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isOnboarded,
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

        auditLogs: auditLogs.filter((a) => a.space_id === currentSpace?.id),

        resetToMockData,
        resetDemoData: resetToMockData,
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
