
-- Data API grants (missing) + public read for public timeline entries.
GRANT SELECT ON public.attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;

GRANT SELECT ON public.case_timeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_timeline TO authenticated;
GRANT ALL ON public.case_timeline TO service_role;

-- Anon read of public timeline events (mirrors attachments' anon policy).
DROP POLICY IF EXISTS "public read timeline" ON public.case_timeline;
CREATE POLICY "public read timeline" ON public.case_timeline
  FOR SELECT TO anon
  USING (visibility = 'public'::visibility_level);
