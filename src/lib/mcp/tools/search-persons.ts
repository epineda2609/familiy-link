import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "search_persons",
  title: "Buscar personas",
  description:
    "Busca fichas de personas registradas en BASUF por nombre, país o estado del caso.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Texto parcial del nombre de la persona."),
    country: z.string().optional().describe("Código o nombre del país."),
    status: z
      .string()
      .optional()
      .describe("Estado del caso, por ejemplo missing, searching, located, reunited."),
    limit: z.number().optional().describe("Máximo de resultados (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    let q = supabaseForUser(ctx)
      .from("persons")
      .select(
        "id, public_case_code, display_name, approximate_age, gender, current_status, country, nationality, event_id, reported_at",
      )
      .order("reported_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 50));

    if (query) q = q.ilike("display_name", `%${query}%`);
    if (country) q = q.ilike("country", `%${country}%`);
    if (status) q = q.eq("current_status", status as never);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return { ...textResult(data ?? []), structuredContent: { persons: data ?? [] } };
  },
});
