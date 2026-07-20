
-- Allow anonymous citizens to create reports.
-- Root cause: two AFTER INSERT triggers on public.persons invoke functions
-- that write into public.person_status_history and public.case_timeline.
-- Those child tables have no INSERT policy for the anon role, and the
-- trigger functions run as the caller (invoker rights), so anon inserts
-- into persons roll back with 42501 even though the persons INSERT policy
-- itself allows anon rows with privacy_level = 'public'.
--
-- Fix: run these two trigger functions with SECURITY DEFINER so the
-- history/timeline side-writes bypass caller-level RLS. This is safe:
-- the functions only insert derived rows for the row being created/updated,
-- never accept user-supplied ids, and reject unrelated writes.

CREATE OR REPLACE FUNCTION public.log_person_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.person_status_history(person_id, previous_status, new_status, changed_by_user_id)
      VALUES (NEW.id, NULL, NEW.current_status, NEW.reported_by_user_id);
  ELSIF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
    INSERT INTO public.person_status_history(person_id, previous_status, new_status, changed_by_user_id)
      VALUES (NEW.id, OLD.current_status, NEW.current_status, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.timeline_on_person_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.case_timeline(person_id, event_type, title, description, visibility, source_entity_type, source_entity_id)
    VALUES (
      NEW.id,
      'case.created',
      CASE WHEN NEW.reported_by_organization_id IS NULL THEN 'Reporte ciudadano recibido' ELSE 'Caso registrado' END,
      CASE WHEN NEW.reported_by_organization_id IS NULL THEN 'Registro inicial creado por un ciudadano.' ELSE 'Registro inicial del caso' END,
      'public',
      'person',
      NEW.id
    );
  RETURN NEW;
END;
$function$;
