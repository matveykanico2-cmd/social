"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Radio, Send, Square } from "lucide-react";
import { api, timeAgo, useApi } from "@/lib/client";
import type { UserLite } from "@/lib/types";
import { Avatar, PrimaryButton } from "@/components/ui";

type Message = { id: number; text: string; createdAt: number; user: UserLite };
type Room = { stream: { id: number; title: string; description: string; host: UserLite; viewerCount: number; viewers: UserLite[]; isHost: boolean; status: string }; messages: Message[] };

export default function LiveRoom() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [text, setText] = useState("");
  const { data, reload } = useApi<Room>(`/api/live/${params.id}`);
  useEffect(() => { const timer = window.setInterval(() => reload(), 3000); return () => window.clearInterval(timer); }, [reload]);
  const end = async () => { await api(`/api/live/${params.id}`, { method: "PATCH", body: { action: "end" } }); reload(); };
  const send = async (event: React.FormEvent) => { event.preventDefault(); const message = text.trim(); if (!message) return; setText(""); await api(`/api/live/${params.id}`, { method: "POST", body: { text: message } }); reload(); };
  if (!data) return <main className="p-8 text-muted">Loading live room…</main>;
  const s = data.stream;
  return <main className="mx-auto max-w-[1100px] px-4 py-8 md:px-8"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="overflow-hidden rounded-3xl border border-border bg-[#111827] text-white shadow-xl"><div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-700 to-orange-500"><Radio size={56} className="animate-pulse" /></div><div className="p-5"><div className="flex items-start gap-3"><Avatar src={s.host.avatar} size={48} /><div className="min-w-0 flex-1"><h1 className="text-xl font-bold">{s.title}</h1><p className="text-white/70">@{s.host.username} · {s.description}</p><div className="mt-2 flex items-center gap-1 text-sm text-white/70"><Eye size={15} />{s.viewerCount} watching · {s.status === "live" ? "Live now" : "Ended"}</div></div>{s.isHost && s.status === "live" && <PrimaryButton onClick={() => void end()}><span className="flex items-center gap-2"><Square size={15} />End</span></PrimaryButton>}</div>{s.status !== "live" && <button onClick={() => router.push("/live")} className="mt-5 text-sm text-white/70 underline">Back to live</button>}</div></section><aside className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-elevated"><div className="border-b border-border px-4 py-3"><h2 className="font-bold">Live chat</h2><p className="text-xs text-muted">Messages are visible to everyone in this room.</p></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{data.messages.map((message) => <div key={message.id} className="flex gap-2"><Avatar src={message.user.avatar} size={30} /><div className="min-w-0"><div className="text-xs font-semibold">@{message.user.username} <span className="font-normal text-muted">· {timeAgo(message.createdAt)}</span></div><p className="break-words text-sm">{message.text}</p></div></div>)}{!data.messages.length && <p className="py-10 text-center text-sm text-muted">Start the conversation.</p>}</div>{s.status === "live" && <form onSubmit={(event) => void send(event)} className="flex gap-2 border-t border-border p-3"><input value={text} onChange={(event) => setText(event.target.value)} maxLength={500} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl bg-field px-3 py-2 text-sm outline-none" /><button type="submit" aria-label="Send live message" className="rounded-xl bg-link p-2 text-white"><Send size={17} /></button></form>}</aside></div></main>;
}
