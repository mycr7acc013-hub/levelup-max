import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
export const MODEL = "openai/gpt-6-astra";

export function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolve: (v: string | undefined) => void = () => {};
  let done = false;
  const ready = new Promise<string | undefined>((r) => (resolve = r));
  const publish = (v?: string) => {
    if (!runId && v?.trim()) runId = v.trim();
    if (!done) { done = true; resolve(runId); }
  };
  if (runId) publish(runId);
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      try {
        const res = await fetch(input, { ...init, headers });
        publish(res.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return res;
      } catch (e) { publish(undefined); throw e; }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : ready),
  };
}

export function startResponses(request: Request, messages: ModelMessage[], system: string, effort: "low" | "medium" = "medium") {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Response("AI is not configured", { status: 500 });
  const runIdFetch = createRunIdFetch(request.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: effort,
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return { result, runIdFetch };
}

export async function withRunId(response: Response, gw: ReturnType<typeof createRunIdFetch>) {
  const runId = await Promise.race([gw.waitForRunId(), new Promise<undefined>((r) => setTimeout(() => r(undefined), 15000))]);
  const headers = new Headers(response.headers);
  if (runId) { headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId); headers.set("Access-Control-Expose-Headers", LOVABLE_AIG_RUN_ID_HEADER); }
  return new Response(response.body, { status: response.status, headers });
}

export async function userClient(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  return { supabase, user: data.user, profile };
}

export function isBanned(p: { banned_until: string | null } | null | undefined) {
  return !!p?.banned_until && new Date(p.banned_until) > new Date();
}
