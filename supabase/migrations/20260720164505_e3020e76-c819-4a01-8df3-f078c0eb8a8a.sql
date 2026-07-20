
-- 1. Remove self-service master admin escalation
DROP FUNCTION IF EXISTS public.claim_master_admin(text);

-- 2. Revoke EXECUTE from anon/authenticated on trigger + admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_person_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.timeline_on_person_create() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.timeline_on_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_membership_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_person_matches(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_demo_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_case_counters() FROM PUBLIC, anon;

-- RLS helper functions: revoke from anon (RLS is evaluated under caller role; helpers only needed for authenticated policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;

-- 3. additional_information_reports: remove anonymous insert
DROP POLICY IF EXISTS "public insert reports" ON public.additional_information_reports;

-- 4. audit_logs: remove anon insert; scope authenticated inserts to own user_id
DROP POLICY IF EXISTS "anyone insert audit" ON public.audit_logs;
DROP POLICY IF EXISTS "auth insert audit" ON public.audit_logs;
CREATE POLICY "auth insert own audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. disappearance_details: remove public read + anon insert; only staff or the person's reporter can read
DROP POLICY IF EXISTS "read dd via person" ON public.disappearance_details;
DROP POLICY IF EXISTS "insert dd anon" ON public.disappearance_details;
CREATE POLICY "read dd staff or reporter" ON public.disappearance_details
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = disappearance_details.person_id
        AND p.reported_by_user_id = auth.uid()
    )
  );

-- 6. organization_memberships: remove anon read (was leaking user_email PII)
DROP POLICY IF EXISTS "public read active memberships for demo login" ON public.organization_memberships;

-- 7. person_status_history: restrict to staff and the person's reporter
DROP POLICY IF EXISTS "read history public" ON public.person_status_history;
CREATE POLICY "staff or reporter read history" ON public.person_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = person_status_history.person_id
        AND p.reported_by_user_id = auth.uid()
    )
  );

-- 8. rescue_intakes: remove blanket public read; require authentication
DROP POLICY IF EXISTS "read rescue" ON public.rescue_intakes;
CREATE POLICY "auth read rescue" ON public.rescue_intakes
  FOR SELECT TO authenticated
  USING (true);

-- 9. safe_ids: remove blanket public read; require authentication
DROP POLICY IF EXISTS "public read safe_ids" ON public.safe_ids;
CREATE POLICY "auth read safe_ids" ON public.safe_ids
  FOR SELECT TO authenticated
  USING (
    audience = 'public'::visibility_level
    OR public.is_staff(auth.uid())
  );
