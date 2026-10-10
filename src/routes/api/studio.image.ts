import { createFileRoute } from "@tanstack/react-router";
import { userClient, isBanned } from "@/lib/ai.server";
import { generateImage, generateImageOnce } from "@/lib/media.server";
import { isFlagged } from "@/lib/flag";

export const Route = createFileRoute("/api/studio/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await userClient(request);
        if (!auth) return new Response("Please sign in", { status: 401 });
        if (isBanned(auth.profile)) return new Response("Your account is suspended", { status: 403 });
        if (!auth.profile?.is_pro) return new Response("AI Studio is a MixMax feature. Upgrade to unlock it.", { status: 402 });
        const body = (await request.json().catch(() => null)) as { prompt?: string; stream?: boolean } | null;
        const prompt = body?.prompt?.trim() ?? "";
        if (prompt.length < 3 || prompt.length > 1500) return new Response("Describe your image in 3 to 1500 characters.", { status: 400 });
        if (isFlagged(prompt)) return new Response("Please keep prompts appropriate.", { status: 400 });
        await auth.supabase.from("activity_log").insert({ user_id: auth.user.id, event: "studio_image", detail: prompt.slice(0, 2000) });
        const res = body?.stream === false ? await generateImageOnce(prompt) : await generateImage(prompt, request.signal);
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          console.error("image gen", res.status, msg);
          return new Response(res.status === 402 ? "AI credits are used up for now. Please try later." : res.status === 429 ? "Too many requests, try again in a minute." : "Image generation failed. Try a different prompt.", { status: res.status });
        }
        return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") ?? "text/event-stream", "Cache-Control": "no-cache" } });
      },
    },
  },
});
