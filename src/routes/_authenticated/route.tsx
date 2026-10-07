import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Ban } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Gate,
});

function Gate() {
  const { session, profile, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !session) nav({ to: "/auth" }); }, [loading, session, nav]);

  if (loading || !session) return <div className="grid min-h-[60vh] place-items-center"><div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (profile?.banned_until && new Date(profile.banned_until) > new Date()) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Ban className="mx-auto mb-4 size-12 text-destructive" />
        <h1 className="text-2xl font-bold">Account suspended</h1>
        <p className="mt-2 text-muted-foreground">Suspended until {new Date(profile.banned_until).toLocaleString()}.</p>
        {profile.ban_reason && <p className="mt-2 text-sm">Reason: {profile.ban_reason}</p>}
      </div>
    );
  }
  return <Outlet />;
}
