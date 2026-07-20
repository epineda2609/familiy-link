
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.basuf_id_from_uuid(_country text, _id uuid, _attempt int DEFAULT 0)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT 'BASUF-' || upper(coalesce(nullif(_country,''), 'XX')) || '-' ||
    upper(substr(translate(md5(_id::text || '::' || _attempt::text), '01lo', 'ABKQ'), 1, 4));
$$;

DO $$
DECLARE
  r RECORD;
  candidate text;
  attempt int;
BEGIN
  FOR r IN SELECT id, country, public_case_code FROM public.persons
           WHERE public_case_code IS NULL OR public_case_code NOT LIKE 'BASUF-%'
  LOOP
    attempt := 0;
    LOOP
      candidate := public.basuf_id_from_uuid(r.country, r.id, attempt);
      IF NOT EXISTS (SELECT 1 FROM public.persons WHERE public_case_code = candidate) THEN
        UPDATE public.persons SET public_case_code = candidate WHERE id = r.id;
        EXIT;
      END IF;
      attempt := attempt + 1;
      IF attempt > 30 THEN EXIT; END IF;
    END LOOP;
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.assign_basuf_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempt int := 0;
BEGIN
  IF NEW.public_case_code IS NOT NULL AND NEW.public_case_code LIKE 'BASUF-%' THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := public.basuf_id_from_uuid(NEW.country, NEW.id, attempt);
    IF NOT EXISTS (SELECT 1 FROM public.persons WHERE public_case_code = candidate) THEN
      NEW.public_case_code := candidate;
      RETURN NEW;
    END IF;
    attempt := attempt + 1;
    IF attempt > 30 THEN
      NEW.public_case_code := candidate;
      RETURN NEW;
    END IF;
  END LOOP;
END$$;

DROP TRIGGER IF EXISTS trg_persons_assign_basuf_id ON public.persons;
CREATE TRIGGER trg_persons_assign_basuf_id
  BEFORE INSERT ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.assign_basuf_id();

CREATE UNIQUE INDEX IF NOT EXISTS persons_public_case_code_unique
  ON public.persons (public_case_code);
