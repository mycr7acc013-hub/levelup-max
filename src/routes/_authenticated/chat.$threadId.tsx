import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import { toast } from "sonner";
import { Plus, Trash2, Zap, MessageSquare, ImagePlus, ArrowRight, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputAttachments, PromptInputAttachment, usePromptInputAttachments } from "@/components/ai-elements/prompt-input";


function AttachButton() {
  const a = usePromptInputAttachments();
  return <button type="button" aria-label="Attach image" onClick={() => a.openFileDialog()} className="grid size-8 place-items-center rounded-full hover:bg-secondary"><ImagePlus className="size-4" /></button>;
}

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => seo("LevelUp AI", "Chat with LevelUp AI, your personal glow-up coach."),
  component: ChatPage,
});

type Thread = { id: string; title: string };

function ChatPage() {
  const { threadId } = Route.useParams();
  const { session } = useAuth();
  const nav = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase.from("chat_threads").select("id,title").order("updated_at", { ascending: false });
    setThreads(data ?? []);
  }, []);

  useEffect(() => { void loadThreads(); }, [loadThreads, threadId]);
  useEffect(() => {
    setInitial(null);
    supabase.from("chat_messages").select("message").eq("thread_id", threadId).order("created_at").then(({ data, error }) => {
      if (error) toast.error("Couldn't load chat");
      setInitial((data ?? []).map((r) => r.message as unknown as UIMessage));
    });
  }, [threadId]);

  const newChat = async () => {
    if (!session) return;
    const { data } = await supabase.from("chat_threads").insert({ user_id: session.user.id }).select("id").single();
    if (data) nav({ to: "/chat/$threadId", params: { threadId: data.id } });
  };
  const del = async (id: string) => {
    await supabase.from("chat_threads").delete().eq("id", id);
    if (id === threadId) nav({ to: "/chat" }); else void loadThreads();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl gap-4 px-2 py-4 md:px-4">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-2xl glass p-3 md:flex">
        <Button variant="hero" onClick={newChat}><Plus />New chat</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <div key={t.id} className={`group flex items-center gap-1 rounded-lg ${t.id === threadId ? "bg-secondary" : "hover:bg-secondary/60"}`}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex flex-1 items-center gap-2 truncate px-3 py-2 text-sm"><MessageSquare className="size-3.5 shrink-0" /><span className="truncate">{t.title}</span></Link>
              <button aria-label="Delete chat" onClick={() => del(t.id)} className="px-2 opacity-0 group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl glass">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-gradient-brand text-primary-foreground"><Zap className="size-4" /></span><div><p className="text-sm font-bold">LevelUp AI</p><p className="text-xs text-muted-foreground">Your glow-up coach</p></div></div>
          <Button variant="glass" size="sm" className="md:hidden" onClick={newChat}><Plus />New</Button>
        </div>
        {initial === null ? <div className="grid flex-1 place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          : <ChatWindow key={threadId} threadId={threadId} initial={initial} token={session?.access_token ?? ""} onDone={loadThreads} />}
      </section>
    </div>
  );
}

const STARTERS = ["How am I progressing?", "Build my plan for today (45 min)", "Rate my outfit (attach a photo)", "Take me to the face scan", "Build me a 30-day jawline plan", "What can MixMax Studio do?"];

function ChatWindow({ threadId, initial, token, onDone }: { threadId: string; initial: UIMessage[]; token: string; onDone: () => void }) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { threadId }, headers: { Authorization: `Bearer ${token}` } }), [threadId, token]);
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onFinish: () => { onDone(); setTimeout(() => ref.current?.focus(), 0); },
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { ref.current?.focus(); }, []);

  const send = (text: string, files: FileUIPart[] = []) => {
    if ((!text.trim() && !files.length) || busy) return;
    void sendMessage(files.length ? { text: text || "What do you think of this?", files } : { text });
    setInput("");
    ref.current?.focus();
  };

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState title="Hey, I'm LevelUp AI" description="Ask me anything: glow-ups, training, skincare, style, or just chat.">
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-secondary">{s}</button>)}</div>
            </ConversationEmptyState>
          ) : messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                {m.parts.map((p, i) => p.type === "file" && p.mediaType?.startsWith("image/") ? <img key={i} src={p.url} alt="Attachment" className="max-h-64 rounded-xl" />
                  : p.type === "tool-navigate" && p.state === "output-available" ? <Link key={i} to={(p.output as { path: string }).path} className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105">{(p.output as { label: string }).label}<ArrowRight className="size-4" /></Link>
                  : p.type.startsWith("tool-") && p.type !== "tool-navigate" ? <span key={i} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"><Wrench className="size-3" />{"state" in p && p.state === "output-available" ? "Checked" : "Checking"} {p.type.slice(5).replace(/_/g, " ")}</span>
                  : p.type === "text" ? (m.role === "user" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : <MessageResponse key={i}>{p.text}</MessageResponse>)
                  : p.type === "reasoning" && p.text ? <details key={i} className="text-xs text-muted-foreground"><summary className="cursor-pointer">Thinking…</summary><p className="whitespace-pre-wrap">{p.text}</p></details> : null)}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <div className="flex gap-1 px-2"><span className="size-2 animate-bounce rounded-full bg-primary" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" /></div>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3">
        <PromptInput accept="image/*" multiple maxFiles={4} maxFileSize={6_000_000} onError={(e) => toast.error(e.message)} onSubmit={(msg) => (busy ? stop() : send(msg.text, msg.files))}>
          <PromptInputAttachments>{(f) => <PromptInputAttachment data={f} />}</PromptInputAttachments>
          <PromptInputBody>
            <PromptInputTextarea ref={ref} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message LevelUp AI…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-between">
            <AttachButton />
            <PromptInputSubmit status={status}  />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
