import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ListChecks, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { ASSESS_FIELDS, SCORE_LABELS, tierFor } from "@/lib/content";
import { addXp, logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/assess")({
  head: () => seo("Assessment", "Rate yourself with dropdowns or scan your face with AI to get scores and a tier."),
  component: Assess,
});

type Result = { scores: Record<string, number>; overall: number; summary?: string; strengths?: string[]; improvements?: { area: string; tip: string; timeframe: string }[]; faceShape?: string };

function Assess() {
  const [tab, setTab] = useState<"manual" | "scan">("scan");
  const [result, setResult] = useState<Result | null>(null);
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div><h1 className="text-4xl font-extrabold">Assessment</h1><p className="text-muted-foreground">Pick a method. Scanning is faster, and manual lets you fine-tune.</p></div>
      <div className="inline-flex rounded-full glass p-1">
        <button onClick={() => setTab("scan")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "scan" ? "bg-primary text-primary-foreground" : ""}`}><Camera className="size-4" />AI Photo Scan</button>
        <button onClick={() => setTab("manual")} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${tab === "manual" ? "bg-primary text-primary-foreground" : ""}`}><ListChecks className="size-4" />Manual</button>
      </div>
      {result ? <ResultView r={result} onReset={() => setResult(null)} /> : tab === "scan" ? <Scan onDone={setResult} /> : <Manual onDone={setResult} />}
    </div>
  );
}

async function save(method: string, inputs: object, r: Result) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const tier = tierFor(r.overall).name;
  const { error } = await supabase.from("assessments").insert({ user_id: data.user.id, method, inputs: inputs as never, scores: r.scores, overall: r.overall, tier, summary: r.summary ?? null });
  if (error) toast.error("Couldn't save your result"); else { await addXp(50); await logActivity("assessment", `${method}: ${r.overall}% (${tier})`); }
}

function Manual({ onDone }: { onDone: (r: Result) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const done = ASSESS_FIELDS.every((f) => vals[f.key]);
  const submit = async () => {
    const scores = Object.fromEntries(ASSESS_FIELDS.map((f) => [f.key, Number(vals[f.key])]));
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / ASSESS_FIELDS.length);
    const r = { scores, overall };
    await save("manual", vals, r);
    onDone(r);
  };
  return (
    <div className="space-y-4 rounded-2xl glass p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {ASSESS_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-sm font-medium">{f.label}</label>
            <Select value={vals[f.key] ?? ""} onValueChange={(v) => setVals({ ...vals, [f.key]: v })}>
              <SelectTrigger><SelectValue placeholder="Choose how you are now" /></SelectTrigger>
              <SelectContent>{f.options.map((o) => <SelectItem key={o.label} value={String(o.v)}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button variant="hero" disabled={!done} onClick={submit}>Get my scores</Button>
    </div>
  );
}

function Scan({ onDone }: { onDone: (r: Result) => void }) {
  const { session } = useAuth();
  const [img, setImg] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setCamOn(true);
      setTimeout(() => { if (video.current) { video.current.srcObject = stream; void video.current.play(); } }, 50);
    } catch { toast.error("Camera unavailable. Upload a photo instead."); }
  };
  const snap = () => {
    const v = video.current; if (!v) return;
    const c = document.createElement("canvas");
    const scale = Math.min(1, 1024 / v.videoWidth);
    c.width = v.videoWidth * scale; c.height = v.videoHeight * scale;
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    setImg(c.toDataURL("image/jpeg", 0.85));
    (v.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setCamOn(false);
  };
  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas"); const s = Math.min(1, 1024 / Math.max(i.width, i.height));
        c.width = i.width * s; c.height = i.height * s; c.getContext("2d")!.drawImage(i, 0, 0, c.width, c.height);
        setImg(c.toDataURL("image/jpeg", 0.85));
      };
      i.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!img || !consent) return;
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ image: img, consent }) });
      if (!res.ok) { toast.error(await res.text()); return; }
      const j = await res.json();
      if (j.error) { toast.error(j.error); return; }
      const scores = j.scores as Record<string, number>;
      const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);
      const r = { ...j, scores, overall };
      await save("scan", { faceShape: j.faceShape }, r);
      onDone(r);
    } catch { toast.error("Network error, please try again."); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl glass">
        {camOn ? <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" /> : img ? <img src={img} alt="Your photo" className="h-full w-full object-cover" /> : <Camera className="size-16 text-muted-foreground" />}
        {(busy || camOn) && <div className="absolute inset-x-0 h-0.5 animate-scan bg-primary shadow-glow" />}
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Scan your face</h2>
        <p className="text-sm text-muted-foreground">Face the camera in good, even light with your hair off your forehead and a neutral expression.</p>
        <div className="flex flex-wrap gap-2">
          {camOn ? <Button variant="hero" onClick={snap}>Take photo</Button> : <Button variant="glass" onClick={startCam}><Camera />Use camera</Button>}
          <Button variant="glass" onClick={() => fileRef.current?.click()}><Upload />Upload photo</Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
          <span>I agree to send this photo to LevelUp's AI for analysis. <span className="text-muted-foreground">The photo is processed once and never stored. Only your scores are saved, and you can delete them from Progress at any time.</span></span>
        </label>
        <Button variant="hero" size="xl" className="w-full" disabled={!img || !consent || busy} onClick={analyze}>{busy ? <><Loader2 className="animate-spin" />Analysing…</> : "Analyse with AI"}</Button>
      </div>
    </div>
  );
}

function ResultView({ r, onReset }: { r: Result; onReset: () => void }) {
  const tier = tierFor(r.overall);
  return (
    <div className="space-y-6 animate-rise">
      <div className="rounded-3xl glass p-8 text-center">
        <p className="text-sm text-muted-foreground">Overall</p>
        <div className="font-display text-7xl font-extrabold text-gradient">{r.overall}%</div>
        <div className={`mt-2 text-xl font-bold ${tier.color}`}>{tier.name}</div>
        {r.faceShape && <p className="mt-1 text-sm text-muted-foreground">Face shape: {r.faceShape}</p>}
        {r.summary && <p className="mx-auto mt-4 max-w-xl">{r.summary}</p>}
      </div>
      <div className="grid gap-3 rounded-2xl glass p-6 md:grid-cols-2">
        {Object.entries(r.scores).map(([k, v]) => <div key={k}><div className="mb-1 flex justify-between text-sm"><span>{SCORE_LABELS[k] ?? k}</span><span>{v}%</span></div><Progress value={v} /></div>)}
      </div>
      {!!r.strengths?.length && <div className="rounded-2xl glass p-6"><h3 className="mb-2 font-bold text-primary">Strengths</h3><ul className="list-disc space-y-1 pl-5 text-sm">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      {!!r.improvements?.length && <div className="rounded-2xl glass p-6"><h3 className="mb-3 font-bold text-accent">Your next moves</h3><div className="space-y-3">{r.improvements.map((i) => <div key={i.area + i.tip} className="rounded-xl border border-border p-3 text-sm"><div className="font-semibold">{i.area} <span className="text-xs text-muted-foreground">· {i.timeframe}</span></div>{i.tip}</div>)}</div></div>}
      <div className="flex flex-wrap gap-3"><Button asChild variant="hero"><Link to="/schedule">Build my daily plan</Link></Button><Button variant="glass" onClick={onReset}>New assessment</Button></div>
    </div>
  );
}
