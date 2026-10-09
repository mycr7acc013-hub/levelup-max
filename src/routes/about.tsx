import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About B&A Co.", "LevelUp is owned by B&A Co., founded by Ammar Alnasseh and Benjamin Stewart."),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      <h1 className="text-5xl font-extrabold">Built by <span className="text-gradient">B&A Co.</span></h1>
      <p className="text-lg text-muted-foreground">LevelUp is owned and operated by B&A Co. We built it to give everyone a safe, smart and motivating way to become the best version of themselves: face, body, style and mind.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {([["Ammar Alnasseh", "Co-founder"], ["Benjamin Stewart", "Co-founder"]] as const).map(([n, r]) => (
          <div key={n} className="animate-rise rounded-2xl glass p-6"><div className="mb-3 grid size-14 place-items-center rounded-full bg-gradient-brand font-display text-xl font-bold text-primary-foreground">{n.charAt(0)}</div><h3 className="text-xl font-bold">{n}</h3><p className="text-sm text-muted-foreground">{r}, B&A Co.</p></div>
        ))}
      </div>
      <div className="flex gap-3 rounded-2xl border border-primary/30 p-6"><Heart className="size-6 shrink-0 text-primary" /><p>Props and a huge thank-you to every member of the LevelUp community, and to everyone who keeps showing up for themselves every day.</p></div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <h2 className="text-lg font-bold text-foreground">Safety & privacy</h2>
        <p>LevelUp is general wellness guidance, not medical advice. For safety and moderation, account activity, including AI chat messages, is recorded and can be reviewed by B&A Co. Photos used for scans are never stored.</p>
      </div>
    </div>
  );
}
