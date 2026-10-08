import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Clock, ShieldAlert } from "lucide-react";
import { GUIDES, SAFETY_NOTE } from "@/lib/content";
import { seo } from "@/lib/seo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/guides")({
  head: () => seo("Guides", "Safe, science-based lookmaxing guides: mewing, jawline, skincare, posture, physique, hair, style, sleep and mindset."),
  component: Guides,
});

const AREAS = ["All", "Face", "Skin", "Body", "Hair", "Style", "Mind"] as const;

function Guides() {
  const child = useMatch({ from: "/guides/$slug", shouldThrow: false });
  const { profile } = useAuth();
  const [area, setArea] = useState<(typeof AREAS)[number]>("All");
  if (child) return <Outlet />;
  const list = GUIDES.filter((g) => area === "All" || g.area === area);
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-extrabold">Guides</h1>
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 p-4 text-sm"><ShieldAlert className="size-5 shrink-0 text-destructive" />{SAFETY_NOTE}</div>
      <div className="flex flex-wrap gap-2">{AREAS.map((a) => <button key={a} onClick={() => setArea(a)} className={`rounded-full px-4 py-1.5 text-sm ${area === a ? "bg-primary text-primary-foreground" : "glass"}`}>{a}</button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g, i) => (
          <Link key={g.slug} to="/guides/$slug" params={{ slug: g.slug }} style={{ animationDelay: `${i * 50}ms` }} className="group animate-rise rounded-2xl glass p-6 transition hover:-translate-y-1 hover:shadow-glow">
            <div className="mb-3 flex items-center justify-between text-xs"><span className="rounded-full bg-secondary px-2 py-0.5">{g.area}</span>{g.pro && !profile?.is_pro && <span className="flex items-center gap-1 text-gold"><Lock className="size-3" />MixMax</span>}</div>
            <h3 className="text-lg font-bold">{g.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.intro}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{g.weeks}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
