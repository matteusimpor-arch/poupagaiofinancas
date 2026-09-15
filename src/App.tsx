import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Transaction, Goal, Investment, WishlistItem } from './types';

// Navegação
import { Sidebar } from './components/navigation/Sidebar';
import { Header } from './components/navigation/Header';
import { MobileNav } from './components/navigation/MobileNav';
import { MobileDrawer } from './components/navigation/MobileDrawer';

// Autenticação & Onboarding
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { OnboardingModal } from './components/auth/OnboardingModal';

// Telas / Views
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { PlanningView } from './components/views/PlanningView';
import { InvestmentsView } from './components/views/InvestmentsView';
import { GoalsView } from './components/views/GoalsView';
import { WishlistView } from './components/views/WishlistView';
import { MercadoView } from './components/views/MercadoView';
import { ReportsView } from './components/views/ReportsView';
import { ProfileView } from './components/views/ProfileView';

// Modais
import { QuickAddModal } from './components/modals/QuickAddModal';
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { GoalModal } from './components/modals/GoalModal';
import { GoalMovementModal } from './components/modals/GoalMovementModal';
import { InvestmentModal } from './components/modals/InvestmentModal';
import { WishlistModal } from './components/modals/WishlistModal';
import { MonthClosingModal } from './components/modals/MonthClosingModal';
import { ReopenMonthModal } from './components/modals/ReopenMonthModal';
import { SpaceModal } from './components/modals/SpaceModal';
import { InviteModal } from './components/modals/InviteModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { ToastNotification } from './components/common/ToastNotification';

const AppContent: React.FC = () => {
  const { currentUser, isOnboarded, selectedMonth } = useFinance();

  // Estados de navegação e autenticação
  const [authView, setAuthView] = useState<'login' | 'register'>('register');
  const [isResetPasswordView, setIsResetPasswordView] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      (window.location.hash.includes('reset-password') ||
        window.location.href.includes('type=recovery') ||
        window.location.hash.includes('type=recovery'))
    );
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isOnboarded);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  React.useEffect(() => {
    const handleHashChange = () => {
      if (
        window.location.hash.includes('reset-password') ||
        window.location.href.includes('type=recovery') ||
        window.location.hash.includes('type=recovery')
      ) {
        setIsResetPasswordView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Garante que novos usuários cadastrados abram a tela de onboarding
  React.useEffect(() => {
    if (!isOnboarded && currentUser) {
      setShowOnboarding(true);
    }
  }, [isOnboarded, currentUser]);

  // Estados dos Modais
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<
    'income' | 'expense_fixed' | 'expense_variable'
  >('expense_variable');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [installmentPrefill, setInstallmentPrefill] = useState<{
    description?: string;
    totalAmount?: number;
    categoryId?: string;
  } | undefined>(undefined);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isGoalMovementModalOpen, setIsGoalMovementModalOpen] = useState(false);
  const [activeGoalForMovement, setActiveGoalForMovement] = useState<Goal | null>(null);
  const [goalMovementType, setGoalMovementType] = useState<'deposit' | 'withdraw'>('deposit');

  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<WishlistItem | null>(null);

  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenMonthTarget, setReopenMonthTarget] = useState(selectedMonth);

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Exibe tela de redefinição de senha se o link de recuperação foi acionado
  if (isResetPasswordView) {
    return (
      <ResetPasswordScreen
        userEmail={currentUser?.email}
        onComplete={() => {
          if (typeof window !== 'undefined') {
            window.location.hash = '';
          }
          setIsResetPasswordView(false);
          setAuthView('login');
        }}
      />
    );
  }

  // Se o usuário não estiver autenticado, exibe tela de login ou cadastro
  if (!currentUser) {
    if (authView === 'login') {
      return <LoginScreen onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterScreen onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Abertura de modais a partir do QuickAdd
  const handleSelectQuickAddType = (type: string) => {
    setIsQuickAddOpen(false);
    if (type === 'income' || type === 'expense_fixed' || type === 'expense_variable') {
      setTransactionType(type as any);
      setEditingTransaction(null);
      setIsTransactionModalOpen(true);
    } else if (type === 'installment') {
      setInstallmentPrefill(undefined);
      setIsInstallmentModalOpen(true);
    } else if (type === 'goal') {
      setEditingGoal(null);
      setIsGoalModalOpen(true);
    } else if (type === 'investment') {
      setEditingInvestment(null);
      setIsInvestmentModalOpen(true);
    } else if (type === 'wishlist') {
      setEditingWishlist(null);
      setIsWishlistModalOpen(true);
    } else if (type === 'market_list') {
      setCurrentTab('mercado');
    }
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionType(
      tx.type === 'income'
        ? 'income'
        : tx.type === 'expense_fixed'
        ? 'expense_fixed'
        : 'expense_variable'
    );
    setIsTransactionModalOpen(true);
  };

  const handleOpenGoalMovement = (goal: Goal, type: 'deposit' | 'withdraw') => {
    setActiveGoalForMovement(goal);
    setGoalMovementType(type);
    setIsGoalMovementModalOpen(true);
  };

  const handleOpenReopenMonth = (month: string) => {
    setReopenMonthTarget(month);
    setIsReopenModalOpen(true);
  };

  const handleConvertWishlistToTransaction = (item: WishlistItem) => {
    setTransactionType('expense_variable');
    setEditingTransaction({
      id: '',
      space_id: '',
      user_id: '',
      description: item.name,
      amount: item.estimated_amount,
      type: 'expense_variable',
      category_id: item.category_id || 'cat-exp-compras',
      due_date: new Date().toISOString().slice(0, 10),
      payment_date: new Date().toISOString().slice(0, 10),
      status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    setIsTransactionModalOpen(true);
  };

  const handleConvertWishlistToInstallment = (item: WishlistItem) => {
    setInstallmentPrefill({
      description: item.name,
      totalAmount: item.estimated_amount,
      categoryId: item.category_id || 'cat-exp-compras',
    });
    setIsInstallmentModalOpen(true);
  };

  return (
    <div id="poupagaio-app-shell" className="min-h-screen bg-[#F6FAF7] flex">
      {/* Sidebar Desktop */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSpaceModal={() => setIsSpaceModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-8">
        {/* Header Superior */}
        <Header
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenInvite={() => setIsInviteModalOpen(true)}
          onOpenSpaceModal={() => setIsSpaceModalOpen(true)}
          onNavigateProfile={() => setCurrentTab('perfil')}
        />

        {/* Visualização Ativa */}
        <main className="flex-1 px-3.5 py-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenTransactionModal={(tx) => {
                setEditingTransaction(tx || null);
                setIsTransactionModalOpen(true);
              }}
              onOpenClosingModal={() => setIsClosingModalOpen(true)}
              onOpenReopenModal={handleOpenReopenMonth}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'movimentacoes' && (
            <TransactionsView
              onOpenAddTransaction={(type) => {
                setTransactionType(type || 'expense_variable');
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
              }}
              onOpenEditTransaction={handleOpenEditTransaction}
              onOpenAddInstallment={() => {
                setInstallmentPrefill(undefined);
                setIsInstallmentModalOpen(true);
              }}
            />
          )}

          {currentTab === 'planejamento' && <PlanningView />}

          {currentTab === 'investimentos' && (
            <InvestmentsView
              onOpenAddInvestment={() => {
                setEditingInvestment(null);
                setIsInvestmentModalOpen(true);
              }}
              onOpenEditInvestment={(inv) => {
                setEditingInvestment(inv);
                setIsInvestmentModalOpen(true);
              }}
            />
          )}

          {currentTab === 'metas' && (
            <GoalsView
              onOpenAddGoal={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              onOpenEditGoal={(goal) => {
                setEditingGoal(goal);
                setIsGoalModalOpen(true);
              }}
              onOpenGoalMovement={handleOpenGoalMovement}
            />
          )}

          {currentTab === 'desejos' && (
            <WishlistView
              onOpenAddWishlist={() => {
                setEditingWishlist(null);
                setIsWishlistModalOpen(true);
              }}
              onOpenEditWishlist={(item) => {
                setEditingWishlist(item);
                setIsWishlistModalOpen(true);
              }}
              onConvertWishlistToTransaction={handleConvertWishlistToTransaction}
              onConvertWishlistToInstallment={handleConvertWishlistToInstallment}
            />
          )}

          {currentTab === 'mercado' && (
            <MercadoView onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'relatorios' && <ReportsView />}

          {currentTab === 'perfil' && (
            <ProfileView
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenSpaceModal={() => setIsSpaceModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Navegação Mobile Inferior */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Gaveta de Navegação Completa Mobile */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSpaceModal={() => setIsSpaceModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
      />

      {/* Modal de Onboarding (quando novo usuário) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onFinish={(openFirst) => {
          setShowOnboarding(false);
          if (openFirst) {
            setTransactionType('income');
            setEditingTransaction(null);
            setIsTransactionModalOpen(true);
          }
        }}
      />

      {/* Modais do Sistema */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectType={handleSelectQuickAddType}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        initialType={transactionType}
        editingTransaction={editingTransaction}
      />

      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => {
          setIsInstallmentModalOpen(false);
          setInstallmentPrefill(undefined);
        }}
        prefill={installmentPrefill}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
      />

      <GoalMovementModal
        isOpen={isGoalMovementModalOpen}
        onClose={() => {
          setIsGoalMovementModalOpen(false);
          setActiveGoalForMovement(null);
        }}
        goal={activeGoalForMovement}
        type={goalMovementType}
      />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setEditingInvestment(null);
        }}
        editingInvestment={editingInvestment}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => {
          setIsWishlistModalOpen(false);
          setEditingWishlist(null);
        }}
        editingItem={editingWishlist}
      />

      <MonthClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        referenceMonth={selectedMonth}
      />

      <ReopenMonthModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        monthToReopen={reopenMonthTarget}
      />

      <SpaceModal isOpen={isSpaceModalOpen} onClose={() => setIsSpaceModalOpen(false)} />

      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
