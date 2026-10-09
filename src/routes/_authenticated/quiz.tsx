import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QUIZZES, type Quiz } from "@/lib/content";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { addXp, logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => seo("Quizzes & Exams", "Test your lookmaxing knowledge and earn XP."),
  component: QuizPage,
});

function QuizPage() {
  const { profile } = useAuth();
  const [active, setActive] = useState<Quiz | null>(null);
  if (active) return <Runner quiz={active} onExit={() => setActive(null)} />;
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-extrabold">Quizzes & Exams</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {QUIZZES.map((q) => {
          const locked = q.pro && !profile?.is_pro;
          return (
            <div key={q.slug} className="space-y-3 rounded-2xl glass p-6">
              <h3 className="text-lg font-bold">{q.title}</h3>
              <p className="text-sm text-muted-foreground">{q.questions.length} questions · up to {q.questions.length * 10} XP</p>
              {locked ? <Button asChild variant="glass" className="w-full"><Link to="/pricing"><Lock />MixMax</Link></Button> : <Button variant="hero" className="w-full" onClick={() => setActive(q)}>Start</Button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Runner({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = quiz.questions[i]!;

  const next = async () => {
    const s = score + (picked === q.correct ? 1 : 0);
    setScore(s);
    setPicked(null);
    if (i + 1 < quiz.questions.length) return setI(i + 1);
    setFinished(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from("quiz_results").insert({ user_id: data.user.id, quiz: quiz.slug, score: s, total: quiz.questions.length });
    await addXp(s * 10);
    await logActivity("quiz", `${quiz.title}: ${s}/${quiz.questions.length}`);
  };

  if (finished) return (
    <div className="mx-auto max-w-xl animate-rise space-y-4 px-4 py-16 text-center">
      <Trophy className="mx-auto size-14 text-gold" />
      <h1 className="text-4xl font-extrabold">{score}/{quiz.questions.length}</h1>
      <p className="text-muted-foreground">+{score * 10} XP earned</p>
      <Button variant="hero" onClick={onExit}>Back to quizzes</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Progress value={(i / quiz.questions.length) * 100} />
      <p className="text-sm text-muted-foreground">Question {i + 1} of {quiz.questions.length}</p>
      <h2 className="text-2xl font-bold">{q.q}</h2>
      <div className="space-y-2">
        {q.a.map((a, idx) => {
          const state = picked === null ? "" : idx === q.correct ? "border-primary bg-primary/10" : idx === picked ? "border-destructive bg-destructive/10" : "opacity-60";
          return <button key={a} disabled={picked !== null} onClick={() => setPicked(idx)} className={`w-full rounded-xl border border-border p-4 text-left transition hover:bg-secondary ${state}`}>{a}</button>;
        })}
      </div>
      {picked !== null && <div className="animate-rise space-y-3"><p className="text-sm text-muted-foreground">{q.why}</p><Button variant="hero" onClick={next}>{i + 1 < quiz.questions.length ? "Next" : "Finish"}</Button></div>}
    </div>
  );
}
