import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Zap, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assess", label: "Assess" },
  { to: "/schedule", label: "Daily Plan" },
  { to: "/guides", label: "Guides" },
  { to: "/quiz", label: "Quizzes" },
  { to: "/progress", label: "Progress" },
  { to: "/chat", label: "LevelUp AI" },
  { to: "/studio", label: "Studio ✦" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-brand text-primary-foreground shadow-glow"><Zap className="size-4" /></span>
      Level<span className="text-gradient">Up</span>
    </Link>
  );
}

export function SiteNav() {
  const { session, profile, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/" }); };

  return (
    <header className="sticky top-0 z-40 glass border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground" activeProps={{ className: "bg-secondary !text-foreground" }}>{l.label}</Link>
          ))}
          {isAdmin && <Link to="/admin" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-gold"><Shield className="size-3.5" />Admin</Link>}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {profile?.is_pro ? (
            <span className="flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1 text-xs text-gold"><Crown className="size-3" />MixMax</span>
          ) : (
            <Button asChild variant="hero" size="sm" className="rounded-full"><Link to="/pricing">Get MixMax</Link></Button>
          )}
          {session ? <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button> : <Button asChild variant="glass" size="sm"><Link to="/auth">Sign in</Link></Button>}
        </div>
        <button className="lg:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
          {LINKS.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">{l.label}</Link>)}
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-gold">Admin</Link>}
          <Link to="/pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-primary">MixMax</Link>
          {session ? <button onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm">Sign out</button> : <Link to="/auth" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm">Sign in</Link>}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3">
        <div className="space-y-2"><Logo /><p className="text-sm text-muted-foreground">Owned and operated by <span className="text-foreground">B&A Co.</span></p></div>
        <div className="text-sm text-muted-foreground">Created by <span className="text-foreground">Ammar Alnasseh</span> & <span className="text-foreground">Benjamin Stewart</span>. Huge thanks to everyone leveling up with us.</div>
        <div className="flex gap-4 text-sm text-muted-foreground md:justify-end"><Link to="/about">About</Link><Link to="/pricing">MixMax</Link><Link to="/guides">Guides</Link></div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} B&A Co. All rights reserved. LevelUp gives general wellness info, not medical advice.</p>
    </footer>
  );
}
