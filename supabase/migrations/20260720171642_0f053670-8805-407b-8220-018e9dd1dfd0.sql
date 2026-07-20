-- Allow civil (anon) and any authenticated user to read potential matches so
-- the public case card can show the "possible institutional match" section
-- without exposing any private column (all fields already reference public
-- persons rows). Only staff can still write via the existing policy.
GRANT SELECT ON public.potential_matches TO anon;
GRANT SELECT ON public.potential_matches TO authenticated;

CREATE POLICY "public read matches"
  ON public.potential_matches FOR SELECT TO anon
  USING (true);

CREATE POLICY "auth read matches"
  ON public.potential_matches FOR SELECT TO authenticated
  USING (true);