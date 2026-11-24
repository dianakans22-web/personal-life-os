-- =============================================================================
-- 0003_finance.sql
-- Personal Life OS - Accounting-Grade Finance Tables
-- Rules: NUMERIC(18,2) only (no FLOAT), balanced transfers, draft vs posted,
-- non-destructive void/reversal (no permanent delete of posted transactions)
-- =============================================================================

-- 1. FINANCIAL ACCOUNTS
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL
    CHECK (account_type IN ('Bank', 'E-Wallet', 'Tunai', 'Tabungan', 'Investasi')),
  currency_code CHAR(3) NOT NULL DEFAULT 'IDR',
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  include_in_net_cash BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_accounts_user_id ON public.financial_accounts(user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. FINANCE CATEGORIES (Hierarchical income/expense categories)
CREATE TABLE public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('Income', 'Expense')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_categories_user_id ON public.finance_categories(user_id);

-- 3. TRANSACTIONS (Master transaction record)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('Income', 'Expense', 'Transfer', 'Refund', 'Adjustment')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'IDR',
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  base_amount NUMERIC(18,2) NOT NULL CHECK (base_amount > 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ,
  payment_method TEXT,
  merchant TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Posted', 'Voided', 'Reversed')),
  reversed_of_id UUID REFERENCES public.transactions(id) ON DELETE RESTRICT,
  trip_id UUID, -- FK added in 0004_travel.sql
  rab_category TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_occurred ON public.transactions(user_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_status ON public.transactions(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_trip_id ON public.transactions(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_transactions_project_id ON public.transactions(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_transactions_merchant_trgm ON public.transactions USING gin (merchant gin_trgm_ops);

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 4. TRANSACTION ENTRIES (Account balance ledger lines)
CREATE TABLE public.transaction_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  signed_amount NUMERIC(18,2) NOT NULL CHECK (signed_amount <> 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tx_entries_account_id ON public.transaction_entries(account_id);
CREATE INDEX idx_tx_entries_tx_id ON public.transaction_entries(transaction_id);
CREATE INDEX idx_tx_entries_user_id ON public.transaction_entries(user_id);

-- 5. TRANSACTION SPLITS (Category allocation lines)
CREATE TABLE public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tx_splits_tx_id ON public.transaction_splits(transaction_id);
CREATE INDEX idx_tx_splits_cat_id ON public.transaction_splits(category_id);
CREATE INDEX idx_tx_splits_user_id ON public.transaction_splits(user_id);

-- 6. BUDGETS & BUDGET ITEMS
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);

CREATE INDEX idx_budgets_user_period ON public.budgets(user_id, period_start, period_end);

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE RESTRICT,
  initial_allocated NUMERIC(18,2) NOT NULL CHECK (initial_allocated >= 0),
  allocated_amount NUMERIC(18,2) NOT NULL CHECK (allocated_amount >= 0),
  alert_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 80,
  UNIQUE (budget_id, category_id)
);

CREATE INDEX idx_budget_items_user_id ON public.budget_items(user_id);

-- 7. RECURRING RULES (Generates Drafts only, never auto-posted paid)
CREATE TABLE public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Harian', 'Mingguan', 'Bulanan', 'Tahunan')),
  next_occurrence DATE NOT NULL,
  template_data JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_rules_user_next ON public.recurring_rules(user_id, next_occurrence) WHERE is_active = true;

-- 8. SAVINGS GOALS & CONTRIBUTIONS (Allocations without double-counting cash)
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(18,2) NOT NULL CHECK (target_amount > 0),
  target_date DATE,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Reached', 'Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);

CREATE TABLE public.savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  is_internal_allocation BOOLEAN NOT NULL DEFAULT true,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_savings_contrib_goal_id ON public.savings_contributions(goal_id);
CREATE INDEX idx_savings_contrib_user_id ON public.savings_contributions(user_id);

-- 9. DEBTS / RECEIVABLES & PAYMENTS
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_type TEXT NOT NULL CHECK (debt_type IN ('Utang', 'Piutang')),
  counterparty TEXT NOT NULL,
  principal NUMERIC(18,2) NOT NULL CHECK (principal > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Berjalan' CHECK (status IN ('Berjalan', 'Lunas', 'Macet')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debts_user_id ON public.debts(user_id);

CREATE TABLE public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);

-- 10. NON-CASH ASSETS & VALUATIONS
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  acquisition_value NUMERIC(18,2) NOT NULL CHECK (acquisition_value >= 0),
  acquired_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);

CREATE TABLE public.asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC(18,2) NOT NULL CHECK (value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_valuations_asset_date ON public.asset_valuations(asset_id, valuation_date DESC);
CREATE INDEX idx_asset_valuations_user_id ON public.asset_valuations(user_id);
