import { supabase } from "@/integrations/supabase/client";

import { isFlagged } from "./flag";
export { isFlagged };

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
