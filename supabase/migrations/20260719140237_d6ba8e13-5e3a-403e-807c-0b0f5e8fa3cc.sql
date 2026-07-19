-- Fase 1: siembra idempotente de personas demo en Cloud, ligadas a eventos existentes.
-- Todos marcados is_demo=true para poder purgarlos con seguridad.

DO $$
DECLARE
  ev_mx uuid;  ev_cl uuid;  ev_br uuid;  ev_co uuid;  ev_ve uuid;  ev_yc uuid;
  p_id uuid;
BEGIN
  SELECT id INTO ev_mx FROM public.disaster_events WHERE name='Sismo Acapulco' LIMIT 1;
  SELECT id INTO ev_cl FROM public.disaster_events WHERE name='Sismo Valparaíso' LIMIT 1;
  SELECT id INTO ev_br FROM public.disaster_events WHERE name='Inundaciones Río Grande do Sul' LIMIT 1;
  SELECT id INTO ev_co FROM public.disaster_events WHERE name='Inundaciones Valle del Cauca' LIMIT 1;
  SELECT id INTO ev_ve FROM public.disaster_events WHERE name='Crisis humanitaria frontera VE' LIMIT 1;
  SELECT id INTO ev_yc FROM public.disaster_events WHERE name='Sismo en Yaracuy' LIMIT 1;

  -- helper insert as anonymous block per row (idempotent by public_case_code)
  INSERT INTO public.persons(public_case_code, event_id, display_name, approximate_age, gender, country,
    current_status, privacy_level, distinguishing_features, reported_at, is_demo)
  VALUES
    ('C-DEMO0001', ev_mx, 'María S.',   34, 'f', 'MX', 'missing',   'public', 'Cicatriz en la mano izquierda', '2024-11-04', true),
    ('C-DEMO0002', ev_mx, 'Juan P.',     8, 'm', 'MX', 'searching', 'public', NULL, '2024-11-05', true),
    ('C-DEMO0003', ev_cl, 'Camila R.',  27, 'f', 'CL', 'found',     'public', NULL, '2025-03-19', true),
    ('C-DEMO0004', ev_br, 'João M.',    45, 'm', 'BR', 'reunited',  'public', NULL, '2025-05-05', true),
    ('C-DEMO0005', ev_br, 'Sofía L.',   12, 'f', 'BR', 'missing',   'public', 'Lleva mochila roja', '2025-05-06', true),
    ('C-DEMO0006', ev_co, 'Andrés V.',  60, 'm', 'CO', 'searching', 'public', NULL, '2024-10-16', true),
    ('C-DEMO0007', ev_ve, 'Lucía G.',   22, 'f', 'VE', 'missing',   'public', NULL, '2025-02-03', true),
    ('C-DEMO0008', ev_cl, 'Diego H.',   16, 'm', 'CL', 'found',     'public', NULL, '2025-03-20', true),
    ('C-DEMO0009', ev_yc, 'Rosa M.',    42, 'f', 'VE', 'missing',   'public', 'Cadena con medalla religiosa', '2026-06-25', true),
    ('C-DEMO0010', ev_yc, 'Carlos G.',  55, 'm', 'VE', 'searching', 'public', 'Tatuaje antebrazo derecho', '2026-06-25', true),
    ('C-DEMO0011', ev_yc, 'Isabella P.', 6, 'f', 'VE', 'missing',   'public', 'Vestido azul, zapatos rojos', '2026-06-26', true),
    ('C-DEMO0012', ev_yc, 'Miguel Á.',  38, 'm', 'VE', 'missing',   'public', NULL, '2026-06-26', true)
  ON CONFLICT (public_case_code) DO NOTHING;

  -- disappearance_details
  FOR p_id IN SELECT id FROM public.persons WHERE public_case_code LIKE 'C-DEMO%' LOOP
    INSERT INTO public.disappearance_details(person_id, last_seen_date, last_seen_location)
    SELECT p_id, reported_at::date, 'Zona afectada'
    FROM public.persons WHERE id = p_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- potential_matches demo: dos sugerencias
  INSERT INTO public.potential_matches(source_person_id, matched_person_id, match_score, matching_fields, explanation, status, generated_by)
  SELECT a.id, b.id, 72, jsonb_build_object('same_event', true, 'name_similarity', 0.35),
    'Coincidencia demo: mismo evento y proximidad temporal.', 'suggested', 'demo_seed'
  FROM public.persons a JOIN public.persons b ON a.event_id = b.event_id AND a.id <> b.id
  WHERE a.public_case_code = 'C-DEMO0009' AND b.public_case_code = 'C-DEMO0011'
  ON CONFLICT DO NOTHING;

END $$;

-- Función utilitaria para purgar datos demo (idempotente, admin/service_role).
CREATE OR REPLACE FUNCTION public.purge_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.persons WHERE is_demo = true;
  DELETE FROM public.disaster_events WHERE is_demo = true;
END; $$;

REVOKE ALL ON FUNCTION public.purge_demo_data() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_demo_data() TO service_role;