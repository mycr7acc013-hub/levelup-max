import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, tool, type UIMessage } from "ai";
import { z } from "zod";
import { startResponses, userClient, withRunId, isBanned } from "@/lib/ai.server";
import { GUIDES, SAFETY_NOTE, QUIZZES, buildSchedule, tierFor } from "@/lib/content";
import { isFlagged } from "@/lib/flag";

const FREE_DAILY = 25;
const PAGES = ["/", "/dashboard", "/assess", "/schedule", "/guides", "/quiz", "/progress", "/chat", "/studio", "/pricing", "/about", "/account"] as const;

function systemPrompt(name: string, pro: boolean, assessment: string, now: string) {
  return `You are LevelUp AI, the built-in coach for LevelUp, a self-improvement and lookmaxing website owned by B&A Co. (made by Ammar Alnasseh and Benjamin Stewart).
Personality: warm, sharp, witty, fluent, honest and encouraging, with your own opinions, like a smart older brother who knows fitness, skincare, grooming, style, nutrition, sleep and confidence. Talk naturally like ChatGPT. You can chat about anything (school, life, general knowledge, coding, maths, writing, etc.), but you are especially expert at self-improvement.
Use your own broad knowledge freely. When useful, cite well-known sources (e.g. American Academy of Dermatology, NIH, peer-reviewed sports science) by name and say they are general references.
The user can attach photos (selfies, outfits, meals, skin, gym form, homework). Look carefully and give specific, kind, useful feedback.
Tools: use get_my_progress whenever the user asks about their scores, tier, streak, XP or progress. Use get_daily_plan for their schedule. Use get_guide to quote guide steps exactly. Use navigate to give the user a button that takes them to a page whenever they ask where something is or want to go somewhere (also include a markdown link).
Safety rules: never recommend bone smashing, hitting the face, extreme dieting, steroids/SARMs, or anything harmful. ${SAFETY_NOTE} Never insult the user's looks. Encourage seeing a doctor or dermatologist for medical issues. If someone seems in crisis or mentions self-harm, respond with care and suggest contacting local emergency services or a crisis line (in Australia: Lifeline 13 11 14).
Website guide (pages):
- [Dashboard](/dashboard): greeting, stats, tier, streak, XP
- [Assessment](/assess): manual dropdown assessment or AI photo scan (front AND side profile photos), gives % scores and a Chadlite-style tier
- [Daily plan](/schedule): personalised daily tasks with timings, end-of-day check-in
- [Guides](/guides): ${GUIDES.map((g) => `${g.title} (slug ${g.slug}${g.pro ? ", MixMax" : ""})`).join(", ")}
- [Quizzes](/quiz): ${QUIZZES.map((q) => q.title + (q.pro ? " (MixMax)" : "")).join(", ")}
- [Progress](/progress): charts of past scores
- [AI Studio](/studio): MixMax only. A second AI that creates AI images and 15-second AI videos from a prompt or an uploaded image
- [Account](/account): plan, subscription and cancelling, profile
- [MixMax upgrade](/pricing): LevelUp MixMax costs $5.00/month, cancel anytime, and unlocks AI Studio (image + video generation), pro guides, advanced quiz, unlimited AI chat, unlimited photo scans and advanced stats
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
          const hasImg = last.parts.some((p) => p.type === "file");
          const { error } = await supabase.from("chat_messages").insert({ thread_id: thread.id, user_id: user.id, role: "user", message: last as never });
          if (error) console.error("save user msg", error);
          await supabase.from("activity_log").insert({ user_id: user.id, event: "ai_message", detail: (hasImg ? "[image] " : "") + text.slice(0, 2000), flagged: isFlagged(text) });
          if (thread.title === "New chat") await supabase.from("chat_threads").update({ title: text.slice(0, 48) || "Photo chat" }).eq("id", thread.id);
        }

        const { data: a } = await supabase.from("assessments").select("overall,tier,scores").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const assessment = a ? `overall ${a.overall}%, tier ${a.tier}, scores ${JSON.stringify(a.scores)}` : "";
        const now = new Date().toUTCString();

        const tools = {
          navigate: tool({
            description: "Show the user a button that takes them to a page on the LevelUp website.",
            inputSchema: z.object({ path: z.enum(PAGES).or(z.string().regex(/^\/guides\/[a-z-]+$/)), label: z.string().describe("Short button label, e.g. 'Open Assessment'") }),
            execute: async ({ path, label }) => ({ path, label }),
          }),
          get_my_progress: tool({
            description: "Get the user's assessment history, XP, streak and check-in count.",
            inputSchema: z.object({}),
            execute: async () => {
              const [{ data: hist }, { count: checkins }, { data: quizzes }] = await Promise.all([
                supabase.from("assessments").select("overall,tier,scores,method,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
                supabase.from("checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id),
                supabase.from("quiz_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
              ]);
              const next = a ? tierFor(a.overall) : null;
              return { xp: profile?.xp ?? 0, streak: profile?.streak ?? 0, checkins: checkins ?? 0, currentTier: next?.name ?? null, assessments: hist ?? [], recentQuizzes: quizzes ?? [] };
            },
          }),
          get_daily_plan: tool({
            description: "Build the user's personalised daily task plan from their latest scores.",
            inputSchema: z.object({ minutesPerDay: z.number().min(10).max(240).describe("How many minutes they have today; default 60") }),
            execute: async ({ minutesPerDay }) => (a ? buildSchedule(a.scores as Record<string, number>, minutesPerDay) : { note: "No assessment yet. Ask them to take one at /assess." }),
          }),
          get_guide: tool({
            description: "Get the full steps of a LevelUp guide by slug.",
            inputSchema: z.object({ slug: z.enum(GUIDES.map((g) => g.slug) as [string, ...string[]]) }),
            execute: async ({ slug }) => {
              const g = GUIDES.find((x) => x.slug === slug)!;
              if (g.pro && !profile?.is_pro) return { title: g.title, locked: "This is a MixMax guide. Give a short taste and suggest upgrading at /pricing.", intro: g.intro };
              return g;
            },
          }),
        };

        const { result, runIdFetch } = startResponses(request, await convertToModelMessages(body.messages), systemPrompt(profile?.display_name ?? "friend", !!profile?.is_pro, assessment, now), "medium", tools);
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
