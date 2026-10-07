import { createFileRoute } from "@tanstack/react-router";
import { startResponses, userClient, isBanned } from "@/lib/ai.server";

const FREE_SCANS_PER_WEEK = 1;

const SYSTEM = `You are LevelUp's appearance analysis engine. You look at one photo the user consented to share and give an honest, kind, constructive self-improvement assessment.
Return ONLY a JSON object, no markdown, with this exact shape:
{"scores":{"jaw":0-100,"skin":0-100,"eyes":0-100,"hair":0-100,"symmetry":0-100,"harmony":0-100,"posture":0-100,"style":0-100},"faceShape":"string","strengths":["..."],"improvements":[{"area":"string","tip":"string","timeframe":"string"}],"summary":"2-3 encouraging sentences"}
Scoring: be realistic but encouraging; most people score 50-75. Base it only on visible improvable factors (skin, grooming, hair, lighting, posture, leanness, style). Never comment on race, ethnicity or anything the person cannot change in a negative way. Never suggest bone smashing or anything harmful. If no human face is visible, return {"error":"No face detected"}.`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await userClient(request);
        if (!auth) return new Response("Please sign in", { status: 401 });
        if (isBanned(auth.profile)) return new Response("Your account is suspended", { status: 403 });
        const { image, consent } = (await request.json()) as { image?: string; consent?: boolean };
        if (!consent) return new Response("Consent is required", { status: 400 });
        if (!image?.startsWith("data:image/") || image.length > 8_000_000) return new Response("Invalid image", { status: 400 });

        if (!auth.profile?.is_pro) {
          const since = new Date(Date.now() - 7 * 86400000).toISOString();
          const { count } = await auth.supabase.from("assessments").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("method", "scan").gte("created_at", since);
          if ((count ?? 0) >= FREE_SCANS_PER_WEEK) return new Response("Free plan includes 1 photo scan per week. Upgrade to MixMax for unlimited scans.", { status: 429 });
        }

        const { result } = startResponses(request, [
          { role: "user", content: [{ type: "text", text: "Analyse this photo for my LevelUp assessment." }, { type: "image", image }] },
        ], SYSTEM, "low");
        try {
          const text = await result.text;
          const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
          await auth.supabase.from("activity_log").insert({ user_id: auth.user.id, event: "photo_scan", detail: "AI photo scan completed (photo not stored)" });
          return Response.json(json);
        } catch (e) {
          console.error("analyze failed", e);
          return new Response("The analysis failed. Please try another photo.", { status: 502 });
        }
      },
    },
  },
});
