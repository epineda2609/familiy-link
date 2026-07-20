-- Restore public report creation without exposing reporter contact data.

-- The original INSERT policies existed, but anon lacked the corresponding
-- table privileges. Grant only the columns used by the public report form.
GRANT INSERT (
  id,
  event_id,
  display_name,
  approximate_age,
  gender,
  country,
  nationality,
  document_number,
  distinguishing_features,
  current_status,
  privacy_level,
  reporter_name,
  reporter_contact,
  reported_at
) ON public.persons TO anon;

GRANT INSERT (
  person_id,
  last_seen_date,
  last_seen_location
) ON public.disappearance_details TO anon;

-- Limit anonymous contact writes to the fields produced by the report form.
REVOKE INSERT ON public.person_contacts FROM anon;
GRANT INSERT (
  person_id,
  full_name,
  relationship,
  email,
  phone,
  preferred_contact_method,
  country,
  is_primary,
  consent_to_contact
) ON public.person_contacts TO anon;

-- These trigger functions write status/timeline rows after a person is
-- created. Execute them as their owner so an otherwise valid anonymous insert
-- is not rejected by the auxiliary tables' RLS policies.
ALTER FUNCTION public.log_person_status_change() SECURITY DEFINER;
ALTER FUNCTION public.log_person_status_change() SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.log_person_status_change() FROM PUBLIC;

ALTER FUNCTION public.timeline_on_person_create() SECURITY DEFINER;
ALTER FUNCTION public.timeline_on_person_create() SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.timeline_on_person_create() FROM PUBLIC;

-- Preserve institutional reads while preventing anonymous clients from
-- selecting reporter_name or reporter_contact directly from persons.
REVOKE SELECT ON public.persons FROM anon;
GRANT SELECT (
  id,
  public_case_code,
  event_id,
  display_name,
  approximate_age,
  gender,
  country,
  nationality,
  document_number,
  distinguishing_features,
  photo_url,
  current_status,
  privacy_level,
  is_demo,
  archived_at,
  reported_at,
  created_at,
  updated_at
) ON public.persons TO anon;
