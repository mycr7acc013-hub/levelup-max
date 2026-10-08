import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => seo("LevelUp AI", "Chat with LevelUp AI, your personal glow-up coach."),
  component: ChatIndex,
});

function ChatIndex() {
  const { session } = useAuth();
  const nav = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (!session || started.current) return;
    started.current = true;
    (async () => {
      const { data } = await supabase.from("chat_threads").select("id").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      let id = data?.id;
      if (!id) {
        const { data: t } = await supabase.from("chat_threads").insert({ user_id: session.user.id }).select("id").single();
        id = t?.id;
      }
      if (id) nav({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
    })();
  }, [session, nav]);
  return <div className="grid min-h-[60vh] place-items-center"><div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
}
