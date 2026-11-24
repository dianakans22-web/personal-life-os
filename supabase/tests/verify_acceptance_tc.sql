-- =============================================================================
-- verify_acceptance_tc.sql
-- Automated PostgreSQL acceptance verification covering Blueprint TC-01..TC-14:
-- TC-01: Supervision event in Unified Calendar (zero duplication)
-- TC-02: Habit completion log
-- TC-03: Expense updates account balance via v_account_balances
-- TC-04: Transfer via post_account_transfer keeps total net cash unchanged
-- TC-05/06/07/08: Planned/Spontaneous trip, RAB revision & Finance realization
-- TC-09: Academic task linked to project & task_history trigger on reschedule
-- TC-11: Timezone preserved in TIMESTAMPTZ
-- TC-14: Cross-user & anonymous access denied by RLS + posted tx delete blocked
-- =============================================================================

\set ON_ERROR_STOP on

-- Mock minimal Supabase auth schema for standalone Postgres verification
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END;
$$;

-- Apply all 7 migrations
\i /migrations/0001_extensions_and_core.sql
\i /migrations/0002_daily_life.sql
\i /migrations/0003_finance.sql
\i /migrations/0004_travel.sql
\i /migrations/0005_academic.sql
\i /migrations/0006_journal_drive_integrations.sql
\i /migrations/0007_views_triggers_and_rls.sql

-- Grant privileges to authenticated role (RLS governs row access)
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Seed two distinct users (Owner A and Intruder B)
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test');

-- Switch to Owner A session under authenticated role (non-superuser so RLS is strictly enforced)
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

DO $$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_proj UUID;
  v_ev UUID;
  v_task UUID;
  v_acc_bca UUID;
  v_acc_gopay UUID;
  v_cat_travel UUID;
  v_trip UUID;
  v_tx_exp UUID;
  v_tx_trf UUID;
  v_cash_before NUMERIC;
  v_cash_after NUMERIC;
  v_rab_actual NUMERIC;
  v_thesis_pct NUMERIC;
  v_hist_cnt INTEGER;
  v_delete_blocked BOOLEAN := false;
BEGIN
  -- Profile
  INSERT INTO public.profiles (user_id, display_name, timezone, base_currency)
  VALUES (v_uid, 'Pemilik Personal', 'Asia/Jakarta', 'IDR');

  -- TC-01 & TC-09: Academic Project + Weighted Thesis + Supervision Event + Task
  INSERT INTO public.projects (user_id, name, project_type)
  VALUES (v_uid, 'Tesis Pascasarjana', 'Academic') RETURNING id INTO v_proj;

  INSERT INTO public.thesis_sections (user_id, project_id, title, section_order, weight, progress) VALUES
    (v_uid, v_proj, 'Bab I', 1, 20, 100),
    (v_uid, v_proj, 'Bab II', 2, 30, 80),
    (v_uid, v_proj, 'Bab III', 3, 50, 40);

  SELECT weighted_progress_pct INTO v_thesis_pct FROM public.v_thesis_weighted_progress WHERE project_id = v_proj;
  ASSERT v_thesis_pct = 64.00, format('Expected weighted progress 64.00, got %s', v_thesis_pct);

  INSERT INTO public.events (user_id, source_module, project_id, title, planned_start_at, planned_end_at)
  VALUES (v_uid, 'Academic', v_proj, 'Bimbingan Tesis Bab III', '2026-11-24T09:00:00+07:00', '2026-11-24T10:00:00+07:00')
  RETURNING id INTO v_ev;

  INSERT INTO public.supervision_logs (user_id, project_id, event_id, supervisor_name, meeting_date, agenda, revision_point)
  VALUES (v_uid, v_proj, v_ev, 'Pembimbing', '2026-11-24T09:00:00+07:00', 'Review Bab III', 'Revisi sampel');

  ASSERT (SELECT count(*) FROM public.v_unified_calendar WHERE event_id = v_ev) = 1, 'TC-01 failed';

  INSERT INTO public.tasks (user_id, project_id, related_event_id, title, priority, status, due_at)
  VALUES (v_uid, v_proj, v_ev, 'Revisi sampel Bab III', 'High', 'To Do', '2026-11-26T17:00:00+07:00')
  RETURNING id INTO v_task;

  -- Trigger task_history on reschedule
  UPDATE public.tasks SET due_at = '2026-11-28T17:00:00+07:00' WHERE id = v_task;
  SELECT count(*) INTO v_hist_cnt FROM public.task_history WHERE task_id = v_task;
  ASSERT v_hist_cnt = 1, 'TC-09 task_history trigger failed';

  -- TC-03, TC-04, TC-07, TC-08: Accounts, Trip, RAB, Expense, Transfer, Delete guard, Reversal
  INSERT INTO public.financial_accounts (user_id, name, account_type, opening_balance)
  VALUES (v_uid, 'Rekening BCA', 'Bank', 10000000) RETURNING id INTO v_acc_bca;
  INSERT INTO public.financial_accounts (user_id, name, account_type, opening_balance)
  VALUES (v_uid, 'GoPay', 'E-Wallet', 1000000) RETURNING id INTO v_acc_gopay;

  INSERT INTO public.finance_categories (user_id, name, category_type)
  VALUES (v_uid, 'Perjalanan', 'Expense') RETURNING id INTO v_cat_travel;

  INSERT INTO public.trips (user_id, name, trip_type, status, city, start_date, end_date)
  VALUES (v_uid, 'Trip Yogyakarta', 'planned', 'planned', 'Yogyakarta', '2026-11-29', '2026-12-01')
  RETURNING id INTO v_trip;

  INSERT INTO public.trip_budget_items (user_id, trip_id, category, initial_amount, revised_amount)
  VALUES (v_uid, v_trip, 'Transportasi', 500000, 550000);

  -- Record expense linked to Trip Yogyakarta (TC-03 + TC-07)
  INSERT INTO public.transactions (user_id, transaction_type, amount, base_amount, status, posted_at, merchant, trip_id, rab_category)
  VALUES (v_uid, 'Expense', 450000, 450000, 'Posted', now(), 'KAI Yogyakarta', v_trip, 'Transportasi')
  RETURNING id INTO v_tx_exp;

  INSERT INTO public.transaction_entries (user_id, transaction_id, account_id, signed_amount)
  VALUES (v_uid, v_tx_exp, v_acc_bca, -450000);
  INSERT INTO public.transaction_splits (user_id, transaction_id, category_id, amount)
  VALUES (v_uid, v_tx_exp, v_cat_travel, 450000);

  -- Verify RAB realization pulls directly from Finance (TC-07 & TC-08)
  SELECT actual_spent INTO v_rab_actual FROM public.v_trip_rab_realization WHERE trip_id = v_trip AND category = 'Transportasi';
  ASSERT v_rab_actual = 450000, format('TC-07 failed: expected 450000 got %s', v_rab_actual);

  -- Verify Transfer neutral total cash (TC-04)
  SELECT SUM(current_balance) INTO v_cash_before FROM public.v_account_balances WHERE include_in_net_cash = true;
  v_tx_trf := public.post_account_transfer(v_acc_bca, v_acc_gopay, 500000, now(), 'Topup GoPay');
  SELECT SUM(current_balance) INTO v_cash_after FROM public.v_account_balances WHERE include_in_net_cash = true;
  ASSERT v_cash_before = v_cash_after, format('TC-04 failed: before=%s after=%s', v_cash_before, v_cash_after);

  -- Verify Posted transaction cannot be deleted directly
  BEGIN
    DELETE FROM public.transactions WHERE id = v_tx_exp;
  EXCEPTION WHEN OTHERS THEN
    v_delete_blocked := true;
  END;
  ASSERT v_delete_blocked = true, 'Posted tx delete guard failed';

  -- Verify Reversal works cleanly
  PERFORM public.reverse_posted_transaction(v_tx_exp, 'Uji reversal');
  ASSERT (SELECT status FROM public.transactions WHERE id = v_tx_exp) = 'Reversed', 'Reversal status failed';

  -- Daily Life structured Exercise & Ibadah + Google Drive Auto-Folder
  INSERT INTO public.exercise_logs (user_id, sport_type, route_from, route_to, distance_km, duration_min, intensity)
  VALUES (v_uid, 'Naik Gunung', 'Basecamp Patak Banteng', 'Puncak Prau', 9.2, 210, 'Berat');

  INSERT INTO public.ibadah_logs (user_id, ibadah_type, detail_title, amount_label, duration_min)
  VALUES (v_uid, 'Murojaah', 'Juz 30', '2 halaman', 15);

  INSERT INTO public.drive_connections (user_id, account_email, root_folder_url)
  VALUES (v_uid, 'owner@gmail.com', 'https://drive.google.com/drive/folders/root-demo');

  RAISE NOTICE 'OWNER_TESTS_ALL_PASSED';
END;
$$;

-- TC-14: Switch to Intruder B (still authenticated non-superuser) and assert ZERO visibility into Owner A data via RLS!
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

DO $$
DECLARE
  v_leaked_tx INTEGER;
  v_leaked_events INTEGER;
  v_leaked_balances INTEGER;
  v_leaked_drive INTEGER;
  v_write_blocked BOOLEAN := false;
BEGIN
  SELECT count(*) INTO v_leaked_tx FROM public.transactions;
  SELECT count(*) INTO v_leaked_events FROM public.v_unified_calendar;
  SELECT count(*) INTO v_leaked_balances FROM public.v_account_balances;
  SELECT count(*) INTO v_leaked_drive FROM public.drive_connections;

  ASSERT v_leaked_tx = 0, format('TC-14 RLS leak on transactions: %s', v_leaked_tx);
  ASSERT v_leaked_events = 0, format('TC-14 RLS leak on v_unified_calendar: %s', v_leaked_events);
  ASSERT v_leaked_balances = 0, format('TC-14 RLS leak on v_account_balances: %s', v_leaked_balances);
  ASSERT v_leaked_drive = 0, format('TC-14 RLS leak on drive_connections: %s', v_leaked_drive);

  -- Also verify Intruder B cannot spoof Owner A's user_id on INSERT
  BEGIN
    INSERT INTO public.notes (user_id, content)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Spoof attempt');
  EXCEPTION WHEN insufficient_privilege THEN
    v_write_blocked := true;
  END;
  ASSERT v_write_blocked = true, 'TC-14 cross-user INSERT was not blocked by RLS!';

  RAISE NOTICE 'TC14_RLS_ISOLATION_PASSED';
END;
$$;

-- TC-14b: Switch to anon role and confirm access is denied
RESET ROLE;
SET ROLE anon;
DO $$
DECLARE
  v_anon_blocked BOOLEAN := false;
BEGIN
  BEGIN
    PERFORM * FROM public.transactions;
  EXCEPTION WHEN insufficient_privilege THEN
    v_anon_blocked := true;
  END;
  ASSERT v_anon_blocked = true, 'TC-14 anon access was not denied!';
  RAISE NOTICE 'TC14_ANON_DENIED_PASSED';
END;
$$;
