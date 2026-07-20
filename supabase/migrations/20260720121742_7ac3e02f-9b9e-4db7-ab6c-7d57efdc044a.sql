
CREATE OR REPLACE FUNCTION public.event_case_counters()
RETURNS TABLE (
  event_id uuid,
  registered_reports bigint,
  potential_matches bigint,
  verified_cases bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH reports AS (
    SELECT p.event_id, COUNT(*)::bigint AS c
      FROM public.persons p
     WHERE p.event_id IS NOT NULL
       AND p.archived_at IS NULL
     GROUP BY p.event_id
  ),
  matches AS (
    SELECT ev.event_id, COUNT(DISTINCT ev.match_id)::bigint AS c FROM (
      SELECT pm.id AS match_id, ps.event_id
        FROM public.potential_matches pm
        JOIN public.persons ps ON ps.id = pm.source_person_id
       WHERE ps.event_id IS NOT NULL AND ps.archived_at IS NULL
      UNION
      SELECT pm.id AS match_id, pm2.event_id
        FROM public.potential_matches pm
        JOIN public.persons pm2 ON pm2.id = pm.matched_person_id
       WHERE pm2.event_id IS NOT NULL AND pm2.archived_at IS NULL
    ) ev
    GROUP BY ev.event_id
  ),
  verified AS (
    SELECT ev.event_id, COUNT(DISTINCT ev.person_id)::bigint AS c FROM (
      SELECT vr.person_id, p.event_id
        FROM public.verification_reviews vr
        JOIN public.persons p ON p.id = vr.person_id
       WHERE vr.decision = 'approved'
         AND p.event_id IS NOT NULL AND p.archived_at IS NULL
      UNION
      SELECT ps.id AS person_id, ps.event_id
        FROM public.verification_reviews vr
        JOIN public.potential_matches pm ON pm.id = vr.match_id
        JOIN public.persons ps ON ps.id IN (pm.source_person_id, pm.matched_person_id)
       WHERE vr.decision = 'approved'
         AND ps.event_id IS NOT NULL AND ps.archived_at IS NULL
    ) ev
    GROUP BY ev.event_id
  )
  SELECT de.id AS event_id,
         COALESCE(r.c, 0) AS registered_reports,
         COALESCE(m.c, 0) AS potential_matches,
         COALESCE(v.c, 0) AS verified_cases
    FROM public.disaster_events de
    LEFT JOIN reports r ON r.event_id = de.id
    LEFT JOIN matches m ON m.event_id = de.id
    LEFT JOIN verified v ON v.event_id = de.id;
$$;

REVOKE ALL ON FUNCTION public.event_case_counters() FROM public;
GRANT EXECUTE ON FUNCTION public.event_case_counters() TO anon, authenticated, service_role;
