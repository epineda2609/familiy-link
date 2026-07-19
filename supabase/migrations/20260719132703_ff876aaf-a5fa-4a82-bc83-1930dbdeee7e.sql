
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.app_role AS ENUM ('master_admin','administrator','reviewer','viewer');
CREATE TYPE public.org_status AS ENUM ('pending','approved','rejected','suspended','archived','reference');
CREATE TYPE public.institution_type AS ENUM ('un_agency','red_cross','civil_protection','fire','usar','hospital','forensic','shelter','humanitarian','child_protection','migration','government','other');
CREATE TYPE public.disaster_type AS ENUM ('earthquake','war','flood','tsunami','hurricane','storm','landslide','wildfire','volcano','humanitarian','accident','other');
CREATE TYPE public.disaster_status AS ENUM ('draft','active','monitoring','closed','archived');
CREATE TYPE public.person_status AS ENUM ('reported','missing','searching','possible_match','information_received','located','identified','contacted','found','reunited','deceased','case_closed','archived');
CREATE TYPE public.report_status AS ENUM ('received','pending_review','under_verification','verified','rejected','incorporated','archived');
CREATE TYPE public.match_status AS ENUM ('suggested','pending_review','confirmed','rejected','merged');
CREATE TYPE public.verification_decision AS ENUM ('approved','rejected','needs_more_info','escalated');
CREATE TYPE public.visibility_level AS ENUM ('public','institutional','restricted','internal');
CREATE TYPE public.membership_status AS ENUM ('invited','active','suspended','revoked');
CREATE TYPE public.membership_role AS ENUM ('reviewer','viewer');

-- =====================
-- Shared updated_at trigger
-- =====================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  organization_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- USER ROLES (separate table, per RLS best practices)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('master_admin','administrator','reviewer'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('master_admin','administrator'))
$$;

CREATE POLICY "users read own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "master admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'master_admin'))
  WITH CHECK (public.has_role(auth.uid(),'master_admin'));

-- Profiles policies (after has_role exists)
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- ORGANIZATIONS
-- =====================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  normalized_name TEXT NOT NULL,
  organization_type institution_type NOT NULL DEFAULT 'other',
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  address TEXT,
  official_email TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  registration_code TEXT,
  description TEXT,
  verification_notes TEXT,
  status org_status NOT NULL DEFAULT 'pending',
  is_reference BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  public_visibility BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_country ON public.organizations(country);
CREATE INDEX idx_organizations_norm ON public.organizations(normalized_name);
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "public read approved orgs" ON public.organizations FOR SELECT TO anon
  USING (status = 'approved' AND public_visibility = true);
CREATE POLICY "auth read orgs" ON public.organizations FOR SELECT TO authenticated
  USING (status = 'approved' OR public.is_staff(auth.uid()));
CREATE POLICY "admins insert orgs" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins update orgs" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "admins delete orgs" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'master_admin'));

-- FK for profiles.organization_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =====================
-- ORGANIZATION MEMBERSHIPS
-- =====================
CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  institutional_role membership_role NOT NULL DEFAULT 'viewer',
  status membership_status NOT NULL DEFAULT 'invited',
  invite_token TEXT UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mem_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_mem_email ON public.organization_memberships(user_email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_memberships TO authenticated;
GRANT ALL ON public.organization_memberships TO service_role;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_mem_updated BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "admins manage memberships" ON public.organization_memberships FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "user reads own membership" ON public.organization_memberships FOR SELECT TO authenticated
  USING (user_email = (SELECT email FROM public.profiles WHERE auth_user_id = auth.uid()));

-- =====================
-- DISASTER EVENTS
-- =====================
CREATE TABLE public.disaster_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT UNIQUE NOT NULL DEFAULT ('E-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  name TEXT NOT NULL,
  event_type disaster_type NOT NULL,
  custom_type TEXT,
  description TEXT,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  severity TEXT,
  status disaster_status NOT NULL DEFAULT 'active',
  magnitude TEXT,
  affected_estimate INTEGER,
  fatalities INTEGER,
  missing_count INTEGER,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_by_org UUID REFERENCES public.organizations(id),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_country ON public.disaster_events(country);
CREATE INDEX idx_events_status ON public.disaster_events(status);
CREATE INDEX idx_events_start ON public.disaster_events(start_date DESC);
GRANT SELECT ON public.disaster_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disaster_events TO authenticated;
GRANT ALL ON public.disaster_events TO service_role;
ALTER TABLE public.disaster_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.disaster_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "public read events" ON public.disaster_events FOR SELECT TO anon
  USING (status IN ('active','monitoring','closed'));
CREATE POLICY "auth read events" ON public.disaster_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert events" ON public.disaster_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins update events" ON public.disaster_events FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================
-- PERSONS (public case) + related tables
-- =====================
CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_case_code TEXT UNIQUE NOT NULL DEFAULT ('C-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  event_id UUID REFERENCES public.disaster_events(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  preferred_name TEXT,
  document_type TEXT,
  document_number TEXT,
  nationality TEXT,
  country TEXT NOT NULL,
  country_of_residence TEXT,
  date_of_birth DATE,
  approximate_age INTEGER,
  sex TEXT,
  gender TEXT CHECK (gender IN ('f','m','o')),
  blood_type TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  eye_color TEXT,
  hair_color TEXT,
  distinguishing_features TEXT,
  medical_conditions TEXT,
  disabilities TEXT,
  medications TEXT,
  languages TEXT,
  occupation TEXT,
  photo_url TEXT,
  current_status person_status NOT NULL DEFAULT 'missing',
  privacy_level visibility_level NOT NULL DEFAULT 'public',
  reported_by_user_id UUID REFERENCES auth.users(id),
  reported_by_organization_id UUID REFERENCES public.organizations(id),
  reporter_name TEXT,
  reporter_contact TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_persons_event ON public.persons(event_id);
CREATE INDEX idx_persons_status ON public.persons(current_status);
CREATE INDEX idx_persons_country ON public.persons(country);
CREATE INDEX idx_persons_name_trgm ON public.persons USING gin (display_name gin_trgm_ops);
CREATE INDEX idx_persons_doc ON public.persons(document_number);
GRANT SELECT ON public.persons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO authenticated;
GRANT ALL ON public.persons TO service_role;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_persons_updated BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "public read persons" ON public.persons FOR SELECT TO anon
  USING (privacy_level = 'public' AND archived_at IS NULL);
CREATE POLICY "auth read persons" ON public.persons FOR SELECT TO authenticated
  USING (
    privacy_level IN ('public','institutional')
    OR reported_by_user_id = auth.uid()
    OR public.is_staff(auth.uid())
  );
CREATE POLICY "anyone insert persons" ON public.persons FOR INSERT TO anon
  WITH CHECK (privacy_level = 'public');
CREATE POLICY "auth insert persons" ON public.persons FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "staff or owner update" ON public.persons FOR UPDATE TO authenticated
  USING (reported_by_user_id = auth.uid() OR public.is_staff(auth.uid()));

-- DISAPPEARANCE DETAILS
CREATE TABLE public.disappearance_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID UNIQUE NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  last_seen_date DATE,
  last_seen_time TIME,
  last_seen_location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  circumstances TEXT,
  clothing_description TEXT,
  accompanied_by TEXT,
  intended_destination TEXT,
  transport_method TEXT,
  source_reliability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disappearance_details TO authenticated;
GRANT ALL ON public.disappearance_details TO service_role;
GRANT SELECT ON public.disappearance_details TO anon;
ALTER TABLE public.disappearance_details ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_dd_updated BEFORE UPDATE ON public.disappearance_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "read dd via person" ON public.disappearance_details FOR SELECT USING (true);
CREATE POLICY "insert dd auth" ON public.disappearance_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert dd anon" ON public.disappearance_details FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update dd staff" ON public.disappearance_details FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- PERSON CONTACTS
CREATE TABLE public.person_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  phone TEXT,
  alternate_phone TEXT,
  preferred_contact_method TEXT,
  address TEXT,
  country TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  consent_to_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_person ON public.person_contacts(person_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_contacts TO authenticated;
GRANT ALL ON public.person_contacts TO service_role;
ALTER TABLE public.person_contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.person_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "staff read contacts" ON public.person_contacts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "auth insert contacts" ON public.person_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon insert contacts" ON public.person_contacts FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON public.person_contacts TO anon;
CREATE POLICY "staff update contacts" ON public.person_contacts FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ADDITIONAL INFORMATION REPORTS
CREATE TABLE public.additional_information_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.disaster_events(id),
  submitted_by_user_id UUID REFERENCES auth.users(id),
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  submitted_by_phone TEXT,
  information_type TEXT,
  description TEXT NOT NULL,
  sighting_date TIMESTAMPTZ,
  sighting_location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  source_type TEXT,
  anonymity_requested BOOLEAN NOT NULL DEFAULT false,
  status report_status NOT NULL DEFAULT 'received',
  assigned_organization_id UUID REFERENCES public.organizations(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_person ON public.additional_information_reports(person_id);
CREATE INDEX idx_reports_status ON public.additional_information_reports(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_information_reports TO authenticated;
GRANT INSERT ON public.additional_information_reports TO anon;
GRANT ALL ON public.additional_information_reports TO service_role;
ALTER TABLE public.additional_information_reports ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.additional_information_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "public insert reports" ON public.additional_information_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth insert reports" ON public.additional_information_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff read reports" ON public.additional_information_reports FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR submitted_by_user_id = auth.uid());
CREATE POLICY "staff update reports" ON public.additional_information_reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- PERSON STATUS HISTORY
CREATE TABLE public.person_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  previous_status person_status,
  new_status person_status NOT NULL,
  reason TEXT,
  notes TEXT,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_by_organization_id UUID REFERENCES public.organizations(id),
  source_report_id UUID REFERENCES public.additional_information_reports(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_person ON public.person_status_history(person_id, created_at DESC);
GRANT SELECT, INSERT ON public.person_status_history TO authenticated;
GRANT SELECT ON public.person_status_history TO anon;
GRANT ALL ON public.person_status_history TO service_role;
ALTER TABLE public.person_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read history public" ON public.person_status_history FOR SELECT USING (true);
CREATE POLICY "staff insert history" ON public.person_status_history FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_person_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.person_status_history(person_id, previous_status, new_status, changed_by_user_id)
      VALUES (NEW.id, NULL, NEW.current_status, NEW.reported_by_user_id);
  ELSIF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
    INSERT INTO public.person_status_history(person_id, previous_status, new_status, changed_by_user_id)
      VALUES (NEW.id, OLD.current_status, NEW.current_status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_persons_status_history AFTER INSERT OR UPDATE OF current_status ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.log_person_status_change();

-- CASE TIMELINE
CREATE TABLE public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  source_entity_type TEXT,
  source_entity_id UUID,
  created_by UUID REFERENCES auth.users(id),
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_timeline_person ON public.case_timeline(person_id, event_date DESC);
GRANT SELECT, INSERT ON public.case_timeline TO authenticated;
GRANT SELECT ON public.case_timeline TO anon;
GRANT ALL ON public.case_timeline TO service_role;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read timeline" ON public.case_timeline FOR SELECT TO anon
  USING (visibility = 'public');
CREATE POLICY "auth read timeline" ON public.case_timeline FOR SELECT TO authenticated
  USING (visibility IN ('public','institutional') OR public.is_staff(auth.uid()));
CREATE POLICY "auth insert timeline" ON public.case_timeline FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: create timeline entry on person creation
CREATE OR REPLACE FUNCTION public.timeline_on_person_create()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.case_timeline(person_id, event_type, title, description, visibility, source_entity_type, source_entity_id)
    VALUES (NEW.id, 'case.created', 'Caso registrado', 'Registro inicial del caso', 'public', 'person', NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_timeline_person_insert AFTER INSERT ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.timeline_on_person_create();

-- Trigger: create timeline entry on report
CREATE OR REPLACE FUNCTION public.timeline_on_report()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.case_timeline(person_id, event_type, title, description, visibility, source_entity_type, source_entity_id)
    VALUES (NEW.person_id, 'report.received', 'Información adicional recibida',
      COALESCE(NEW.description, ''), 'institutional', 'report', NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_timeline_report AFTER INSERT ON public.additional_information_reports
  FOR EACH ROW EXECUTE FUNCTION public.timeline_on_report();

-- POTENTIAL MATCHES
CREATE TABLE public.potential_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  matched_person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  source_report_id UUID REFERENCES public.additional_information_reports(id),
  match_score NUMERIC NOT NULL DEFAULT 0,
  matching_fields JSONB,
  explanation TEXT,
  status match_status NOT NULL DEFAULT 'suggested',
  generated_by TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_source ON public.potential_matches(source_person_id);
CREATE INDEX idx_matches_status ON public.potential_matches(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.potential_matches TO authenticated;
GRANT ALL ON public.potential_matches TO service_role;
ALTER TABLE public.potential_matches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_matches_updated BEFORE UPDATE ON public.potential_matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "staff manage matches" ON public.potential_matches FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- VERIFICATION REVIEWS
CREATE TABLE public.verification_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.additional_information_reports(id),
  match_id UUID REFERENCES public.potential_matches(id),
  organization_id UUID REFERENCES public.organizations(id),
  reviewer_user_id UUID REFERENCES auth.users(id),
  decision verification_decision NOT NULL,
  notes TEXT,
  verification_level TEXT,
  supporting_evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verification_reviews TO authenticated;
GRANT ALL ON public.verification_reviews TO service_role;
ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.verification_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "staff manage reviews" ON public.verification_reviews FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ATTACHMENTS
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,
  storage_path TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  visibility visibility_level NOT NULL DEFAULT 'institutional',
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_att_entity ON public.attachments(entity_type, entity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT SELECT ON public.attachments TO anon;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read attachments" ON public.attachments FOR SELECT TO anon
  USING (visibility = 'public');
CREATE POLICY "auth read attachments" ON public.attachments FOR SELECT TO authenticated
  USING (visibility IN ('public','institutional') OR uploaded_by = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "auth insert attachments" ON public.attachments FOR INSERT TO authenticated WITH CHECK (true);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, is_read);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  actor_name TEXT,
  actor_org TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  target_label TEXT,
  previous_data JSONB,
  new_data JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO anon;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "anyone insert audit" ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- SEARCH LOGS
CREATE TABLE public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  search_type TEXT,
  search_parameters JSONB,
  result_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.search_logs TO anon, authenticated;
GRANT SELECT ON public.search_logs TO authenticated;
GRANT ALL ON public.search_logs TO service_role;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read search logs" ON public.search_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "anyone insert search log" ON public.search_logs FOR INSERT WITH CHECK (true);

-- SAFE IDS
CREATE TABLE public.safe_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  audience visibility_level NOT NULL DEFAULT 'public',
  data JSONB,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.safe_ids TO anon;
GRANT SELECT, INSERT, UPDATE ON public.safe_ids TO authenticated;
GRANT ALL ON public.safe_ids TO service_role;
ALTER TABLE public.safe_ids ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_safeid_updated BEFORE UPDATE ON public.safe_ids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "public read safe_ids" ON public.safe_ids FOR SELECT USING (audience = 'public' OR public.is_staff(auth.uid()));
CREATE POLICY "auth insert safe_ids" ON public.safe_ids FOR INSERT TO authenticated WITH CHECK (true);

-- RESCUE INTAKES
CREATE TABLE public.rescue_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.disaster_events(id),
  intake_location TEXT,
  intake_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rescuer_name TEXT,
  rescuer_organization TEXT,
  notes TEXT,
  chain_events JSONB,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rescue_intakes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.rescue_intakes TO authenticated;
GRANT ALL ON public.rescue_intakes TO service_role;
ALTER TABLE public.rescue_intakes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rescue_updated BEFORE UPDATE ON public.rescue_intakes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "read rescue" ON public.rescue_intakes FOR SELECT USING (true);
CREATE POLICY "auth insert rescue" ON public.rescue_intakes FOR INSERT TO authenticated WITH CHECK (true);

-- =====================
-- Basic match-computation RPC
-- =====================
CREATE OR REPLACE FUNCTION public.compute_person_matches(_person_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted_count INTEGER := 0;
  src RECORD;
BEGIN
  SELECT * INTO src FROM public.persons WHERE id = _person_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  INSERT INTO public.potential_matches(source_person_id, matched_person_id, match_score, matching_fields, explanation, status, generated_by)
  SELECT
    src.id,
    p.id,
    (
      CASE WHEN src.document_number IS NOT NULL AND p.document_number = src.document_number THEN 60 ELSE 0 END
      + CASE WHEN similarity(coalesce(src.display_name,''), coalesce(p.display_name,'')) > 0.4 THEN (similarity(src.display_name, p.display_name)*30)::int ELSE 0 END
      + CASE WHEN src.event_id = p.event_id THEN 10 ELSE 0 END
      + CASE WHEN src.gender = p.gender THEN 5 ELSE 0 END
      + CASE WHEN abs(coalesce(src.approximate_age,0) - coalesce(p.approximate_age,0)) <= 3 THEN 5 ELSE 0 END
    )::numeric,
    jsonb_build_object(
      'name_similarity', similarity(coalesce(src.display_name,''), coalesce(p.display_name,'')),
      'same_event', src.event_id = p.event_id,
      'same_gender', src.gender = p.gender,
      'doc_match', src.document_number IS NOT NULL AND p.document_number = src.document_number
    ),
    'Coincidencia sugerida por reglas básicas (nombre, evento, documento, edad).',
    'suggested',
    'rule_engine_v1'
  FROM public.persons p
  WHERE p.id <> src.id
    AND p.archived_at IS NULL
    AND (
      (src.document_number IS NOT NULL AND p.document_number = src.document_number)
      OR similarity(coalesce(src.display_name,''), coalesce(p.display_name,'')) > 0.4
    )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END; $$;

-- =====================
-- SEED: reference organizations (50)
-- =====================
INSERT INTO public.organizations (name, short_name, normalized_name, organization_type, country, status, is_reference, is_demo, public_visibility) VALUES
('Alto Comisionado de las Naciones Unidas para los Refugiados','ACNUR','acnur','un_agency','Global','approved',true,true,true),
('Fondo de las Naciones Unidas para la Infancia','UNICEF','unicef','un_agency','Global','approved',true,true,true),
('Organización Internacional para las Migraciones','OIM','oim','migration','Global','approved',true,true,true),
('Comité Internacional de la Cruz Roja','CICR','cicr','red_cross','Global','approved',true,true,true),
('Federación Internacional de la Cruz Roja','IFRC','ifrc','red_cross','Global','approved',true,true,true),
('Cruz Roja Mexicana','CRM','cruz_roja_mexicana','red_cross','MX','approved',true,true,true),
('Cruz Roja Colombiana','CRC','cruz_roja_colombiana','red_cross','CO','approved',true,true,true),
('Cruz Roja Chilena','CRCh','cruz_roja_chilena','red_cross','CL','approved',true,true,true),
('Cruz Roja Argentina','CRA','cruz_roja_argentina','red_cross','AR','approved',true,true,true),
('Cruz Roja Venezolana','CRV','cruz_roja_venezolana','red_cross','VE','approved',true,true,true),
('Protección Civil Venezuela','PC-VE','pc_venezuela','civil_protection','VE','pending',true,true,true),
('Protección Civil México','PC-MX','pc_mexico','civil_protection','MX','pending',true,true,true),
('Defensa Civil Colombia','DC-CO','dc_colombia','civil_protection','CO','pending',true,true,true),
('Onemi Chile','ONEMI','onemi','civil_protection','CL','reference',true,true,true),
('Defensa Civil Argentina','DC-AR','dc_argentina','civil_protection','AR','reference',true,true,true),
('Defensa Civil Perú','INDECI','indeci','civil_protection','PE','reference',true,true,true),
('Bomberos Voluntarios Argentina','BVA','bva','fire','AR','reference',true,true,true),
('Bomberos de Chile','BCh','bomberos_chile','fire','CL','reference',true,true,true),
('USAR México','USAR-MX','usar_mexico','usar','MX','reference',true,true,true),
('USAR Colombia','USAR-CO','usar_colombia','usar','CO','reference',true,true,true),
('Topos México','Topos','topos','usar','MX','reference',true,true,true),
('OFDA/USAID Latinoamérica','OFDA','ofda','humanitarian','Global','reference',true,true,true),
('Médicos Sin Fronteras','MSF','msf','humanitarian','Global','reference',true,true,true),
('Save the Children LATAM','StC','save_the_children','child_protection','Global','reference',true,true,true),
('Aldeas Infantiles SOS','SOS','aldeas_sos','child_protection','Global','reference',true,true,true),
('Plan International','Plan','plan_international','child_protection','Global','reference',true,true,true),
('World Vision LATAM','WV','world_vision','humanitarian','Global','reference',true,true,true),
('CARE Internacional','CARE','care','humanitarian','Global','reference',true,true,true),
('Oxfam LATAM','Oxfam','oxfam','humanitarian','Global','reference',true,true,true),
('Handicap International','HI','handicap_international','humanitarian','Global','reference',true,true,true),
('IsraAID','IsraAID','israaid','humanitarian','Global','reference',true,true,true),
('Servicio Jesuita a Refugiados','JRS','jrs','humanitarian','Global','reference',true,true,true),
('Cáritas Internacional','Cáritas','caritas','humanitarian','Global','reference',true,true,true),
('Hospital Universitario de Caracas','HUC','huc','hospital','VE','reference',true,true,true),
('Hospital General de México','HGM','hgm','hospital','MX','reference',true,true,true),
('Hospital San Juan de Dios (Chile)','HSJD','hsjd_cl','hospital','CL','reference',true,true,true),
('Instituto Nacional de Medicina Legal (Colombia)','INML','inml','forensic','CO','reference',true,true,true),
('SEMEFO México','SEMEFO','semefo','forensic','MX','reference',true,true,true),
('Servicio Médico Legal (Chile)','SML','sml','forensic','CL','reference',true,true,true),
('Refugio Humanitario Cúcuta','RHC','rhc','shelter','CO','reference',true,true,true),
('Refugio Fronterizo Táchira','RFT','rft','shelter','VE','suspended',true,true,true),
('SENAMI Ecuador','SENAMI','senami','migration','EC','reference',true,true,true),
('INM México','INM','inm','migration','MX','reference',true,true,true),
('Migración Colombia','MC','migracion_colombia','migration','CO','reference',true,true,true),
('SAIME Venezuela','SAIME','saime','migration','VE','reference',true,true,true),
('DINCOTE Perú','DINCOTE','dincote','government','PE','reference',true,true,true),
('Policía Nacional Colombia','PN-CO','pn_colombia','government','CO','reference',true,true,true),
('Ministerio del Interior Chile','MININT-CL','minint_cl','government','CL','reference',true,true,true),
('CNDH México','CNDH','cndh','government','MX','reference',true,true,true),
('Defensor del Pueblo Venezuela','DPV','dpv','government','VE','reference',true,true,true);

-- Seed disaster events from existing mock data
INSERT INTO public.disaster_events (name, event_type, country, region, start_date, status, magnitude, affected_estimate, fatalities, missing_count, is_demo, description) VALUES
('Sismo en Yaracuy','earthquake','VE','Yaracuy','2026-06-24','active','7.2/7.5',17907,4829,68000,true,'Doblete sísmico devastador en Yaracuy'),
('Inundaciones Río Grande do Sul','flood','BR','Rio Grande do Sul','2025-05-01','active',NULL,150000,120,45,true,NULL),
('Sismo Valparaíso','earthquake','CL','Valparaíso','2025-03-18','monitoring','6.8',85000,32,18,true,NULL),
('Sismo Acapulco','earthquake','MX','Guerrero','2024-11-03','closed','7.0',45000,150,25,true,NULL),
('Inundaciones Valle del Cauca','flood','CO','Valle del Cauca','2024-10-15','closed',NULL,32000,45,12,true,NULL),
('Crisis humanitaria frontera VE','humanitarian','VE','Zona fronteriza','2025-02-01','active',NULL,250000,NULL,NULL,true,NULL);
