-- ==========================================================
-- POUPAGAIO - SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY
-- Arquivo de migração completo conforme Seções 22 e 23
-- ==========================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    due_alert_days INTEGER NOT NULL DEFAULT 3 CHECK (due_alert_days IN (3, 5, 7)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA: FINANCIAL_SPACES
CREATE TABLE IF NOT EXISTS public.financial_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: SPACE_MEMBERS
CREATE TABLE IF NOT EXISTS public.space_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(space_id, user_id)
);

-- 4. TABELA: SPACE_INVITATIONS
CREATE TABLE IF NOT EXISTS public.space_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA: CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT NOT NULL DEFAULT '#22C55E',
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    institution TEXT,
    initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    color TEXT DEFAULT '#22C55E',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: CREDIT_CARDS
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT DEFAULT '#EF5350',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense_fixed', 'expense_variable')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    payment_method TEXT,
    due_date DATE NOT NULL,
    payment_date DATE,
    reference_month TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT NOT NULL CHECK (status IN ('paid', 'due_soon', 'due_today', 'overdue', 'pending', 'scheduled', 'cancelled')),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    attachment_url TEXT,
    installment_id UUID,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: RECURRING_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense_fixed')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: INSTALLMENT_PURCHASES
CREATE TABLE IF NOT EXISTS public.installment_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    installments_count INTEGER NOT NULL CHECK (installments_count > 1),
    installment_amount NUMERIC(14,2) NOT NULL CHECK (installment_amount > 0),
    first_due_date DATE NOT NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA: INSTALLMENTS
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES public.installment_purchases(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    due_date DATE NOT NULL,
    reference_month TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'due_soon', 'due_today', 'overdue', 'pending', 'scheduled', 'cancelled')),
    paid_date DATE,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA: INVESTMENTS
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('emergency_reserve', 'fixed_income', 'stocks', 'real_estate_funds', 'treasury', 'crypto', 'other')),
    institution TEXT NOT NULL,
    initial_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    quantity NUMERIC(14,4) DEFAULT 1.0000,
    average_price NUMERIC(14,2) DEFAULT 0.00,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TABELA: INVESTMENT_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.investment_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'yield_update')),
    amount NUMERIC(14,2) NOT NULL,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. TABELA: GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    saved_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (saved_amount >= 0),
    target_date DATE,
    monthly_target NUMERIC(14,2) DEFAULT 0.00,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TABELA: GOAL_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.goal_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    previous_balance NUMERIC(14,2) NOT NULL,
    new_balance NUMERIC(14,2) NOT NULL,
    reason TEXT, -- Obrigatório para 'withdraw'
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. TABELA: WISHLIST_ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_amount NUMERIC(14,2) NOT NULL CHECK (estimated_amount > 0),
    reserved_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    desired_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    image_url TEXT,
    external_link TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'saving', 'ready_to_buy', 'purchased', 'cancelled')),
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. TABELA: MONTHLY_PLANS
CREATE TABLE IF NOT EXISTS public.monthly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL, -- Format: YYYY-MM
    expected_income NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    spending_limit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    target_to_save NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    target_to_invest NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    priority_bills TEXT[],
    priority_goals UUID[],
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(space_id, reference_month)
);

-- 18. TABELA: MONTHLY_CLOSINGS
CREATE TABLE IF NOT EXISTS public.monthly_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT NOT NULL CHECK (status IN ('closed', 'reopened')),
    classification TEXT NOT NULL CHECK (classification IN ('goal_achieved', 'partially_achieved', 'out_of_target')),
    total_income NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_saved NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_invested NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    final_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    leftover_destination TEXT CHECK (leftover_destination IN ('next_month', 'goal', 'reserve', 'investments', 'debt_payoff')),
    destination_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    mascot_message TEXT,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reopened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reopened_at TIMESTAMPTZ,
    reopening_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(space_id, reference_month)
);

-- 19. TABELA: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('due_soon', 'due_today', 'overdue', 'installment_soon', 'monthly_goal_missed', 'invitation_received', 'closing_ready', 'goal_completed')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. TABELA: AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES public.financial_spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- ÍNDICES DE PERFORMANCE (Seção 22)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_spaces_owner ON public.financial_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_members_space_user ON public.space_members(space_id, user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_space ON public.transactions(space_id);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON public.transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON public.transactions(reference_month);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_installments_space_month ON public.installments(space_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_space ON public.audit_logs(space_id);

-- ==========================================================
-- FUNÇÕES DE SEGURANÇA E RLS (Seção 23)
-- ==========================================================

-- Função auxiliar não-recursiva para verificar associação ao espaço
CREATE OR REPLACE FUNCTION public.is_space_member(space_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = space_uuid AND user_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.financial_spaces
    WHERE id = space_uuid AND owner_id = user_uuid
  );
$$;

-- Função auxiliar não-recursiva para verificar se é admin do espaço
CREATE OR REPLACE FUNCTION public.is_space_admin(space_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = space_uuid AND user_id = user_uuid AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.financial_spaces
    WHERE id = space_uuid AND owner_id = user_uuid
  );
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas PROFILES
CREATE POLICY "Users can view and update their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- Políticas FINANCIAL_SPACES
CREATE POLICY "Users can access spaces they belong to"
    ON public.financial_spaces FOR SELECT
    USING (public.is_space_member(id, auth.uid()));

CREATE POLICY "Users can create their own spaces"
    ON public.financial_spaces FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only admins or owners can update spaces"
    ON public.financial_spaces FOR UPDATE
    USING (public.is_space_admin(id, auth.uid()));

CREATE POLICY "Only owners can delete spaces"
    ON public.financial_spaces FOR DELETE
    USING (auth.uid() = owner_id);

-- Políticas SPACE_MEMBERS
CREATE POLICY "Members can view other members of their space"
    ON public.space_members FOR SELECT
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Admins can manage space members"
    ON public.space_members FOR ALL
    USING (public.is_space_admin(space_id, auth.uid()));

-- Políticas SPACE_INVITATIONS
CREATE POLICY "Users can view invitations for their email or spaces they admin"
    ON public.space_invitations FOR SELECT
    USING (
      invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR public.is_space_admin(space_id, auth.uid())
    );

-- Políticas TRANSACTIONS
CREATE POLICY "Members can view transactions in their space"
    ON public.transactions FOR SELECT
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can insert transactions in their space"
    ON public.transactions FOR INSERT
    WITH CHECK (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can update permitted transactions in their space"
    ON public.transactions FOR UPDATE
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Only admins or creators can delete transactions"
    ON public.transactions FOR DELETE
    USING (
      public.is_space_admin(space_id, auth.uid())
      OR created_by = auth.uid()
    );

-- Políticas GOALS & MOVEMENTS
CREATE POLICY "Members can view and manage goals in their space"
    ON public.goals FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can view and manage goal movements in their space"
    ON public.goal_movements FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas INVESTMENTS
CREATE POLICY "Members can view and manage investments in their space"
    ON public.investments FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas MONTHLY_CLOSINGS
CREATE POLICY "Members can view monthly closings"
    ON public.monthly_closings FOR SELECT
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Only admins can close the month"
    ON public.monthly_closings FOR INSERT
    WITH CHECK (public.is_space_admin(space_id, auth.uid()));

CREATE POLICY "Only admins can update or reopen monthly closings"
    ON public.monthly_closings FOR UPDATE
    USING (public.is_space_admin(space_id, auth.uid()));

-- Políticas NOTIFICATIONS
CREATE POLICY "Users can view and manage their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

-- Políticas AUDIT_LOGS (somente leitura para membros do espaço, nunca editáveis)
CREATE POLICY "Users can view audit logs for spaces they participate in"
    ON public.audit_logs FOR SELECT
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas CATEGORIES
CREATE POLICY "Members can view categories in their space"
    ON public.categories FOR SELECT
    USING (space_id IS NULL OR public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can manage categories in their space"
    ON public.categories FOR ALL
    USING (space_id IS NOT NULL AND public.is_space_member(space_id, auth.uid()));

-- Políticas ACCOUNTS
CREATE POLICY "Members can view and manage accounts in their space"
    ON public.accounts FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas CREDIT_CARDS
CREATE POLICY "Members can view and manage credit cards in their space"
    ON public.credit_cards FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas RECURRING_TRANSACTIONS
CREATE POLICY "Members can view and manage recurring transactions in their space"
    ON public.recurring_transactions FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas INSTALLMENT_PURCHASES
CREATE POLICY "Members can view and manage installment purchases in their space"
    ON public.installment_purchases FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas INSTALLMENTS
CREATE POLICY "Members can view and manage installments in their space"
    ON public.installments FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas WISHLIST_ITEMS
CREATE POLICY "Members can view and manage wishlist items in their space"
    ON public.wishlist_items FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));

-- Políticas MONTHLY_PLANS
CREATE POLICY "Members can view and manage monthly plans in their space"
    ON public.monthly_plans FOR ALL
    USING (public.is_space_member(space_id, auth.uid()));
