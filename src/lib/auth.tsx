import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AuthCtx = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};
const Ctx = createContext<AuthCtx>({ session: null, profile: null, isAdmin: false, loading: true, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) { setProfile(null); setIsAdmin(false); return; }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(p ?? null);
    setIsAdmin(!!r?.some((x) => x.role === "admin"));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setTimeout(() => {
        void loadProfile(s?.user.id);
        if (event === "SIGNED_IN" && s) {
          void supabase.from("activity_log").insert({ user_id: s.user.id, event: "login", detail: s.user.email ?? "" });
          void supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", s.user.id);
        }
      }, 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  return (
    <Ctx.Provider value={{ session, profile, isAdmin, loading, refresh: () => loadProfile(session?.user.id) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
