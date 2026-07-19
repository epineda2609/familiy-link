DO $$
DECLARE
  crv uuid;
  acnur uuid;
  unicef uuid;
BEGIN
  SELECT id INTO crv FROM public.organizations WHERE name ILIKE 'Cruz Roja Venezolana' LIMIT 1;
  SELECT id INTO acnur FROM public.organizations WHERE name ILIKE 'Alto Comisionado%Refugiados' LIMIT 1;
  SELECT id INTO unicef FROM public.organizations WHERE name ILIKE 'Fondo%Infancia' LIMIT 1;

  IF crv IS NOT NULL THEN
    INSERT INTO public.organization_memberships
      (organization_id, user_email, user_name, institutional_role, status, invited_at, activated_at, is_demo)
    SELECT crv, 'revisor.crv@basuf-demo.org', 'Ana Ríos (demo)', 'reviewer'::membership_role, 'active'::membership_status, now(), now(), true
    WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_email = 'revisor.crv@basuf-demo.org');

    INSERT INTO public.organization_memberships
      (organization_id, user_email, user_name, institutional_role, status, invited_at, activated_at, is_demo)
    SELECT crv, 'consulta.crv@basuf-demo.org', 'Luis Peña (demo)', 'viewer'::membership_role, 'active'::membership_status, now(), now(), true
    WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_email = 'consulta.crv@basuf-demo.org');
  END IF;

  IF acnur IS NOT NULL THEN
    INSERT INTO public.organization_memberships
      (organization_id, user_email, user_name, institutional_role, status, invited_at, activated_at, is_demo)
    SELECT acnur, 'revisor.acnur@basuf-demo.org', 'Marta Silva (demo)', 'reviewer'::membership_role, 'active'::membership_status, now(), now(), true
    WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_email = 'revisor.acnur@basuf-demo.org');
  END IF;

  IF unicef IS NOT NULL THEN
    INSERT INTO public.organization_memberships
      (organization_id, user_email, user_name, institutional_role, status, invited_at, activated_at, is_demo)
    SELECT unicef, 'consulta.unicef@basuf-demo.org', 'Diego Ortega (demo)', 'viewer'::membership_role, 'active'::membership_status, now(), now(), true
    WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_email = 'consulta.unicef@basuf-demo.org');
  END IF;
END $$;

CREATE POLICY "public read active memberships for demo login"
ON public.organization_memberships
FOR SELECT
TO anon
USING (status = 'active');

GRANT SELECT ON public.organization_memberships TO anon;