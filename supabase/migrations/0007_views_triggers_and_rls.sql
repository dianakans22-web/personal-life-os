-- =============================================================================
-- 0007_views_triggers_and_rls.sql
-- Personal Life OS - Accounting Guards, Atomic RPCs, Derived Views & Full RLS
-- Follows Supabase RLS performance guidelines: (select auth.uid()) = user_id,
-- security_invoker = true on all views, explicit TO authenticated policies.
-- =============================================================================

-- ============================================================================
-- 1. ACCOUNTING INTEGRITY TRIGGERS & ATOMIC FUNCTIONS
-- ============================================================================

-- Guard 1: Posted transactions cannot be permanently deleted (use Void/Reversal)
CREATE OR REPLACE FUNCTION public.prevent_posted_transaction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'Posted' THEN
    RAISE EXCEPTION 'Posted transaction (%) cannot be deleted; use reverse_posted_transaction() instead.', OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_posted_tx_delete
  BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_transaction_delete();

-- Guard 2: Track Task status and due_at reschedule history automatically
CREATE OR REPLACE FUNCTION public.track_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.due_at IS DISTINCT FROM NEW.due_at) THEN
    INSERT INTO public.task_history (user_id, task_id, old_status, new_status, old_due_at, new_due_at, note)
    VALUES (
      NEW.user_id,
      NEW.id,
      OLD.status,
      NEW.status,
      OLD.due_at,
      NEW.due_at,
      CASE
        WHEN OLD.due_at IS DISTINCT FROM NEW.due_at THEN 'Due date rescheduled'
        ELSE 'Status updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_task_changes
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.track_task_changes();

-- Atomic RPC 1: Post a balanced Transfer between two accounts (TC-04)
-- Guarantees SUM(signed_amount) = 0 and net cash impact = 0
CREATE OR REPLACE FUNCTION public.post_account_transfer(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC(18,2),
  p_occurred_at TIMESTAMPTZ DEFAULT now(),
  p_notes TEXT DEFAULT 'Transfer antar-akun'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := (select auth.uid());
  v_tx_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: auth.uid() is null';
  END IF;
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Source and destination accounts must differ';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  INSERT INTO public.transactions (
    user_id, transaction_type, amount, currency_code, exchange_rate, base_amount,
    occurred_at, posted_at, payment_method, merchant, notes, status
  )
  VALUES (
    v_uid, 'Transfer', p_amount, 'IDR', 1, p_amount,
    p_occurred_at, now(), 'Transfer', 'Transfer Antar-Akun', p_notes, 'Posted'
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO public.transaction_entries (user_id, transaction_id, account_id, signed_amount)
  VALUES
    (v_uid, v_tx_id, p_from_account_id, -p_amount),
    (v_uid, v_tx_id, p_to_account_id, p_amount);

  INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, payload)
  VALUES (
    v_uid, 'transaction', v_tx_id, 'TRANSFER_POSTED',
    jsonb_build_object('from', p_from_account_id, 'to', p_to_account_id, 'amount', p_amount)
  );

  RETURN v_tx_id;
END;
$$;

-- Atomic RPC 2: Reverse a Posted transaction without erasing history
CREATE OR REPLACE FUNCTION public.reverse_posted_transaction(
  p_transaction_id UUID,
  p_reason TEXT DEFAULT 'Koreksi transaksi'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := (select auth.uid());
  v_orig public.transactions%ROWTYPE;
  v_rev_id UUID;
BEGIN
  SELECT * INTO v_orig FROM public.transactions
  WHERE id = p_transaction_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or unauthorized';
  END IF;
  IF v_orig.status <> 'Posted' THEN
    RAISE EXCEPTION 'Only Posted transactions can be reversed (current: %)', v_orig.status;
  END IF;

  UPDATE public.transactions
  SET status = 'Reversed'
  WHERE id = v_orig.id;

  INSERT INTO public.transactions (
    user_id, transaction_type, amount, currency_code, exchange_rate, base_amount,
    occurred_at, posted_at, payment_method, merchant, notes, status, reversed_of_id
  )
  VALUES (
    v_uid, 'Adjustment', v_orig.amount, v_orig.currency_code, v_orig.exchange_rate, v_orig.base_amount,
    now(), now(), 'Reversal', 'Pembalik: ' || COALESCE(v_orig.merchant, ''), p_reason, 'Posted', v_orig.id
  )
  RETURNING id INTO v_rev_id;

  INSERT INTO public.transaction_entries (user_id, transaction_id, account_id, signed_amount)
  SELECT v_uid, v_rev_id, te.account_id, -te.signed_amount
  FROM public.transaction_entries te
  WHERE te.transaction_id = v_orig.id;

  INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, payload)
  VALUES (
    v_uid, 'transaction', v_orig.id, 'TRANSACTION_REVERSED',
    jsonb_build_object('reversal_id', v_rev_id, 'reason', p_reason)
  );

  RETURN v_rev_id;
END;
$$;

-- ============================================================================
-- 2. DERIVED VIEWS (Bab 9.9 - security_invoker = true enforces caller RLS)
-- ============================================================================

-- View 1: Live Account Balances (opening_balance + posted entries only)
CREATE OR REPLACE VIEW public.v_account_balances
WITH (security_invoker = true) AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.name,
  a.account_type,
  a.currency_code,
  a.include_in_net_cash,
  a.opening_balance,
  COALESCE(SUM(te.signed_amount) FILTER (WHERE t.status = 'Posted' AND t.deleted_at IS NULL), 0)::NUMERIC(18,2) AS posted_mutations,
  (a.opening_balance + COALESCE(SUM(te.signed_amount) FILTER (WHERE t.status = 'Posted' AND t.deleted_at IS NULL), 0))::NUMERIC(18,2) AS current_balance
FROM public.financial_accounts a
LEFT JOIN public.transaction_entries te ON te.account_id = a.id
LEFT JOIN public.transactions t ON t.id = te.transaction_id
WHERE a.deleted_at IS NULL
GROUP BY a.id;

-- View 2: Monthly Cash Flow (excludes Transfer & Draft)
CREATE OR REPLACE VIEW public.v_monthly_cashflow
WITH (security_invoker = true) AS
SELECT
  t.user_id,
  date_trunc('month', t.occurred_at)::DATE AS month_start,
  COALESCE(SUM(t.base_amount) FILTER (WHERE t.transaction_type IN ('Income', 'Refund')), 0)::NUMERIC(18,2) AS total_income,
  COALESCE(SUM(t.base_amount) FILTER (WHERE t.transaction_type = 'Expense'), 0)::NUMERIC(18,2) AS total_expense,
  (
    COALESCE(SUM(t.base_amount) FILTER (WHERE t.transaction_type IN ('Income', 'Refund')), 0)
    - COALESCE(SUM(t.base_amount) FILTER (WHERE t.transaction_type = 'Expense'), 0)
  )::NUMERIC(18,2) AS net_cashflow
FROM public.transactions t
WHERE t.status = 'Posted' AND t.deleted_at IS NULL
GROUP BY t.user_id, date_trunc('month', t.occurred_at);

-- View 3: Monthly Budget vs Actuals
CREATE OR REPLACE VIEW public.v_budget_actuals
WITH (security_invoker = true) AS
SELECT
  b.id AS budget_id,
  b.user_id,
  b.name AS budget_name,
  b.period_start,
  b.period_end,
  bi.category_id,
  c.name AS category_name,
  bi.initial_allocated,
  bi.allocated_amount,
  COALESCE(SUM(ts.amount), 0)::NUMERIC(18,2) AS actual_spent,
  (bi.allocated_amount - COALESCE(SUM(ts.amount), 0))::NUMERIC(18,2) AS remaining_amount
FROM public.budgets b
JOIN public.budget_items bi ON bi.budget_id = b.id
JOIN public.finance_categories c ON c.id = bi.category_id
LEFT JOIN public.transaction_splits ts ON ts.category_id = bi.category_id
LEFT JOIN public.transactions t
  ON t.id = ts.transaction_id
  AND t.user_id = b.user_id
  AND t.status = 'Posted'
  AND t.transaction_type = 'Expense'
  AND t.deleted_at IS NULL
  AND t.occurred_at::DATE BETWEEN b.period_start AND b.period_end
GROUP BY b.id, bi.id, c.name;

-- View 4: Travel RAB vs Realization (Zero duplication: pulls directly from Finance)
CREATE OR REPLACE VIEW public.v_trip_rab_realization
WITH (security_invoker = true) AS
SELECT
  r.id AS rab_item_id,
  r.user_id,
  r.trip_id,
  tr.name AS trip_name,
  r.category,
  r.initial_amount,
  r.revised_amount,
  COALESCE(SUM(tx.base_amount), 0)::NUMERIC(18,2) AS actual_spent,
  (r.revised_amount - COALESCE(SUM(tx.base_amount), 0))::NUMERIC(18,2) AS variance_amount
FROM public.trip_budget_items r
JOIN public.trips tr ON tr.id = r.trip_id
LEFT JOIN public.transactions tx
  ON tx.trip_id = r.trip_id
  AND tx.rab_category = r.category
  AND tx.user_id = r.user_id
  AND tx.status = 'Posted'
  AND tx.transaction_type = 'Expense'
  AND tx.deleted_at IS NULL
GROUP BY r.id, tr.name;

-- View 5: Weighted Thesis Progress
CREATE OR REPLACE VIEW public.v_thesis_weighted_progress
WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.user_id,
  p.name AS project_name,
  COALESCE(SUM(s.weight), 0)::NUMERIC(6,2) AS total_weight,
  CASE
    WHEN COALESCE(SUM(s.weight), 0) = 0 THEN 0::NUMERIC(5,2)
    ELSE ROUND(SUM(s.weight * s.progress) / SUM(s.weight), 2)
  END AS weighted_progress_pct
FROM public.projects p
LEFT JOIN public.thesis_sections s ON s.project_id = p.id
WHERE p.project_type = 'Academic' AND p.deleted_at IS NULL
GROUP BY p.id;

-- View 6: Unified Calendar (Single Source of Truth)
CREATE OR REPLACE VIEW public.v_unified_calendar
WITH (security_invoker = true) AS
SELECT
  e.id AS event_id,
  e.user_id,
  e.source_module,
  e.sub_category,
  e.title,
  e.location_text,
  e.planned_start_at,
  e.planned_end_at,
  e.actual_start_at,
  e.actual_end_at,
  e.timezone,
  e.status,
  e.project_id,
  p.name AS project_name
FROM public.events e
LEFT JOIN public.projects p ON p.id = e.project_id
WHERE e.deleted_at IS NULL;

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) FOR EVERY SINGLE PUBLIC TABLE
-- Uses (select auth.uid()) = user_id for optimal query plan caching.
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    'profiles', 'projects', 'milestones', 'events', 'event_reminders', 'event_exceptions',
    'tasks', 'task_history', 'tags', 'entity_tags', 'notes', 'entity_relations',
    'media_assets', 'audit_logs',
    'habits', 'habit_schedules', 'habit_logs', 'routine_templates', 'routine_items',
    'activity_logs', 'exercise_logs', 'ibadah_logs', 'sleep_logs', 'daily_reflections',
    'financial_accounts', 'finance_categories', 'transactions', 'transaction_entries',
    'transaction_splits', 'budgets', 'budget_items', 'recurring_rules',
    'savings_goals', 'savings_contributions', 'debts', 'debt_payments',
    'assets', 'asset_valuations',
    'trips', 'places', 'trip_days', 'trip_stops', 'trip_routes',
    'trip_budget_items', 'reservations', 'trip_participants',
    'academic_project_details', 'thesis_sections', 'paper_details',
    'supervision_logs', 'research_logs', 'academic_references',
    'project_references', 'document_versions',
    'journal_entries', 'journal_media', 'media_locations',
    'drive_connections', 'drive_folders', 'drive_documents', 'drive_sync_logs',
    'integration_connections', 'external_event_mappings', 'sync_logs',
    'notification_preferences', 'notifications', 'backup_records'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);',
      'p_' || tbl || '_select', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);',
      'p_' || tbl || '_insert', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);',
      'p_' || tbl || '_update', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);',
      'p_' || tbl || '_delete', tbl
    );
  END LOOP;
END;
$$;
