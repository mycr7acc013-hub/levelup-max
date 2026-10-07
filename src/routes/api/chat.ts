import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { startResponses, userClient, withRunId, isBanned } from "@/lib/ai.server";
import { GUIDES, SAFETY_NOTE, QUIZZES } from "@/lib/content";
import { isFlagged } from "@/lib/flag";

const FREE_DAILY = 25;

function systemPrompt(name: string, pro: boolean, assessment: string, now: string) {
  return `You are LevelUp AI, the built-in coach for LevelUp, a self-improvement and lookmaxing website owned by B&A Co. (made by Ammar Alnasseh and Benjamin Stewart).
Personality: warm, sharp, witty, fluent, honest and encouraging, like a smart older brother who knows fitness, skincare, grooming, style, nutrition, sleep and confidence. Talk naturally like ChatGPT. You can chat about anything (school, life, general knowledge, coding, etc.), but you are especially expert at self-improvement.
Use your own broad knowledge freely. When useful, cite well-known sources (e.g. American Academy of Dermatology, NIH, peer-reviewed sports science) by name and say they are general references.
Safety rules: never recommend bone smashing, hitting the face, extreme dieting, steroids/SARMs, or anything harmful. ${SAFETY_NOTE} Never insult the user's looks. Encourage seeing a doctor or dermatologist for medical issues. If someone seems in crisis or mentions self-harm, respond with care and suggest contacting local emergency services or a crisis line.
Website guide (direct users with markdown links):
- [Dashboard](/dashboard): greeting, stats, tier, streak, XP
- [Assessment](/assess): manual dropdown assessment or AI photo scan, gives % scores and a Chadlite-style tier
- [Daily plan](/schedule): personalised daily tasks with timings, end-of-day check-in
- [Guides](/guides): ${GUIDES.map((g) => g.title + (g.pro ? " (MixMax)" : "")).join(", ")}
- [Quizzes](/quiz): ${QUIZZES.map((q) => q.title + (q.pro ? " (MixMax)" : "")).join(", ")}
- [Progress](/progress): charts of past scores
- [MixMax upgrade](/pricing): LevelUp MixMax costs $7.50/month and unlocks pro guides, advanced quiz, unlimited AI, unlimited photo scans and advanced stats
- [About](/about): B&A Co.
User: ${name}. Plan: ${pro ? "MixMax (pro)" : "Free"}. Current time: ${now}.
Latest assessment: ${assessment || "none yet; suggest they take one at /assess"}.
Format with markdown, short paragraphs, and bullet points when useful. Keep answers focused.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await userClient(request);
        if (!auth) return new Response("Please sign in", { status: 401 });
        const { supabase, user, profile } = auth;
        if (isBanned(profile)) return new Response("Your account is suspended", { status: 403 });

        const body = (await request.json()) as { messages: UIMessage[]; threadId: string };
        if (!body?.threadId || !Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });
        const { data: thread } = await supabase.from("chat_threads").select("id,title").eq("id", body.threadId).maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        if (!profile?.is_pro) {
          const since = new Date(Date.now() - 86400000).toISOString();
          const { count } = await supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user").gte("created_at", since);
          if ((count ?? 0) >= FREE_DAILY) return new Response(`Free plan limit reached (${FREE_DAILY} messages/day). Upgrade to MixMax for unlimited chat.`, { status: 429 });
        }

        const last = body.messages[body.messages.length - 1];
        if (last?.role === "user") {
          const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ");
          const { error } = await supabase.from("chat_messages").insert({ thread_id: thread.id, user_id: user.id, role: "user", message: last as never });
          if (error) console.error("save user msg", error);
          await supabase.from("activity_log").insert({ user_id: user.id, event: "ai_message", detail: text.slice(0, 2000), flagged: isFlagged(text) });
          if (thread.title === "New chat") await supabase.from("chat_threads").update({ title: text.slice(0, 48) || "New chat" }).eq("id", thread.id);
        }

        const { data: a } = await supabase.from("assessments").select("overall,tier,scores").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const assessment = a ? `overall ${a.overall}%, tier ${a.tier}, scores ${JSON.stringify(a.scores)}` : "";
        const now = new Date().toUTCString();

        const { result, runIdFetch } = startResponses(request, await convertToModelMessages(body.messages), systemPrompt(profile?.display_name ?? "friend", !!profile?.is_pro, assessment, now));
        const res = result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          sendReasoning: true,
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabase.from("chat_messages").insert({ thread_id: thread.id, user_id: user.id, role: "assistant", message: responseMessage as never });
            if (error) console.error("save assistant msg", error);
            await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", thread.id);
          },
        });
        return withRunId(res, runIdFetch);
      },
    },
  },
});
