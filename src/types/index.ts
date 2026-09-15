export type SpaceRole = 'admin' | 'member';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  due_alert_days: 3 | 5 | 7;
  created_at: string;
}

export interface FinancialSpace {
  id: string;
  name: string;
  is_shared: boolean;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  members_count?: number;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceRole;
  user?: Profile;
  created_at: string;
}

export interface SpaceInvitation {
  id: string;
  space_id: string;
  invited_email: string;
  role: SpaceRole;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  invited_by: string;
  created_at: string;
}

export type MovementType =
  | 'income'
  | 'expense_fixed'
  | 'expense_variable'
  | 'installment'
  | 'investment'
  | 'goal';

export type AccountStatus =
  | 'paid'
  | 'due_soon'
  | 'due_today'
  | 'overdue'
  | 'pending'
  | 'scheduled'
  | 'cancelled';

export interface StatusMeta {
  status: AccountStatus;
  label: string;
  color: string;
  bgLight: string;
  borderColor: string;
  iconName: string;
  ariaLabel: string;
  screenReaderDescription: string;
}

export interface Category {
  id: string;
  space_id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
  is_hidden?: boolean;
  display_order?: number;
  is_default?: boolean;
}

export interface Account {
  id: string;
  space_id: string;
  name: string;
  institution?: string;
  initial_balance: number;
  current_balance: number;
  color: string;
}

export interface CreditCard {
  id: string;
  space_id: string;
  name: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
}

export interface Transaction {
  id: string;
  space_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense_fixed' | 'expense_variable';
  category_id?: string;
  category?: Category;
  responsible_user_id?: string;
  responsible_user?: Profile;
  account_id?: string;
  credit_card_id?: string;
  payment_method?: string;
  due_date: string; // YYYY-MM-DD
  payment_date?: string; // YYYY-MM-DD
  reference_month: string; // YYYY-MM
  status: AccountStatus;
  is_recurring: boolean;
  recurrence_rule?: 'only_this_month' | 'this_and_future';
  notes?: string;
  attachment_url?: string;
  installment_id?: string;
  created_by?: string;
  created_by_user?: Profile;
  paid_by?: string;
  paid_by_user?: Profile;
  created_at: string;
  updated_at?: string;
}

export interface InstallmentPurchase {
  id: string;
  space_id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  installment_amount: number;
  first_due_date: string;
  credit_card_id?: string;
  category_id?: string;
  category?: Category;
  responsible_user_id?: string;
  responsible_user?: Profile;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Installment {
  id: string;
  space_id: string;
  purchase_id: string;
  purchase_description: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  reference_month: string;
  status: AccountStatus;
  paid_date?: string;
  paid_by?: string;
  category_id?: string;
}

export interface Investment {
  id: string;
  space_id: string;
  name: string;
  type:
    | 'emergency_reserve'
    | 'fixed_income'
    | 'stocks'
    | 'real_estate_funds'
    | 'treasury'
    | 'crypto'
    | 'other';
  institution: string;
  initial_amount: number;
  current_amount: number;
  quantity?: number;
  average_price?: number;
  application_date?: string;
  estimated_yield?: number;
  responsible_user_id?: string;
  responsible_user?: Profile;
  notes?: string;
  created_at: string;
}

export interface InvestmentMovement {
  id: string;
  investment_id: string;
  space_id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'yield_update';
  amount: number;
  responsible_user_id?: string;
  notes?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  space_id: string;
  name: string;
  description?: string;
  target_amount: number;
  saved_amount: number;
  target_date?: string;
  deadline?: string;
  category?: string;
  color?: string;
  monthly_target: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  responsible_user_id?: string;
  responsible_user?: Profile;
  created_at: string;
}

export interface GoalMovement {
  id: string;
  goal_id: string;
  space_id: string;
  date: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason?: string; // Obrigatório para withdraw
  responsible_user_id?: string;
  responsible_user?: Profile;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  space_id: string;
  name: string;
  description?: string;
  estimated_amount: number;
  estimated_price?: number;
  category_id?: string;
  reserved_amount: number;
  desired_date?: string;
  priority: 'low' | 'medium' | 'high';
  image_url?: string;
  external_link?: string;
  status: 'planning' | 'saving' | 'ready_to_buy' | 'purchased' | 'cancelled';
  responsible_user_id?: string;
  responsible_user?: Profile;
  created_at: string;
}

export interface MonthlyPlan {
  id: string;
  space_id: string;
  reference_month: string; // YYYY-MM
  expected_income: number;
  income_expected?: number;
  spending_limit: number;
  expense_budget?: number;
  target_to_save: number;
  savings_target?: number;
  target_to_invest: number;
  priority_bills?: string[];
  priority_goals?: string[];
  category_budgets?: Record<string, number>;
  notes?: string;
}

export type MonthClassification = 'goal_achieved' | 'partially_achieved' | 'out_of_target';

export interface MonthlyClosing {
  id: string;
  space_id: string;
  reference_month: string;
  status: 'closed' | 'reopened';
  classification: MonthClassification;
  total_income: number;
  total_expenses: number;
  total_saved: number;
  total_withdrawn: number;
  total_invested: number;
  final_balance: number;
  leftover_destination?: 'next_month' | 'goal' | 'reserve' | 'investments' | 'debt_payoff';
  destination_goal_id?: string;
  mascot_message: string;
  closed_by?: string;
  closed_by_user?: Profile;
  closed_at: string;
  reopened_by?: string;
  reopened_by_user?: Profile;
  reopened_at?: string;
  reopening_reason?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  space_id?: string;
  title: string;
  message: string;
  type:
    | 'due_soon'
    | 'due_today'
    | 'overdue'
    | 'installment_soon'
    | 'monthly_goal_missed'
    | 'invitation_received'
    | 'closing_ready'
    | 'goal_completed';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  space_id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}
