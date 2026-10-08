import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => seo("Progress", "Track your scores, check-ins and quiz results over time."),
  component: ProgressPage,
});

type A = { id: string; overall: number; tier: string | null; method: string; created_at: string };

function ProgressPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<A[]>([]);
  const [checkins, setCheckins] = useState(0);
  const [quizzes, setQuizzes] = useState<{ quiz: string; score: number; total: number; created_at: string }[]>([]);

  const load = () => {
    if (!profile) return;
    supabase.from("assessments").select("id,overall,tier,method,created_at").eq("user_id", profile.id).order("created_at").then(({ data }) => setRows(data ?? []));
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("user_id", profile.id).then(({ count }) => setCheckins(count ?? 0));
    supabase.from("quiz_results").select("quiz,score,total,created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10).then(({ data }) => setQuizzes(data ?? []));
  };
  useEffect(load, [profile]);

  const del = async (id: string) => { await supabase.from("assessments").delete().eq("id", id); toast.success("Deleted"); load(); };
  const max = 100;
  const first = rows[0]?.overall, last = rows[rows.length - 1]?.overall;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-extrabold">Progress</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl glass p-5"><p className="text-sm text-muted-foreground">Change</p><p className="font-display text-3xl text-primary">{rows.length > 1 ? `${last - first >= 0 ? "+" : ""}${last - first}%` : "-"}</p></div>
        <div className="rounded-2xl glass p-5"><p className="text-sm text-muted-foreground">Check-ins</p><p className="font-display text-3xl">{checkins}</p></div>
        <div className="rounded-2xl glass p-5"><p className="text-sm text-muted-foreground">Assessments</p><p className="font-display text-3xl">{rows.length}</p></div>
      </div>
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-bold">Score history</h2>
        {rows.length ? (
          <div className="flex h-48 items-end gap-2">
            {rows.map((r) => <div key={r.id} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs">{r.overall}</span><div className="w-full rounded-t-md bg-gradient-brand transition-all" style={{ height: `${(r.overall / max) * 100}%` }} /></div>)}
          </div>
        ) : <p className="text-muted-foreground">No assessments yet.</p>}
      </div>
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-3 font-bold">Your saved results <span className="text-xs font-normal text-muted-foreground">(you control your data)</span></h2>
        <div className="space-y-2">{rows.slice().reverse().map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
            <span>{new Date(r.created_at).toLocaleDateString()} · {r.method} · <b>{r.overall}%</b> {r.tier}</span>
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(r.id)}><Trash2 /></Button>
          </div>
        ))}</div>
      </div>
      {!!quizzes.length && <div className="rounded-2xl glass p-6"><h2 className="mb-3 font-bold">Recent quizzes</h2>{quizzes.map((q) => <p key={q.created_at} className="text-sm">{q.quiz}: {q.score}/{q.total}</p>)}</div>}
    </div>
  );
}
