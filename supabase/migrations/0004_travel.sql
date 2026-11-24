-- =============================================================================
-- 0004_travel.sql
-- Personal Life OS - Travel Management (Planned & Spontaneous in one schema)
-- =============================================================================

-- 1. TRIPS
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trip_type TEXT NOT NULL DEFAULT 'planned' CHECK (trip_type IN ('planned', 'spontaneous')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  city TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user_status ON public.trips(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_city_trgm ON public.trips USING gin (city gin_trgm_ops);
CREATE INDEX idx_trips_name_trgm ON public.trips USING gin (name gin_trgm_ops);

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Link Finance transactions.trip_id -> trips.id (Single Source of Truth for RAB realization)
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_trip
  FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- 2. PLACES (Reusable locations across multiple trips)
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gps', 'geocoder', 'map_pick')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_places_user_id ON public.places(user_id);
CREATE INDEX idx_places_name_trgm ON public.places USING gin (name gin_trgm_ops);

-- 3. TRIP DAYS
CREATE TABLE public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  trip_date DATE,
  notes TEXT,
  UNIQUE (trip_id, day_number)
);

CREATE INDEX idx_trip_days_user_id ON public.trip_days(user_id);

-- 4. TRIP STOPS (Planned vs Actual arrival/departure strictly separated)
CREATE TABLE public.trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  trip_day_id UUID REFERENCES public.trip_days(id) ON DELETE SET NULL,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  activity_type TEXT,
  transport_mode TEXT,
  planned_arrival_at TIMESTAMPTZ,
  planned_departure_at TIMESTAMPTZ,
  actual_arrival_at TIMESTAMPTZ,
  actual_departure_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_stops_trip_seq ON public.trip_stops(trip_id, sequence_order);
CREATE INDEX idx_trip_stops_user_id ON public.trip_stops(user_id);

CREATE TRIGGER trg_trip_stops_updated_at
  BEFORE UPDATE ON public.trip_stops
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 5. TRIP ROUTES (Cached distance & duration between stops)
CREATE TABLE public.trip_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_stop_id UUID NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
  to_stop_id UUID NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'driving',
  distance_m INTEGER CHECK (distance_m IS NULL OR distance_m >= 0),
  duration_s INTEGER CHECK (duration_s IS NULL OR duration_s >= 0),
  polyline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_routes_trip_id ON public.trip_routes(trip_id);
CREATE INDEX idx_trip_routes_user_id ON public.trip_routes(user_id);

-- 6. TRIP BUDGET ITEMS / RAB (Initial vs Revised preserved; Actual derived from Finance)
CREATE TABLE public.trip_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  initial_amount NUMERIC(18,2) NOT NULL CHECK (initial_amount >= 0),
  revised_amount NUMERIC(18,2) NOT NULL CHECK (revised_amount >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'IDR',
  revision_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, category)
);

CREATE INDEX idx_trip_budget_items_trip_id ON public.trip_budget_items(trip_id);
CREATE INDEX idx_trip_budget_items_user_id ON public.trip_budget_items(user_id);

CREATE TRIGGER trg_trip_budget_items_updated_at
  BEFORE UPDATE ON public.trip_budget_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 7. RESERVATIONS
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  reservation_type TEXT NOT NULL,
  booking_code TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'Terkonfirmasi',
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_trip_id ON public.reservations(trip_id);
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);

-- 8. TRIP PARTICIPANTS
CREATE TABLE public.trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user_id ON public.trip_participants(user_id);
