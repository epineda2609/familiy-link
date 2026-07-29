import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPersons from "./tools/search-persons";
import getPerson from "./tools/get-person";
import listEmergencies from "./tools/list-emergencies";
import listMatches from "./tools/list-matches";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "familiy-link",
  title: "Familiy Link",
  version: "0.1.0",
  instructions:
    "Herramientas de BASUF (plataforma humanitaria de reunificación familiar). Usa `list_emergencies` para ver eventos humanitarios, `search_persons` para buscar fichas de personas, `get_person_by_code` para consultar una ficha por su ID BASUF y `list_potential_matches` para revisar posibles coincidencias pendientes de verificación humana. Los datos son sensibles: no los redistribuyas fuera del contexto de la consulta.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEmergencies, searchPersons, getPerson, listMatches],
});
