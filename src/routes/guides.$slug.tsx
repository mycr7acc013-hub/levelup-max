import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Lock, Clock, Timer } from "lucide-react";
import { GUIDES } from "@/lib/content";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const g = GUIDES.find((x) => x.slug === params.slug);
    if (!g) throw notFound();
    return g;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Guide"} | LevelUp` },
      { name: "description", content: loaderData?.intro ?? "LevelUp guide" },
      { property: "og:title", content: `${loaderData?.title ?? "Guide"} | LevelUp` },
      { property: "og:description", content: loaderData?.intro ?? "LevelUp guide" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const g = Route.useLoaderData();
  const { profile } = useAuth();
  const locked = g.pro && !profile?.is_pro;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link to="/guides" className="text-sm text-muted-foreground">← All guides</Link>
      <h1 className="text-4xl font-extrabold">{g.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Timer className="size-4" />{g.minutes >= 60 ? `${Math.round(g.minutes / 60)}h` : `${g.minutes} min`} a day</span><span className="flex items-center gap-1"><Clock className="size-4" />Results: {g.weeks}</span></div>
      <p className="text-lg">{g.intro}</p>
      {locked ? (
        <div className="rounded-2xl border border-gold/40 p-8 text-center">
          <Lock className="mx-auto mb-3 size-8 text-gold" />
          <p className="mb-4">This guide is part of LevelUp MixMax.</p>
          <Button asChild variant="hero"><Link to="/pricing">Unlock with MixMax</Link></Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {g.steps.map((s, i) => (
            <li key={s.name} style={{ animationDelay: `${i * 80}ms` }} className="flex animate-rise gap-4 rounded-2xl glass p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-brand font-bold text-primary-foreground">{i + 1}</span>
              <div className="flex-1"><div className="flex justify-between gap-2"><h3 className="font-bold">{s.name}</h3><span className="text-xs text-muted-foreground">{s.time}</span></div><p className="text-sm text-muted-foreground">{s.how}</p></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
