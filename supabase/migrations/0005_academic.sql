-- =============================================================================
-- 0005_academic.sql
-- Personal Life OS - Academic Management (Project-Based)
-- Includes weighted thesis sections, paper workflow, supervision -> calendar/task,
-- structured research logs, shared references, and document versioning
-- =============================================================================

-- 1. ACADEMIC PROJECT DETAILS
CREATE TABLE public.academic_project_details (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academic_type TEXT NOT NULL CHECK (academic_type IN ('Thesis', 'Paper', 'Research', 'Course')),
  institution TEXT,
  supervisor_summary TEXT,
  topic_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academic_details_user_id ON public.academic_project_details(user_id);

CREATE TRIGGER trg_academic_details_updated_at
  BEFORE UPDATE ON public.academic_project_details
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. THESIS SECTIONS (Transparent weighted progress)
CREATE TABLE public.thesis_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (weight > 0 AND weight <= 100),
  progress NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_thesis_sections_project ON public.thesis_sections(project_id, section_order);
CREATE INDEX idx_thesis_sections_user_id ON public.thesis_sections(user_id);

CREATE TRIGGER trg_thesis_sections_updated_at
  BEFORE UPDATE ON public.thesis_sections
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 3. PAPER DETAILS
CREATE TABLE public.paper_details (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abstract TEXT,
  journal_target TEXT,
  indexation_target TEXT,
  publication_status TEXT NOT NULL DEFAULT 'Idea'
    CHECK (publication_status IN (
      'Idea', 'Literature Review', 'Drafting', 'Internal Review',
      'Submitted', 'Under Review', 'Revision', 'Accepted', 'Rejected'
    )),
  submission_date DATE,
  editor_decision TEXT,
  correspondence_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paper_details_user_id ON public.paper_details(user_id);

CREATE TRIGGER trg_paper_details_updated_at
  BEFORE UPDATE ON public.paper_details
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 4. SUPERVISION LOGS (Single source link to events [TC-01] & converted task [TC-09])
CREATE TABLE public.supervision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  supervisor_name TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  agenda TEXT NOT NULL,
  discussion_summary TEXT,
  revision_point TEXT,
  revision_deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supervision_logs_project ON public.supervision_logs(project_id, meeting_date DESC);
CREATE INDEX idx_supervision_logs_user_id ON public.supervision_logs(user_id);

-- 5. RESEARCH LOGS (Structured lab & experiment observations)
CREATE TABLE public.research_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  experiment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sample_code TEXT NOT NULL,
  method TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_value TEXT,
  result_unit TEXT,
  conditions TEXT,
  findings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_logs_project ON public.research_logs(project_id, experiment_date DESC);
CREATE INDEX idx_research_logs_user_id ON public.research_logs(user_id);

-- 6. REFERENCES & PROJECT_REFERENCES (Many-to-many shared literature)
CREATE TABLE public.academic_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  publication_year SMALLINT,
  doi TEXT,
  url TEXT,
  venue TEXT,
  keywords TEXT[],
  pdf_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academic_references_user_id ON public.academic_references(user_id);
CREATE INDEX idx_academic_references_title_trgm ON public.academic_references USING gin (title gin_trgm_ops);

CREATE TABLE public.project_references (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reference_id UUID NOT NULL REFERENCES public.academic_references(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, reference_id)
);

CREATE INDEX idx_project_references_user_id ON public.project_references(user_id);

-- 7. DOCUMENT VERSIONS (Mandatory versioning for academic project drafts)
CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  version_number TEXT NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_versions_project ON public.document_versions(project_id, created_at DESC);
CREATE INDEX idx_document_versions_user_id ON public.document_versions(user_id);
