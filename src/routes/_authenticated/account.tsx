import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => seo("Account", "Manage your LevelUp profile, MixMax plan and subscription."),
  component: Account,
});

function Account() {
  const { session, profile, refresh } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? "");
  const saveName = async () => {
    if (!session) return;
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) }).eq("id", session.user.id);
    if (error) toast.error("Couldn't save"); else { toast.success("Saved"); await refresh(); }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-extrabold">Account</h1>
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><User className="size-4" />Profile</h2>
        <p className="mb-3 text-sm text-muted-foreground">{session?.user.email}</p>
        <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" /><Button variant="hero" onClick={saveName}>Save</Button></div>
      </div>
      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 flex items-center gap-2 font-bold"><Crown className="size-4 text-gold" />Plan</h2>
        {profile?.is_pro ? (
          <>
            <p>You're on <b className="text-gold">MixMax</b> ($5.00/month).</p>
            <p className="mt-1 text-sm text-muted-foreground">You can cancel anytime. You keep MixMax until the end of the month you've paid for, and you won't be charged again.</p>
            <Button variant="glass" className="mt-4" onClick={() => toast.info("Subscription management opens here once payments are switched on.")}>Manage or cancel subscription</Button>
          </>
        ) : (
          <>
            <p>You're on the <b>Free</b> plan.</p>
            <Button asChild variant="hero" className="mt-4"><Link to="/pricing">See MixMax, $5.00/month</Link></Button>
          </>
        )}
      </div>
    </div>
  );
}
