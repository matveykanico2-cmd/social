"use client";

import { useRef, useState } from "react";
import { Bot, Copy, ImagePlus, Plus, Power, Trash2 } from "lucide-react";
import { api, useApi } from "@/lib/client";
import { Avatar, Modal, PrimaryButton } from "@/components/ui";

type BotItem = { id: number; username: string; name: string; description: string; tokenHint: string; active: boolean; avatar: string | null };

function CreateBot({ close, reload }: { close: () => void; reload: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", username: "", description: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (avatar) body.append("avatar", avatar);
      const result = await api<{ bot: { token: string } }>("/api/bots", { method: "POST", body });
      setToken(result.bot.token);
      reload();
    } finally { setBusy(false); }
  };
  return <Modal onClose={close} showClose={false} className="w-[480px] max-w-full"><div className="p-5">{token ? <><h2 className="text-lg font-bold">Bot created</h2><p className="mt-2 text-sm text-muted">Copy this token now. It will not be shown again.</p><div className="mt-4 flex items-center gap-2 rounded-xl bg-field p-3 text-xs"><code className="min-w-0 flex-1 break-all">{token}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(token)} aria-label="Copy token"><Copy size={17} /></button></div><PrimaryButton type="button" className="mt-4 w-full" onClick={close}>Done</PrimaryButton></> : <form className="space-y-3" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Create bot</h2><button type="button" onClick={close} className="text-xl text-muted">×</button></div><div className="flex items-center gap-3 rounded-xl bg-field p-3"><Avatar src={preview} size={56} /><div><button type="button" onClick={() => file.current?.click()} className="flex items-center gap-2 text-sm font-semibold text-link"><ImagePlus size={16} />Add bot avatar</button><p className="mt-1 text-xs text-muted">PNG or JPG, up to 5 MB</p></div><input ref={file} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const picked = event.target.files?.[0] ?? null; setAvatar(picked); setPreview(picked ? URL.createObjectURL(picked) : null); }} /></div><input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bot name" className="w-full rounded-xl bg-field px-3 py-3 outline-none" /><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username slug (optional)" className="w-full rounded-xl bg-field px-3 py-3 outline-none" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-20 w-full resize-none rounded-xl bg-field px-3 py-3 outline-none" /><PrimaryButton disabled={busy} className="w-full">{busy ? "Creating…" : "Create bot"}</PrimaryButton></form>}</div></Modal>;
}

export default function BotsPage() {
  const { data, reload } = useApi<{ bots: BotItem[] }>("/api/bots");
  const [create, setCreate] = useState(false);
  const [command, setCommand] = useState({ bot: 0, name: "/help", response: "" });
  const saveCommand = async () => { if (!command.bot || !command.response.trim()) return; await api(`/api/bots/${command.bot}/commands`, { method: "POST", body: { command: command.name, response: command.response } }); setCommand({ ...command, response: "" }); };
  const toggle = async (bot: BotItem) => { await api(`/api/bots/${bot.id}`, { method: "PATCH", body: { active: !bot.active } }); reload(); };
  const uploadAvatar = async (bot: BotItem, file: File | undefined) => { if (!file) return; const body = new FormData(); body.append("avatar", file); await api(`/api/bots/${bot.id}`, { method: "PATCH", body }); reload(); };
  const remove = async (bot: BotItem) => { if (window.confirm(`Delete @${bot.username}?`)) { await api(`/api/bots/${bot.id}`, { method: "DELETE" }); reload(); } };
  return <main className="mx-auto max-w-[900px] px-4 py-8 md:px-8"><div className="vk-card mb-5 flex items-center justify-between gap-3 p-5"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><Bot className="text-link" />Bots</h1><p className="mt-1 text-muted">Automate replies in your shalter chats.</p></div><PrimaryButton type="button" onClick={() => setCreate(true)}><span className="flex items-center gap-2"><Plus size={17} />Create bot</span></PrimaryButton></div><div className="grid gap-4 md:grid-cols-2">{data?.bots.map((bot) => <article key={bot.id} className="vk-card p-5"><div className="flex items-start gap-3"><Avatar src={bot.avatar} size={48} /><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{bot.name}</h2><p className="truncate text-sm text-muted">@{bot.username}</p><label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-link"><ImagePlus size={13} />Change avatar<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAvatar(bot, event.target.files?.[0])} /></label></div><span className={`rounded-full px-2 py-1 text-xs ${bot.active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted"}`}>{bot.active ? "Active" : "Paused"}</span></div><p className="mt-4 min-h-10 text-sm text-muted">{bot.description || "No description"}</p><p className="mt-3 rounded-lg bg-field p-2 font-mono text-xs text-muted">Token: {bot.tokenHint}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void toggle(bot)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-field px-3 py-2 text-sm font-semibold"><Power size={15} />{bot.active ? "Pause" : "Enable"}</button><button type="button" onClick={() => void remove(bot)} className="rounded-xl border border-border p-2 text-danger" aria-label="Delete bot"><Trash2 size={16} /></button></div><div className="mt-4 border-t border-border pt-4"><div className="mb-2 text-sm font-semibold">Add command</div><div className="flex gap-2"><input value={command.bot === bot.id ? command.name : "/help"} onChange={(e) => setCommand({ ...command, bot: bot.id, name: e.target.value })} placeholder="/help" className="w-24 rounded-lg bg-field px-2 py-2 text-sm outline-none" /><input value={command.bot === bot.id ? command.response : ""} onChange={(e) => setCommand({ ...command, bot: bot.id, response: e.target.value })} placeholder="Reply text" className="min-w-0 flex-1 rounded-lg bg-field px-2 py-2 text-sm outline-none" /><button type="button" onClick={() => void saveCommand()} className="rounded-lg bg-link px-3 text-sm font-semibold text-white">Save</button></div></div></article>)}</div>{!data?.bots.length && <div className="vk-card border-dashed p-12 text-center text-muted">No bots yet. Create your first bot and choose its avatar.</div>}{create && <CreateBot close={() => setCreate(false)} reload={reload} />}</main>;
}
