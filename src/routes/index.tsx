import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanFace, Bot, CalendarCheck, GraduationCap, Trophy, LineChart, Crown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";
import { TIERS } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LevelUp: Lookmaxing, Glow-up & AI Coach | B&A Co." },
      { name: "description", content: "Assess your looks, scan your face with AI, follow daily lookmaxing plans and climb from Starter to Chadlite and beyond." },
      { property: "og:title", content: "LevelUp: Your AI glow-up coach" },
      { property: "og:description", content: "AI face scan, daily plans, quizzes and a ChatGPT-style coach. By B&A Co." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: ScanFace, title: "AI Face Scan", text: "Snap a photo and get % scores for jaw, skin, eyes, symmetry and more." },
  { icon: Bot, title: "LevelUp AI", text: "A ChatGPT-style coach that knows the site and talks like a real person." },
  { icon: CalendarCheck, title: "Daily Plans", text: "Tasks with timings built from your weakest areas. Check in every night." },
  { icon: GraduationCap, title: "Quizzes & Exams", text: "Test what you know about skin, training and aesthetics. Earn XP." },
  { icon: Trophy, title: "Tier Ranking", text: "Climb from Starter to Chadlite, Chad and Elite as your scores rise." },
  { icon: LineChart, title: "Progress Tracking", text: "Charts of every assessment, streaks and XP, so you can see the glow-up." },
];

function Index() {
  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-20 lg:grid-cols-2 lg:pt-20">
        <div className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="space-y-6 animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground"><span className="size-2 animate-pulse rounded-full bg-primary" />by B&A Co.</span>
          <h1 className="text-5xl font-extrabold leading-[1.05] md:text-7xl">Become your <span className="text-gradient">highest level.</span></h1>
          <p className="max-w-lg text-lg text-muted-foreground">LevelUp scans, rates and coaches you, then builds a daily lookmaxing plan for your face, body, skin, style and mind.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl"><Link to="/assess">Start free assessment</Link></Button>
            <Button asChild variant="glass" size="xl"><Link to="/chat">Talk to LevelUp AI</Link></Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {TIERS.map((t, i) => <span key={t.name} style={{ animationDelay: `${i * 80}ms` }} className={`animate-rise rounded-full border border-border px-3 py-1 text-xs ${t.color}`}>{t.name}</span>)}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md animate-float">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-brand opacity-25 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border">
            <img src={hero} alt="Face scan preview" width={1024} height={1280} className="w-full" />
            <div className="absolute inset-x-0 h-0.5 animate-scan bg-primary shadow-glow" />
            <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Overall</span><span className="font-display text-2xl text-primary">74%</span></div>
              <div className="mt-1 text-xs text-gold">Tier: Chadlite</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <h2 className="mb-8 text-3xl font-bold md:text-4xl">Everything for your glow-up</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{ animationDelay: `${i * 70}ms` }} className="group animate-rise rounded-2xl glass p-6 transition hover:-translate-y-1 hover:shadow-glow">
              <f.icon className="mb-4 size-8 text-primary transition group-hover:scale-110" />
              <h3 className="mb-1 text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 p-10 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-brand opacity-10" />
          <Crown className="mx-auto mb-3 size-10 text-gold" />
          <h2 className="text-3xl font-bold md:text-4xl">LevelUp <span className="text-gold">MixMax</span></h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Unlimited AI coaching and photo scans, pro guides, advanced exams and deeper stats, all for $7.50/month.</p>
          <Button asChild variant="hero" size="xl" className="mt-6"><Link to="/pricing">See MixMax</Link></Button>
        </div>
      </section>

      <section className="mx-auto mt-16 flex max-w-3xl items-start gap-3 px-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>Safe methods only. We never teach bone smashing or anything harmful. Photo scans need your consent and photos are never stored. Only the scores are saved.</p>
      </section>
    </div>
  );
}
