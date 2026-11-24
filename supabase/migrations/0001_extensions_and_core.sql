-- =============================================================================
-- 0001_extensions_and_core.sql
-- Personal Life OS - Extensions & Core System Tables
-- Standards: UUID PK, user_id ownership, TIMESTAMPTZ, NUMERIC currency, Audit
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. PROFILES (1:1 with auth.users)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Pengguna Personal',
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  base_currency CHAR(3) NOT NULL DEFAULT 'IDR',
  work_start TIME NOT NULL DEFAULT '07:00',
  work_end TIME NOT NULL DEFAULT '21:00',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  dashboard_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. PROJECTS (Parent for Academic, Travel, Personal, Work projects)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'Personal'
    CHECK (project_type IN ('Academic', 'Travel', 'Personal', 'Pekerjaan', 'Keuangan')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Planned', 'Active', 'On Hold', 'Completed', 'Archived')),
  start_date DATE,
  end_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_user_type_status ON public.projects(user_id, project_type, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 3. MILESTONES
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'Planned'
    CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Delayed')),
  weight NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX idx_milestones_project_id ON public.milestones(project_id);

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 4. EVENTS (Single Source of Truth for Unified Calendar & Planned vs Actual)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_module TEXT NOT NULL DEFAULT 'Daily Life'
    CHECK (source_module IN ('Daily Life', 'Finance', 'Travel', 'Academic', 'Task', 'Calendar')),
  sub_category TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT,
  planned_start_at TIMESTAMPTZ NOT NULL,
  planned_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  status TEXT NOT NULL DEFAULT 'Planned'
    CHECK (status IN ('Planned', 'Rescheduled', 'Completed', 'Skipped', 'Missed', 'Cancelled')),
  recurrence_rule TEXT,
  reschedule_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (planned_end_at IS NULL OR planned_end_at >= planned_start_at),
  CHECK (actual_end_at IS NULL OR actual_start_at IS NULL OR actual_end_at >= actual_start_at)
);

CREATE INDEX idx_events_user_start ON public.events(user_id, planned_start_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_user_module ON public.events(user_id, source_module) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_title_trgm ON public.events USING gin (title gin_trgm_ops);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 5. EVENT REMINDERS
CREATE TABLE public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'browser', 'email')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_reminders_user_time ON public.event_reminders(user_id, remind_at) WHERE status = 'Pending';

-- 6. EVENT EXCEPTIONS (Recurring overrides & single-instance reschedules)
CREATE TABLE public.event_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('Skipped', 'Rescheduled', 'Cancelled')),
  new_start_at TIMESTAMPTZ,
  new_end_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_exceptions_event_id ON public.event_exceptions(event_id);
CREATE INDEX idx_event_exceptions_user_id ON public.event_exceptions(user_id);

-- 7. TASKS (Cross-module Task & Project Management)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Inbox'
    CHECK (status IN ('Inbox', 'To Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_status_due ON public.tasks(user_id, status, due_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_title_trgm ON public.tasks USING gin (title gin_trgm_ops);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 8. TASK HISTORY (Reschedule & status change traceability)
CREATE TABLE public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  old_due_at TIMESTAMPTZ,
  new_due_at TIMESTAMPTZ,
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX idx_task_history_user_id ON public.task_history(user_id);

-- 9. TAGS & POLYMORPHIC ENTITY TAGS
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#146E5A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_tags_user_name ON public.tags(user_id, lower(name));

CREATE TABLE public.entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tag_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_tags_lookup ON public.entity_tags(user_id, entity_type, entity_id);

-- 10. NOTES (Quick Notes & General Notes)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'quick_note' CHECK (note_type IN ('quick_note', 'general', 'meeting')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_user_created ON public.notes(user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 11. ENTITY RELATIONS (Flexible cross-entity graph links)
CREATE TABLE public.entity_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related_to',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id, target_type, target_id, relation_type)
);

CREATE INDEX idx_entity_relations_src ON public.entity_relations(user_id, source_type, source_id);
CREATE INDEX idx_entity_relations_tgt ON public.entity_relations(user_id, target_type, target_id);

-- 12. MEDIA ASSETS (Private Object Storage Metadata)
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'private-vault',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  captured_at TIMESTAMPTZ,
  is_private BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_user_id ON public.media_assets(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- 13. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
