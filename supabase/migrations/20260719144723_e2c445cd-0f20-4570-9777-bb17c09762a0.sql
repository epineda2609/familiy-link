
-- Phase 10 QA hardening: restrict EXECUTE on privileged SECURITY DEFINER functions.
-- Keep has_role/is_admin/is_staff/is_master accessible to authenticated (needed by RLS via server-side calls),
-- and revoke everything else from anon/authenticated.

REVOKE ALL ON FUNCTION public.purge_demo_data() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_person_matches(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_master_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_master_admin(text) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated;

-- Internal trigger helpers should never be callable via the Data API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_membership_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_person_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.timeline_on_person_create() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.timeline_on_report() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
