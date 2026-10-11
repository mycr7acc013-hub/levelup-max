import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { seo } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => seo("LevelUp MixMax", "Upgrade to LevelUp MixMax for $5.00/month: unlimited AI, scans, pro guides and advanced exams."),
  component: Pricing,
});

const FREE = ["Manual assessment", "1 AI photo scan per week", "25 AI messages a day", "Core guides", "2 quizzes", "Daily plan & check-ins"];
const PRO = ["Everything in Free", "Unlimited AI photo scans", "Unlimited LevelUp AI chat", "Pro guides: V-Taper, Hair Max, Style", "Advanced Aesthetics exam", "MixMax badge & gold tier glow", "Priority new features"];

function Pricing() {
  const { session, profile } = useAuth();
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <div className="text-center"><h1 className="text-5xl font-extrabold">Go <span className="text-gold">MixMax</span></h1><p className="mt-3 text-muted-foreground">Unlock the full potential of LevelUp.</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl glass p-8">
          <h2 className="text-2xl font-bold">Free</h2><p className="mt-2 font-display text-4xl">$0</p>
          <ul className="mt-6 space-y-2 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 text-primary" />{f}</li>)}</ul>
          <Button asChild variant="glass" className="mt-8 w-full"><Link to={session ? "/dashboard" : "/auth"}>{session ? "Your current plan" : "Start free"}</Link></Button>
        </div>
        <div className="relative rounded-3xl border border-gold/50 p-8 shadow-glow">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-brand opacity-10" />
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Crown className="text-gold" />MixMax</h2>
          <p className="mt-2 font-display text-4xl">$5.00<span className="text-base text-muted-foreground">/month</span></p>
          <ul className="mt-6 space-y-2 text-sm">{PRO.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 text-gold" />{f}</li>)}</ul>
          {profile?.is_pro ? <Button variant="glass" className="mt-8 w-full" disabled>You're MixMax ✨</Button>
            : <Button variant="hero" className="mt-8 w-full" onClick={() => session ? toast.info("Checkout is being set up and will open very soon.") : (window.location.href = "/auth")}>Upgrade to MixMax</Button>}
          <p className="mt-3 text-center text-xs text-muted-foreground">Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
