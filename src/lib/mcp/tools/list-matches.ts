import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_potential_matches",
  title: "Listar posibles coincidencias",
  description:
    "Lista posibles coincidencias entre fichas de personas, pendientes de revisión humana.",
  inputSchema: {
    person_id: z
      .string()
      .optional()
      .describe("UUID de una persona para filtrar sus coincidencias."),
    limit: z.number().optional().describe("Máximo de resultados (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ person_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    let q = supabaseForUser(ctx)
      .from("potential_matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 50));

    if (person_id) {
      q = q.or(`person_a_id.eq.${person_id},person_b_id.eq.${person_id}`);
    }

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return { ...textResult(data ?? []), structuredContent: { matches: data ?? [] } };
  },
});
