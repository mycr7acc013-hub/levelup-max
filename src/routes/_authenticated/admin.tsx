import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, Users, Activity, Flag, MessageSquare } from "lucide-react";
import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => seo("Admin", "B&A Co. moderation dashboard."),
  component: Admin,
});

type P = Tables<"profiles">;
type Log = Tables<"activity_log">;
const DURATIONS = [["1h", 1], ["24h", 24], ["3 days", 72], ["7 days", 168], ["30 days", 720], ["Permanent", 876000]] as const;

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<P[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tab, setTab] = useState<"users" | "activity" | "flagged">("activity");
  const [q, setQ] = useState("");
  const [chatUser, setChatUser] = useState<P | null>(null);

  const load = useCallback(async () => {
    const [{ data: u }, { data: l }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setUsers(u ?? []); setLogs(l ?? []);
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel("admin-log").on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (p) => {
      const row = p.new as Log; setLogs((x) => [row, ...x]);
      if (row.flagged) toast.warning("Flagged activity: " + (row.detail ?? "").slice(0, 60));
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <div className="mx-auto max-w-md px-4 py-24 text-center"><ShieldAlert className="mx-auto mb-3 size-10 text-destructive" /><h1 className="text-2xl font-bold">Admins only</h1></div>;

  const userById = (id: string) => users.find((u) => u.id === id);
  const ban = async (u: P, hours: number, reason: string) => {
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    const { error } = await supabase.from("profiles").update({ banned_until: until, ban_reason: reason || null }).eq("id", u.id);
    if (error) toast.error(error.message); else { toast.success(`Banned ${u.email}`); void load(); }
  };
  const unban = async (u: P) => { await supabase.from("profiles").update({ banned_until: null, ban_reason: null }).eq("id", u.id); toast.success("Unbanned"); void load(); };
  const togglePro = async (u: P) => { await supabase.from("profiles").update({ is_pro: !u.is_pro }).eq("id", u.id); void load(); };

  const shownLogs = logs.filter((l) => (tab !== "flagged" || l.flagged) && (!q || (l.detail ?? "").toLowerCase().includes(q.toLowerCase()) || userById(l.user_id)?.email?.toLowerCase().includes(q.toLowerCase())));
  const shownUsers = users.filter((u) => !q || u.email?.toLowerCase().includes(q.toLowerCase()) || u.display_name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-4xl font-extrabold">B&A Co. <span className="text-gold">Admin</span></h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card icon={Users} label="Users" v={users.length} />
        <Card icon={Activity} label="Active (24h)" v={users.filter((u) => u.last_seen && Date.now() - new Date(u.last_seen).getTime() < 86400000).length} />
        <Card icon={Flag} label="Flagged" v={logs.filter((l) => l.flagged).length} />
        <Card icon={ShieldAlert} label="MixMax members" v={users.filter((u) => u.is_pro).length} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["activity", "flagged", "users"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-primary text-primary-foreground" : "glass"}`}>{t}</button>)}
        <Input placeholder="Search email or text…" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto max-w-xs" />
      </div>
      {tab === "users" ? (
        <div className="space-y-2">{shownUsers.map((u) => <UserRow key={u.id} u={u} onBan={ban} onUnban={unban} onPro={togglePro} onChats={() => setChatUser(u)} />)}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl glass">
          {shownLogs.map((l) => (
            <div key={l.id} className={`grid gap-1 border-b border-border p-3 text-sm md:grid-cols-[160px_200px_120px_1fr] ${l.flagged ? "bg-destructive/10" : ""}`}>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              <span className="truncate">{userById(l.user_id)?.email ?? l.user_id.slice(0, 8)}</span>
              <span className="text-primary">{l.event}{l.flagged && " 🚩"}</span>
              <span className="break-words">{l.detail}</span>
            </div>
          ))}
          {!shownLogs.length && <p className="p-6 text-center text-muted-foreground">Nothing here yet.</p>}
        </div>
      )}
      <ChatViewer user={chatUser} onClose={() => setChatUser(null)} />
    </div>
  );
}

function Card({ icon: Icon, label, v }: { icon: typeof Users; label: string; v: number }) {
  return <div className="rounded-2xl glass p-5"><div className="flex justify-between text-sm text-muted-foreground">{label}<Icon className="size-4" /></div><div className="mt-1 font-display text-3xl">{v}</div></div>;
}

function UserRow({ u, onBan, onUnban, onPro, onChats }: { u: P; onBan: (u: P, h: number, r: string) => void; onUnban: (u: P) => void; onPro: (u: P) => void; onChats: () => void }) {
  const [dur, setDur] = useState("24");
  const [reason, setReason] = useState("");
  const banned = u.banned_until && new Date(u.banned_until) > new Date();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl glass p-4 text-sm">
      <div className="min-w-48 flex-1"><p className="font-semibold">{u.display_name} {u.is_pro && <span className="text-gold">· MixMax</span>}</p><p className="text-xs text-muted-foreground">{u.email} · joined {new Date(u.created_at).toLocaleDateString()} · {u.xp} XP</p>
        {banned && <p className="text-xs text-destructive">Banned until {new Date(u.banned_until!).toLocaleString()}</p>}</div>
      <Button size="sm" variant="glass" onClick={onChats}><MessageSquare />Chats</Button>
      <Button size="sm" variant="glass" onClick={() => onPro(u)}>{u.is_pro ? "Remove pro" : "Give pro"}</Button>
      {banned ? <Button size="sm" variant="secondary" onClick={() => onUnban(u)}>Unban</Button> : <>
        <Select value={dur} onValueChange={setDur}><SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger><SelectContent>{DURATIONS.map(([l, h]) => <SelectItem key={l} value={String(h)}>{l}</SelectItem>)}</SelectContent></Select>
        <Input className="h-8 w-40" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button size="sm" variant="destructive" onClick={() => onBan(u, Number(dur), reason)}>Ban</Button>
      </>}
    </div>
  );
}

function ChatViewer({ user, onClose }: { user: P | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<{ role: string; message: unknown; created_at: string }[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("role,message,created_at").eq("user_id", user.id).order("created_at").limit(500).then(({ data }) => setMsgs(data ?? []));
  }, [user]);
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Chats: {user?.email}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          {msgs.map((m, i) => {
            const text = ((m.message as UIMessage).parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");
            return <div key={i} className={`rounded-lg p-2 ${m.role === "user" ? "bg-secondary" : ""}`}><span className="text-xs text-muted-foreground">{m.role} · {new Date(m.created_at).toLocaleString()}</span><p className="whitespace-pre-wrap">{text}</p></div>;
          })}
          {!msgs.length && <p className="text-muted-foreground">No chats.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
