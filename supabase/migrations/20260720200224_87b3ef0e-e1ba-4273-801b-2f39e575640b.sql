
-- 1) Update activate_membership_on_signup to also set profile_id link
CREATE OR REPLACE FUNCTION public.activate_membership_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile uuid;
BEGIN
  SELECT id INTO v_profile FROM public.profiles WHERE auth_user_id = NEW.id LIMIT 1;
  UPDATE public.organization_memberships m
     SET status = CASE
                    WHEN o.status = 'approved' THEN 'active'::membership_status
                    ELSE m.status
                  END,
         activated_at = CASE
                          WHEN o.status = 'approved' AND m.activated_at IS NULL THEN now()
                          ELSE m.activated_at
                        END,
         profile_id = COALESCE(m.profile_id, v_profile),
         updated_at = now()
    FROM public.organizations o
   WHERE o.id = m.organization_id
     AND lower(m.user_email) = lower(NEW.email)
     AND m.status IN ('invited','suspended') IS DISTINCT FROM TRUE  -- keep suspended/revoked as-is
     AND m.status = 'invited';
  RETURN NEW;
END;
$$;

-- 2) RPC: reconcile membership for the currently authenticated user.
-- SECURITY DEFINER, but strictly matches on the caller's confirmed email/uid.
CREATE OR REPLACE FUNCTION public.accept_institutional_invite()
RETURNS TABLE(activated_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_profile uuid;
  v_count int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  -- Email from JWT claims (confirmed email that Supabase issued in the token)
  v_email := lower(coalesce(nullif(auth.jwt() ->> 'email',''), ''));
  IF v_email = '' THEN
    RETURN QUERY SELECT 0;
    RETURN;
  END IF;

  SELECT id INTO v_profile FROM public.profiles WHERE auth_user_id = v_uid LIMIT 1;

  -- Activate any invited membership for this email whose org is approved.
  WITH upd AS (
    UPDATE public.organization_memberships m
       SET status = 'active'::membership_status,
           activated_at = COALESCE(m.activated_at, now()),
           profile_id = COALESCE(m.profile_id, v_profile),
           updated_at = now()
      FROM public.organizations o
     WHERE o.id = m.organization_id
       AND o.status = 'approved'
       AND lower(m.user_email) = v_email
       AND m.status = 'invited'
     RETURNING m.id
  )
  SELECT count(*)::int INTO v_count FROM upd;

  -- Also backfill profile_id on already-active memberships (idempotent).
  UPDATE public.organization_memberships m
     SET profile_id = v_profile, updated_at = now()
   WHERE lower(m.user_email) = v_email
     AND m.profile_id IS NULL
     AND v_profile IS NOT NULL;

  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_institutional_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_institutional_invite() TO authenticated;

-- 3) Trigger: when an organization is approved, auto-activate memberships
-- whose users already exist (have a profile linked to auth.users).
CREATE OR REPLACE FUNCTION public.activate_memberships_on_org_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.organization_memberships m
       SET status = 'active'::membership_status,
           activated_at = COALESCE(m.activated_at, now()),
           profile_id = COALESCE(m.profile_id, p.id),
           updated_at = now()
      FROM public.profiles p
     WHERE m.organization_id = NEW.id
       AND m.status = 'invited'
       AND lower(p.email) = lower(m.user_email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_approval_activate ON public.organizations;
CREATE TRIGGER trg_org_approval_activate
AFTER UPDATE OF status ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.activate_memberships_on_org_approval();

-- 4) Repair: reconcile existing invited memberships whose users already confirmed email.
UPDATE public.organization_memberships m
   SET status = 'active'::membership_status,
       activated_at = COALESCE(m.activated_at, now()),
       profile_id = COALESCE(m.profile_id, p.id),
       updated_at = now()
  FROM public.profiles p, public.organizations o
 WHERE o.id = m.organization_id
   AND o.status = 'approved'
   AND lower(p.email) = lower(m.user_email)
   AND m.status = 'invited';
