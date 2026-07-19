-- Activate invited membership when a user signs up with a matching email
CREATE OR REPLACE FUNCTION public.activate_membership_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organization_memberships
     SET status = 'active', activated_at = now(), updated_at = now()
   WHERE lower(user_email) = lower(NEW.email)
     AND status = 'invited';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_activate_membership ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_membership
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.activate_membership_on_signup();

-- Master role checker (master_admin OR administrator)
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('master_admin','administrator')
  )
$$;

-- Demo bootstrap: authenticated user can claim master_admin role with the internal code
CREATE OR REPLACE FUNCTION public.claim_master_admin(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  IF _code IS NULL OR upper(trim(_code)) <> 'BASUF-MASTER' THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role)
  VALUES (_uid, 'master_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_master_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated;