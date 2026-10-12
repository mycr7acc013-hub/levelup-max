import { createFileRoute } from "@tanstack/react-router";
import { userClient, isBanned } from "@/lib/ai.server";
import { createVideo, pollVideo, downloadVideo, toBase64, GatewayError, SAFE_PREFIX } from "@/lib/media.server";
import { isFlagged } from "@/lib/flag";

const AUDIO = " Consider micro-detail, expression and timing. Generate a fitting soundtrack.";

export const Route = createFileRoute("/api/studio/video")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await userClient(request);
        if (!auth) return new Response("Please sign in", { status: 401 });
        if (isBanned(auth.profile)) return new Response("Your account is suspended", { status: 403 });
        if (!auth.profile?.is_pro) return new Response("AI Studio is a MixMax feature. Upgrade to unlock it.", { status: 402 });
        const body = (await request.json().catch(() => null)) as { prompt?: string; image?: string } | null;
        const prompt = body?.prompt?.trim() ?? "";
        if (prompt.length < 3 || prompt.length > 1500) return new Response("Describe your video in 3 to 1500 characters.", { status: 400 });
        if (isFlagged(prompt)) return new Response("Please keep prompts appropriate.", { status: 400 });

        const { count } = await auth.supabase.from("studio_creations").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("kind", "video").in("status", ["pending", "extending"]);
        if ((count ?? 0) > 0) return new Response("You already have a video rendering. Wait for it to finish.", { status: 429 });

        let input: string | Record<string, unknown>[] = SAFE_PREFIX + prompt + AUDIO;
        if (body?.image?.startsWith("data:image/")) {
          const [meta, data] = body.image.split(",");
          const mime = meta?.match(/data:(.*);base64/)?.[1] ?? "image/png";
          input = [{ type: "text", text: SAFE_PREFIX + "Animate this image: " + prompt + AUDIO }, { type: "image", data, mime_type: mime }];
        }
        try {
          const job = await createVideo(input, "10s");
          const { data: row, error } = await auth.supabase.from("studio_creations").insert({ user_id: auth.user.id, kind: "video", prompt, job_id: job.id, status: "pending" }).select("*").single();
          if (error) throw error;
          await auth.supabase.from("activity_log").insert({ user_id: auth.user.id, event: "studio_video", detail: prompt.slice(0, 2000) });
          return Response.json(row);
        } catch (e) {
          console.error("video create", e);
          const status = e instanceof GatewayError ? e.status : 500;
          return new Response(status === 402 || status === 403 ? "AI Studio is taking a short break (AI usage limit reached). Please try again later." : e instanceof GatewayError ? e.message : "Couldn't start the video.", { status });
        }
      },
      GET: async ({ request }) => {
        const auth = await userClient(request);
        if (!auth) return new Response("Please sign in", { status: 401 });
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return new Response("Missing id", { status: 400 });
        const { data: row } = await auth.supabase.from("studio_creations").select("*").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });
        if (row.status === "done" || row.status === "failed" || !row.job_id) return Response.json(row);
        const fail = async (msg: string) => {
          const { data } = await auth.supabase.from("studio_creations").update({ status: "failed", error: msg, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
          return Response.json(data);
        };
        try {
          const job = await pollVideo(row.job_id);
          if (job.status === "failed") return fail(job.error?.message ?? "Video generation failed. Try a different prompt.");
          if (job.status !== "completed") return Response.json({ ...row, progress: job.progress ?? null });
          const bytes = await downloadVideo(job.id);
          if (row.status === "pending") {
            // Extend the 10s clip by 5s for a 15s video
            const ext = await createVideo([
              { type: "text", text: "The scene continues naturally for 5 more seconds in the same style; the soundtrack carries on." },
              { type: "video", data: toBase64(bytes), mime_type: "video/mp4" },
            ], "5s", true);
            const { data } = await auth.supabase.from("studio_creations").update({ status: "extending", job_id: ext.id, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
            return Response.json(data);
          }
          const path = `${auth.user.id}/${id}.mp4`;
          const up = await auth.supabase.storage.from("studio").upload(path, bytes, { contentType: "video/mp4", upsert: true });
          if (up.error) throw up.error;
          const { data } = await auth.supabase.from("studio_creations").update({ status: "done", storage_path: path, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
          return Response.json(data);
        } catch (e) {
          console.error("video poll", e);
          if (e instanceof GatewayError && e.status !== 429 && e.status < 500) return fail(e.message);
          return Response.json(row);
        }
      },
    },
  },
});
