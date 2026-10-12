import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Crown, Film, ImageIcon, Loader2, Sparkles, Trash2, Upload, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { streamImage } from "@/lib/stream-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => seo("AI Studio", "MixMax AI Studio: create AI images and 15-second AI videos from a prompt or a photo."),
  component: Studio,
});

type Creation = { id: string; kind: string; prompt: string; status: string; storage_path: string | null; error: string | null; created_at: string; url?: string | undefined };

const IDEAS = {
  image: ["A sleek streetwear outfit on a mannequin, studio lighting", "Futuristic gym at night with neon lights", "Motivational poster: 'Level Up' in bold chrome letters", "A cozy desk setup with plants and warm light"],
  video: ["Slow cinematic push-in on a sunrise over a mountain gym, epic music", "A golden retriever surfing a wave, upbeat summer music", "Neon city at night, camera flying between skyscrapers, synthwave", "Time-lapse of a plant growing in a sunny window, gentle piano"],
};

function Studio() {
  const { session, profile } = useAuth();
  if (!profile?.is_pro) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center animate-rise">
        <Crown className="mx-auto mb-4 size-14 text-gold animate-float" />
        <h1 className="text-4xl font-extrabold">AI Studio is <span className="text-gold">MixMax</span> only</h1>
        <p className="mt-3 text-muted-foreground">Get a second AI that creates images and 15-second videos about anything (appropriate). $5.00/month, cancel anytime.</p>
        <Button asChild variant="hero" size="xl" className="mt-6"><Link to="/pricing">Unlock AI Studio</Link></Button>
      </div>
    );
  }
  return <StudioInner token={session?.access_token ?? ""} uid={session?.user.id ?? ""} />;
}

function StudioInner({ token, uid }: { token: string; uid: string }) {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; final: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Creation[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("studio_creations").select("*").order("created_at", { ascending: false }).limit(60);
    const rows = (data ?? []) as Creation[];
    const paths = rows.filter((r) => r.storage_path).map((r) => r.storage_path!);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("studio").createSignedUrls(paths, 3600);
      const map = new Map(signed?.map((s) => [s.path, s.signedUrl]));
      rows.forEach((r) => { if (r.storage_path) r.url = map.get(r.storage_path) ?? undefined; });
    }
    setItems(rows);
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Poll rendering videos
  const pending = items.filter((i) => i.status === "pending" || i.status === "extending");
  useEffect(() => {
    if (!pending.length) return;
    const t = setInterval(async () => {
      for (const p of pending) {
        const r = await fetch(`/api/studio/video?id=${p.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) continue;
        const row = (await r.json()) as Creation;
        if (row.status !== p.status) {
          if (row.status === "done") toast.success("Your video is ready!");
          if (row.status === "failed") toast.error(row.error ?? "Video failed");
          void load();
        }
      }
    }, 8000);
    return () => clearInterval(t);
  }, [pending.map((p) => p.id + p.status).join(","), token, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas"); const s = Math.min(1, 1280 / Math.max(i.width, i.height));
        c.width = i.width * s; c.height = i.height * s; c.getContext("2d")!.drawImage(i, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.9));
      };
      i.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const createImage = async () => {
    setBusy(true); setPreview(null);
    let finalUrl = "";
    try {
      await streamImage("/api/studio/image", { prompt }, (url, final) => { setPreview({ url, final }); if (final) finalUrl = url; }, undefined, { Authorization: `Bearer ${token}` });
      const blob = await (await fetch(finalUrl)).blob();
      const id = crypto.randomUUID();
      const path = `${uid}/${id}.png`;
      const up = await supabase.storage.from("studio").upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      await supabase.from("studio_creations").insert({ id, user_id: uid, kind: "image", prompt, status: "done", storage_path: path });
      toast.success("Image saved to your gallery");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^Image generation failed: \d+ /, "") : "Image generation failed");
    } finally { setBusy(false); }
  };

  const createVideo = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/studio/video", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt, image: photo ?? undefined }) });
      if (!r.ok) { toast.error(await r.text()); return; }
      toast.success("Rendering your 15-second video. This takes a few minutes; you can leave this page.");
      setPrompt(""); setPhoto(null);
      void load();
    } finally { setBusy(false); }
  };

  const del = async (c: Creation) => {
    if (c.storage_path) await supabase.storage.from("studio").remove([c.storage_path]);
    await supabase.from("studio_creations").delete().eq("id", c.id);
    void load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="animate-rise">
        <h1 className="flex items-center gap-3 text-4xl font-extrabold"><Sparkles className="text-gold animate-float" />AI <span className="text-gradient">Studio</span></h1>
        <p className="text-muted-foreground">Your MixMax creative AI. Make images and 15-second videos about anything appropriate.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4 rounded-3xl glass p-6">
          <div className="inline-flex rounded-full bg-secondary p-1">
            <button onClick={() => setMode("image")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${mode === "image" ? "bg-primary text-primary-foreground" : ""}`}><ImageIcon className="size-4" />Image</button>
            <button onClick={() => setMode("video")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${mode === "video" ? "bg-primary text-primary-foreground" : ""}`}><Film className="size-4" />Video · 15s</button>
          </div>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1500} rows={5} placeholder={mode === "image" ? "Describe the image you want…" : "Describe your video: scene, camera, mood, music…"} />
          <div className="flex flex-wrap gap-2">{IDEAS[mode].map((i) => <button key={i} onClick={() => setPrompt(i)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary">{i}</button>)}</div>
          {mode === "video" && (
            <div className="flex items-center gap-3">
              <Button variant="glass" size="sm" onClick={() => fileRef.current?.click()}><Upload />{photo ? "Change photo" : "Animate a photo (optional)"}</Button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              {photo && <div className="relative"><img src={photo} alt="Start frame" className="h-14 rounded-lg" /><button aria-label="Remove photo" onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 rounded-full bg-background p-0.5"><X className="size-3" /></button></div>}
            </div>
          )}
          <Button variant="hero" size="xl" className="w-full" disabled={busy || prompt.trim().length < 3} onClick={mode === "image" ? createImage : createVideo}>
            {busy ? <><Loader2 className="animate-spin" />{mode === "image" ? "Creating…" : "Starting…"}</> : <><Sparkles />Create {mode}</>}
          </Button>
          <p className="text-xs text-muted-foreground">Keep it appropriate: no nudity, violence, hate or real celebrities. Videos take 2–5 minutes and include sound.</p>
        </div>
        <div className="grid min-h-80 place-items-center overflow-hidden rounded-3xl glass">
          {preview ? <img src={preview.url} alt="Generated" className={`h-full w-full object-contain transition duration-700 ${preview.final ? "" : "blur-md scale-105"}`} />
            : pending.length ? <div className="text-center"><div className="mx-auto mb-3 size-12 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="font-semibold">Rendering video…</p><p className="text-sm text-muted-foreground">{pending[0]?.status === "extending" ? "Adding the last 5 seconds" : "Creating the first 10 seconds"}</p></div>
            : <div className="text-center text-muted-foreground"><Sparkles className="mx-auto mb-2 size-10 animate-float" />Your creation appears here</div>}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Your gallery</h2>
        {items.length === 0 ? <p className="text-muted-foreground">Nothing yet. Create your first image or video above.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <div key={c.id} className="group overflow-hidden rounded-2xl glass animate-rise">
                <div className="relative grid aspect-video place-items-center bg-secondary">
                  {c.status === "done" && c.url ? (c.kind === "video" ? <video src={c.url} controls playsInline className="h-full w-full object-cover" /> : <img src={c.url} alt={c.prompt} className="h-full w-full object-cover" />)
                    : c.status === "failed" ? <p className="p-4 text-center text-sm text-destructive">{c.error ?? "Failed"}</p>
                    : <Loader2 className="size-8 animate-spin text-primary" />}
                </div>
                <div className="flex items-start justify-between gap-2 p-3 text-sm">
                  <p className="line-clamp-2"><span className="mr-1 text-xs uppercase text-muted-foreground">{c.kind}</span>{c.prompt}</p>
                  <div className="flex shrink-0 gap-1">
                    {c.url && <a href={c.url} download aria-label="Download" className="rounded p-1 hover:bg-secondary"><Download className="size-4" /></a>}
                    <button aria-label="Delete" onClick={() => del(c)} className="rounded p-1 hover:bg-secondary"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
