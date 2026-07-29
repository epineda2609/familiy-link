import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_person_by_code",
  title: "Ver ficha por ID BASUF",
  description:
    "Obtiene la ficha de una persona a partir de su identificador público BASUF (por ejemplo BASUF-VE-9AA3).",
  inputSchema: {
    code: z.string().describe("ID BASUF público de la persona."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ code }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("persons")
      .select(
        "id, public_case_code, display_name, approximate_age, gender, current_status, country, nationality, distinguishing_features, event_id, reported_at",
      )
      .eq("public_case_code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) return errorResult(error.message);
    if (!data) return errorResult(`No se encontró ninguna ficha con el ID ${code}.`);

    const { data: history } = await supabase
      .from("person_status_history")
      .select("*")
      .eq("person_id", data.id)
      .order("created_at", { ascending: true });

    return {
      ...textResult({ person: data, history: history ?? [] }),
      structuredContent: { person: data, history: history ?? [] },
    };
  },
});
