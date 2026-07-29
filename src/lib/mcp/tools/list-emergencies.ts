import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_emergencies",
  title: "Listar emergencias",
  description:
    "Lista los eventos humanitarios (emergencias) registrados en BASUF, del más reciente al más antiguo.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Filtrar por estado del evento, por ejemplo active."),
    limit: z.number().optional().describe("Máximo de resultados (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    let q = supabaseForUser(ctx)
      .from("disaster_events")
      .select(
        "id, event_code, name, event_type, country, region, city, magnitude, severity, status, start_date, affected_estimate, fatalities, missing_count",
      )
      .order("start_date", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 50));

    if (status) q = q.eq("status", status as never);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return { ...textResult(data ?? []), structuredContent: { events: data ?? [] } };
  },
});
