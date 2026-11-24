-- =============================================================================
-- 0006_journal_drive_integrations.sql
-- Personal Life OS - Journal, Media, Google Drive Auto-Folder & System Tables
-- Includes dedicated tables for Google Drive root URL, auto-created folders,
-- uploaded files & attached Google Drive links
-- =============================================================================

-- 1. JOURNAL ENTRIES & MEDIA LINKS
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_date ON public.journal_entries(user_id, journal_date DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TABLE public.journal_media (
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (journal_entry_id, media_asset_id)
);

CREATE INDEX idx_journal_media_user_id ON public.journal_media(user_id);

CREATE TABLE public.media_locations (
  media_asset_id UUID PRIMARY KEY REFERENCES public.media_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6)
);

CREATE INDEX idx_media_locations_user_id ON public.media_locations(user_id);

-- 2. GOOGLE DRIVE INTEGRATION, AUTO-FOLDER & ATTACHED LINKS (Module 10)
CREATE TABLE public.drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_email TEXT,
  root_folder_name TEXT NOT NULL DEFAULT '/Personal Life OS',
  root_folder_id TEXT,
  root_folder_url TEXT,
  auto_create_folder BOOLEAN NOT NULL DEFAULT true,
  folder_pattern TEXT NOT NULL DEFAULT 'module_year_object'
    CHECK (folder_pattern IN ('module_year_object', 'year_month_module', 'module_category')),
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  encrypted_tokens_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_drive_connections_updated_at
  BEFORE UPDATE ON public.drive_connections
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TABLE public.drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.drive_connections(id) ON DELETE CASCADE,
  folder_path TEXT NOT NULL,
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  module_name TEXT NOT NULL,
  is_auto_created BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, folder_path)
);

CREATE INDEX idx_drive_folders_user_id ON public.drive_folders(user_id);

CREATE TABLE public.drive_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.drive_folders(id) ON DELETE SET NULL,
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  doc_source TEXT NOT NULL DEFAULT 'upload' CHECK (doc_source IN ('upload', 'attached_link')),
  drive_file_id TEXT,
  drive_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  module_name TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  category TEXT NOT NULL DEFAULT 'Dokumentasi',
  access_level TEXT NOT NULL DEFAULT 'Privat (Hanya Pemilik)',
  sync_status TEXT NOT NULL DEFAULT 'Synced',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drive_documents_user_folder ON public.drive_documents(user_id, folder_id);
CREATE INDEX idx_drive_documents_title_trgm ON public.drive_documents USING gin (title gin_trgm_ops);

CREATE TABLE public.drive_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.drive_connections(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('AUTO-FOLDER', 'MANUAL-FOLDER', 'UPLOADED', 'LINK-ATTACHED', 'ROOT-LINKED', 'ERROR')),
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drive_sync_logs_user_created ON public.drive_sync_logs(user_id, created_at DESC);

-- 3. GENERAL EXTERNAL INTEGRATIONS, NOTIFICATIONS & BACKUPS
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  encrypted_tokens_ref TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_connections_user_id ON public.integration_connections(user_id);

CREATE TABLE public.external_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  sync_direction TEXT NOT NULL DEFAULT 'one_way' CHECK (sync_direction IN ('one_way', 'two_way')),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, external_event_id)
);

CREATE INDEX idx_ext_event_map_event_id ON public.external_event_mappings(event_id);

CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_user_id ON public.sync_logs(user_id, synced_at DESC);

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'browser', 'email')),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, channel)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  source_module TEXT,
  status TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Archived')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status, scheduled_at DESC);

CREATE TABLE public.backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('scheduled', 'manual_json', 'manual_csv')),
  storage_path TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backup_records_user_id ON public.backup_records(user_id, created_at DESC);
