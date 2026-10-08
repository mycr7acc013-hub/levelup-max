import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { buildSchedule } from "@/lib/content";
import { addXp, logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => seo("Daily Plan", "Your personalised daily lookmaxing tasks with timings and an end-of-day check-in."),
  component: Schedule,
});

function Schedule() {
  const { profile, refresh } = useAuth();
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [mins, setMins] = useState("45");
  const [done, setDone] = useState<string[]>([]);
  const [mood, setMood] = useState("3");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!profile) return;
    supabase.from("assessments").select("scores").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setScores((data?.scores as Record<string, number>) ?? { jaw: 60, skin: 60, posture: 60, bodyfat: 60, style: 60 }));
    supabase.from("checkins").select("id").eq("user_id", profile.id).eq("day", today).maybeSingle().then(({ data }) => setChecked(!!data));
  }, [profile, today]);

  const tasks = useMemo(() => (scores ? buildSchedule(scores, Number(mins)) : []), [scores, mins]);
  const total = tasks.reduce((a, t) => a + (t.minutes > 120 ? 0 : t.minutes), 0);

  const checkIn = async () => {
    if (!profile) return;
    const { error } = await supabase.from("checkins").insert({ user_id: profile.id, day: today, tasks_done: done, mood: Number(mood), notes });
    if (error) return toast.error("Check-in failed");
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = profile.last_checkin === yest ? profile.streak + 1 : 1;
    await supabase.from("profiles").update({ streak, last_checkin: today }).eq("id", profile.id);
    await addXp(10 + done.length * 5);
    await logActivity("checkin", `${done.length}/${tasks.length} tasks, mood ${mood}. ${notes}`);
    await refresh();
    setChecked(true);
    toast.success(`Checked in! Streak: ${streak} 🔥`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-4xl font-extrabold">Today's plan</h1><p className="text-muted-foreground">Built from your weakest areas. <Link to="/assess" className="text-primary underline">Re-assess</Link> to update it.</p></div>
        <div className="w-48"><label className="text-xs text-muted-foreground">Time per day</label>
          <Select value={mins} onValueChange={setMins}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["15", "30", "45", "60", "90", "120"].map((m) => <SelectItem key={m} value={m}>{m} minutes</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="rounded-2xl glass p-6">
        <div className="mb-4 flex justify-between text-sm"><span>{done.length}/{tasks.length} done</span><span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-4" />~{total} min active</span></div>
        <Progress value={tasks.length ? (done.length / tasks.length) * 100 : 0} className="mb-4" />
        <div className="space-y-2">
          {tasks.map((t) => (
            <label key={t.id} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-secondary">
              <Checkbox checked={done.includes(t.id)} disabled={checked} onCheckedChange={(v) => setDone(v ? [...done, t.id] : done.filter((x) => x !== t.id))} />
              <span className={`flex-1 ${done.includes(t.id) ? "line-through text-muted-foreground" : ""}`}>{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.minutes > 120 ? "overnight" : t.minutes ? `${t.minutes} min` : "all day"}</span>
              {t.guide && <Link to="/guides/$slug" params={{ slug: t.guide }} className="text-xs text-primary">How?</Link>}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4 rounded-2xl glass p-6">
        <h2 className="text-xl font-bold">End-of-day check-in</h2>
        {checked ? <p className="flex items-center gap-2 text-primary"><CheckCircle2 />You've checked in today. See you tomorrow!</p> : <>
          <div className="w-48"><label className="text-xs text-muted-foreground">How did today feel?</label>
            <Select value={mood} onValueChange={setMood}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["1 · Rough", "2 · Meh", "3 · Okay", "4 · Good", "5 · Locked in"].map((m) => <SelectItem key={m} value={m[0]}>{m}</SelectItem>)}</SelectContent></Select></div>
          <Textarea placeholder="Notes: wins, struggles, how you look today…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="text-xs text-muted-foreground">Want a progress photo? Do a quick <Link to="/assess" className="text-primary underline">AI scan</Link> to track your face over time.</p>
          <Button variant="hero" onClick={checkIn}>Check in (+XP)</Button>
        </>}
      </div>
    </div>
  );
}
