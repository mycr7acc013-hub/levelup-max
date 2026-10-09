import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Star, ScanFace, CalendarCheck, Bot, GraduationCap, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { tierFor, TIPS, SCORE_LABELS } from "@/lib/content";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => seo("Dashboard", "Your LevelUp stats, tier, streak and daily progress."),
  component: Dashboard,
});

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

function Dashboard() {
  const { profile } = useAuth();
  const now = useClock();
  const [latest, setLatest] = useState<{ overall: number; scores: Record<string, number> } | null>(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("assessments").select("overall,scores").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => data && setLatest({ overall: data.overall, scores: data.scores as Record<string, number> }));
  }, [profile]);

  const h = now.getHours();
  const greet = h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const tier = latest ? tierFor(latest.overall) : null;
  const level = Math.floor((profile?.xp ?? 0) / 100) + 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <div className="animate-rise">
        <p className="text-sm text-muted-foreground">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · <span className="font-mono">{now.toLocaleTimeString()}</span></p>
        <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">{greet}, <span className="text-gradient">{profile?.display_name ?? "legend"}</span></h1>
        <p className="mt-2 text-muted-foreground">Welcome back to LevelUp. Let's get one percent better today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Overall score" value={latest ? `${latest.overall}%` : "-"} sub={tier ? tier.name : "Take an assessment"} subClass={tier?.color ?? ""} />
        <Stat label="Streak" value={`${profile?.streak ?? 0} days`} icon={<Flame className="size-5 text-gold" />} />
        <Stat label="Level" value={`Lv ${level}`} sub={`${profile?.xp ?? 0} XP`} icon={<Star className="size-5 text-primary" />} />
        <Stat label="Plan" value={profile?.is_pro ? "MixMax" : "Free"} sub={profile?.is_pro ? "All features unlocked" : "Upgrade for more"} subClass={profile?.is_pro ? "text-gold" : ""} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl glass p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">Your breakdown</h2>
          {latest ? Object.entries(latest.scores).map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm"><span>{SCORE_LABELS[k] ?? k}</span><span className="text-muted-foreground">{v}%</span></div>
              <Progress value={v} />
            </div>
          )) : <p className="text-muted-foreground">No stats yet. <Link to="/assess" className="text-primary underline">Take your first assessment</Link>.</p>}
        </div>
        <div className="space-y-3">
          <QuickLink to="/assess" icon={ScanFace} title="Assess / Scan" />
          <QuickLink to="/schedule" icon={CalendarCheck} title="Today's plan & check-in" />
          <QuickLink to="/chat" icon={Bot} title="Ask LevelUp AI" />
          <QuickLink to="/quiz" icon={GraduationCap} title="Take a quiz" />
          <div className="flex gap-3 rounded-2xl border border-primary/30 p-4 text-sm"><Lightbulb className="size-5 shrink-0 text-primary" />{tip}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, subClass, icon }: { label: string; value: string; sub?: string | undefined; subClass?: string | undefined; icon?: React.ReactNode }) {
  return (
    <div className="animate-rise rounded-2xl glass p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">{label}{icon}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {sub && <div className={`text-xs ${subClass ?? "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function QuickLink({ to, icon: Icon, title }: { to: "/assess" | "/schedule" | "/chat" | "/quiz"; icon: typeof Bot; title: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl glass p-4 transition hover:-translate-y-0.5 hover:shadow-glow">
      <Icon className="size-5 text-primary" /><span className="font-medium">{title}</span>
    </Link>
  );
}
