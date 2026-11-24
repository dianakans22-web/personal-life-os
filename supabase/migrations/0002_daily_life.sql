-- =============================================================================
-- 0002_daily_life.sql
-- Personal Life OS - Daily Life Management Tables
-- Includes structured Sport choices (Lari, Bersepeda, Renang, Naik Gunung, etc.)
-- and structured Ibadah choices (Baca Al-Quran, Zikir Pagi & Petang, Murojaah, Kajian)
-- =============================================================================

-- 1. HABITS (Definition separated from schedules and completion logs)
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Produktivitas'
    CHECK (category IN ('Ibadah', 'Zikir', 'Olahraga', 'Health', 'Produktivitas', 'Lainnya')),
  sub_type TEXT,
  tracking_type TEXT NOT NULL DEFAULT 'checklist'
    CHECK (tracking_type IN ('checklist', 'quantitative')),
  target_value NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (target_value > 0),
  unit TEXT NOT NULL DEFAULT 'sesi',
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_habits_user_active ON public.habits(user_id, is_active) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. HABIT SCHEDULES
CREATE TABLE public.habit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  frequency_rule TEXT NOT NULL DEFAULT 'DAILY',
  days_of_week SMALLINT[],
  preferred_time TIME,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_habit_schedules_habit_id ON public.habit_schedules(habit_id);
CREATE INDEX idx_habit_schedules_user_id ON public.habit_schedules(user_id);

-- 3. HABIT LOGS
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  actual_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (actual_value >= 0),
  status TEXT NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled', 'Completed', 'Skipped', 'Missed', 'Rescheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);

CREATE INDEX idx_habit_logs_user_date ON public.habit_logs(user_id, log_date DESC);

CREATE TRIGGER trg_habit_logs_updated_at
  BEFORE UPDATE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 4. ROUTINE TEMPLATES & ITEMS
CREATE TABLE public.routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routine_templates_user_id ON public.routine_templates(user_id);

CREATE TABLE public.routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routine_templates(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  time_of_day TIME
);

CREATE INDEX idx_routine_items_routine_id ON public.routine_items(routine_id);
CREATE INDEX idx_routine_items_user_id ON public.routine_items(user_id);

-- 5. ACTIVITY LOGS (Actual Life Timeline entries)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'Umum',
  sub_type TEXT,
  title TEXT NOT NULL,
  actual_start_at TIMESTAMPTZ NOT NULL,
  actual_end_at TIMESTAMPTZ,
  location_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_start ON public.activity_logs(user_id, actual_start_at DESC);

-- 6. EXERCISE LOGS (Structured sport choices with route, distance & duration)
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sport_type TEXT NOT NULL
    CHECK (sport_type IN (
      'Lari', 'Bersepeda', 'Renang', 'Naik Gunung',
      'Jalan Cepat', 'Gym / Kekuatan', 'Badminton / Futsal', 'Lainnya'
    )),
  route_from TEXT,
  route_to TEXT,
  distance_km NUMERIC(8,2) CHECK (distance_km IS NULL OR distance_km >= 0),
  elevation_m INTEGER CHECK (elevation_m IS NULL OR elevation_m >= 0),
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  intensity TEXT NOT NULL DEFAULT 'Sedang' CHECK (intensity IN ('Ringan', 'Sedang', 'Berat')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_logs_user_date ON public.exercise_logs(user_id, activity_date DESC);

-- 7. IBADAH LOGS (Structured ibadah choices: Al-Quran, Zikir, Murojaah, Kajian, etc.)
CREATE TABLE public.ibadah_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ibadah_type TEXT NOT NULL
    CHECK (ibadah_type IN (
      'Baca Al-Quran', 'Zikir Pagi & Petang', 'Murojaah', 'Kajian',
      'Salat Wajib (5 Waktu)', 'Salat Sunnah (Dhuha/Tahajud)',
      'Puasa Sunnah', 'Sedekah / Infaq', 'Lainnya'
    )),
  detail_title TEXT NOT NULL,
  amount_label TEXT,
  duration_min INTEGER CHECK (duration_min IS NULL OR duration_min >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ibadah_logs_user_date ON public.ibadah_logs(user_id, log_date DESC);

-- 8. SLEEP LOGS
CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_start_at TIMESTAMPTZ NOT NULL,
  sleep_end_at TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL CHECK (duration_hours > 0),
  quality TEXT NOT NULL DEFAULT 'Baik' CHECK (quality IN ('Sangat Baik', 'Baik', 'Cukup', 'Kurang')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sleep_end_at > sleep_start_at)
);

CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, sleep_date DESC);

-- 9. DAILY REFLECTIONS & WEEKLY REVIEWS
CREATE TABLE public.daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scope TEXT NOT NULL DEFAULT 'Daily Reflection'
    CHECK (scope IN ('Daily Reflection', 'Weekly Review')),
  mood TEXT DEFAULT 'Baik',
  gratitude TEXT,
  learning TEXT,
  next_plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_reflections_user_date ON public.daily_reflections(user_id, reflection_date DESC);

CREATE TRIGGER trg_daily_reflections_updated_at
  BEFORE UPDATE ON public.daily_reflections
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
