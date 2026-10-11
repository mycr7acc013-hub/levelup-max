import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Sparkles, Film, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { seo } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => seo("LevelUp MixMax", "Upgrade to LevelUp MixMax for $5.00/month: AI Studio for images and 15-second videos, unlimited AI, scans, pro guides. Cancel anytime."),
  component: Pricing,
});

const FREE = ["Manual assessment", "1 AI photo scan per week (front + side)", "25 LevelUp AI messages a day", "Photo uploads in chat", "Core guides", "2 quizzes", "Daily plan & check-ins"];
const PRO = ["Everything in Free", "AI Studio: a 2nd AI that creates images", "AI Studio: 15-second AI videos from text or a photo", "Unlimited AI photo scans", "Unlimited LevelUp AI chat", "Pro guides: V-Taper, Hair Max, Style", "Advanced Aesthetics exam", "MixMax badge & gold tier glow", "Priority new features"];

function Pricing() {
  const { session, profile } = useAuth();
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-16">
      <div className="text-center animate-rise"><h1 className="text-5xl font-extrabold">Go <span className="text-gold">MixMax</span></h1><p className="mt-3 text-muted-foreground">Unlock the full potential of LevelUp. $5.00 a month, cancel anytime.</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl glass p-8">
          <h2 className="text-2xl font-bold">Free</h2><p className="mt-2 font-display text-4xl">$0</p>
          <ul className="mt-6 space-y-2 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />{f}</li>)}</ul>
          <Button asChild variant="glass" className="mt-8 w-full"><Link to={session ? "/dashboard" : "/auth"}>{session ? "Your current plan" : "Start free"}</Link></Button>
        </div>
        <div className="relative rounded-3xl border border-gold/50 p-8 shadow-glow transition hover:-translate-y-1">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-brand opacity-10" />
          <span className="absolute -top-3 right-6 rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-primary-foreground">Most popular</span>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Crown className="text-gold" />MixMax</h2>
          <p className="mt-2 font-display text-4xl">$5.00<span className="text-base text-muted-foreground">/month</span></p>
          <ul className="mt-6 space-y-2 text-sm">{PRO.map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-gold" />{f}</li>)}</ul>
          {profile?.is_pro ? <Button asChild variant="glass" className="mt-8 w-full"><Link to="/studio">You're MixMax ✨ Open Studio</Link></Button>
            : <Button variant="hero" className="mt-8 w-full" onClick={() => session ? toast.info("Checkout opens as soon as payments are switched on. Check back very soon!") : (window.location.href = "/auth")}>Upgrade to MixMax</Button>}
          <p className="mt-3 text-center text-xs text-muted-foreground">Cancel anytime from your Account page. You keep MixMax until the end of the month you paid for.</p>
        </div>
      </div>
      <div className="rounded-3xl glass p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="text-gold" />Included: LevelUp AI Studio</h2>
        <p className="mt-2 text-muted-foreground">A brand-new second AI, only for MixMax members. Your normal LevelUp AI coach stays too.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-5"><ImageIcon className="mb-2 text-primary" /><h3 className="font-bold">AI images</h3><p className="text-sm text-muted-foreground">Describe anything (appropriate) and watch it appear: outfit ideas, hairstyle concepts, posters, wallpapers, art.</p></div>
          <div className="rounded-2xl border border-border p-5"><Film className="mb-2 text-accent" /><h3 className="font-bold">15-second AI videos</h3><p className="text-sm text-muted-foreground">Turn a prompt or your own photo into a 15-second video with sound. Everything you make is saved to your gallery.</p></div>
        </div>
      </div>
    </div>
  );
}
