import { supabase } from "@/integrations/supabase/client";

const BAD = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "retard", "kys", "kill yourself", "slut", "whore", "dick", "pussy", "rape"];

export function isFlagged(text: string) {
  const t = text.toLowerCase();
  return BAD.some((w) => t.includes(w));
}

export async function logActivity(event: string, detail = "") {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("activity_log").insert({
    user_id: data.user.id,
    event,
    detail: detail.slice(0, 2000),
    flagged: isFlagged(detail),
  });
}

export async function addXp(amount: number) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { data: p } = await supabase.from("profiles").select("xp").eq("id", data.user.id).maybeSingle();
  await supabase.from("profiles").update({ xp: (p?.xp ?? 0) + amount }).eq("id", data.user.id);
}
