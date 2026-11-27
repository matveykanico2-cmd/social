"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Search, Store, Trash2 } from "lucide-react";
import { api, timeAgo, useApi } from "@/lib/client";
import type { UserLite } from "@/lib/types";
import { useApp } from "@/components/app-context";
import { Avatar, PrimaryButton, SecondaryButton, Spinner } from "@/components/ui";

type Listing = { id: number; title: string; description: string; category: string; location: string; price: number; imageUrl: string | null; createdAt: number; seller: UserLite };
const categories = ["Other", "Electronics", "Home", "Clothing", "Vehicles", "Services", "Collectibles"];

export default function MarketplacePage() {
  const { me, toast } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [create, setCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const listings = useApi<{ listings: Listing[] }>(`/api/marketplace?q=${encodeURIComponent(q)}${category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}&v=${reloadKey}`);
  const orders = useApi<{ orders: { id: number; title: string; status: string; total: number; seller: string; buyer: string; rating: number | null }[] }>("/api/marketplace/orders");
  const refresh = () => setReloadKey((v) => v + 1);
  return <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
    <header className="mb-6 flex flex-wrap items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-link text-white"><Store size={26} /></span><div><h1 className="text-2xl font-bold">Marketplace</h1><p className="text-sm text-muted">Buy and sell in the Shalter community</p></div></div><PrimaryButton onClick={() => setCreate(true)}>Sell something</PrimaryButton></header>
    <div className="mb-5 flex flex-wrap gap-2"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-field px-3 py-2"><Search size={18} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings" className="min-w-0 flex-1 bg-transparent outline-none" /></label>{["All", ...categories].map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-2 text-sm font-semibold ${category === item ? "bg-fg text-bg" : "bg-field text-muted"}`}>{item}</button>)}</div>
    {listings.loading ? <div className="flex justify-center py-20"><Spinner /></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.data?.listings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border border-border bg-elevated shadow-sm"><div className="aspect-[4/3] bg-field">{listing.imageUrl ? <ListingImage src={listing.imageUrl} /> : <div className="flex h-full items-center justify-center text-muted"><Store size={42} /></div>}</div><div className="p-4"><div className="mb-1 flex items-start justify-between gap-2"><h2 className="font-bold">{listing.title}</h2><span className="shrink-0 font-bold text-link">{listing.price.toLocaleString()} ₽</span></div><p className="line-clamp-3 min-h-12 text-sm text-muted">{listing.description || "No description"}</p><div className="mt-3 flex items-center gap-2 text-xs text-muted"><Avatar src={listing.seller.avatar} size={24} /><Link href={`/${listing.seller.username}`} className="font-semibold hover:text-link">{listing.seller.name || listing.seller.username}</Link><span>· {timeAgo(listing.createdAt)}</span></div>{listing.location && <div className="mt-2 text-xs text-muted">{listing.location} · {listing.category}</div>}{listing.seller.id !== me.id && <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className="rounded-xl bg-link px-3 py-2 text-sm font-semibold text-white" onClick={async () => { const result = await api<{ id: number; conversationId?: number; existing?: boolean }>("/api/marketplace/orders", { method: "POST", body: { listingId: listing.id } }); toast(result.existing ? "Order already exists" : "Order created"); if (result.conversationId) router.push(`/direct/t/${result.conversationId}`); }}>Order</button><button type="button" className="rounded-xl bg-field px-3 py-2 text-sm font-semibold" onClick={async () => { const { id } = await api<{ id: number }>("/api/conversations", { body: { username: listing.seller.username } }); router.push(`/direct/t/${id}`); }}>Message</button></div>}{listing.seller.id === me.id && <button type="button" className="mt-3 flex items-center gap-1 text-xs font-semibold text-danger" onClick={async () => { await api(`/api/marketplace/${listing.id}`, { method: "DELETE" }); refresh(); }}><Trash2 size={14} />Remove listing</button>}</div></article>)}</div>}
    {!listings.loading && !listings.data?.listings.length && <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted">No listings found.</div>}
    {orders.data?.orders.length ? <section className="mt-8 rounded-2xl border border-border bg-elevated p-4"><h2 className="mb-3 text-lg font-bold">My orders</h2><div className="space-y-2">{orders.data.orders.map((order) => <div key={order.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-field px-3 py-3 text-sm"><span className="min-w-0 flex-1 truncate font-semibold">#{order.id} · {order.title}</span><span className="text-muted">{order.total.toLocaleString()} ₽</span><span className="rounded-full bg-link/10 px-2 py-1 text-xs font-semibold text-link">{order.status}</span></div>)}</div></section> : null}
    {create && <CreateListing onClose={() => setCreate(false)} onCreated={() => { setCreate(false); refresh(); toast("Listing published"); }} />}
  </div>;
}

function ListingImage({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-full w-full object-cover" />;
}

function CreateListing({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Other", location: "", price: "" });
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.set(key, value)); if (image) body.set("image", image); try { await api("/api/marketplace", { body }); onCreated(); } finally { setBusy(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={(e) => void submit(e)} className="w-full max-w-lg rounded-2xl bg-elevated p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Create listing</h2><button type="button" onClick={onClose} aria-label="Close">×</button></div><input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What are you selling?" className="mb-2 w-full rounded-xl bg-field px-3 py-2 outline-none" /><textarea maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="mb-2 min-h-24 w-full rounded-xl bg-field px-3 py-2 outline-none" /><div className="grid gap-2 sm:grid-cols-2"><input required min="0" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price in ₽" className="rounded-xl bg-field px-3 py-2 outline-none" /><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl bg-field px-3 py-2 outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></div><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location (optional)" className="my-2 w-full rounded-xl bg-field px-3 py-2 outline-none" /><input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /><SecondaryButton type="button" onClick={() => file.current?.click()} className="mb-4 flex w-full items-center justify-center gap-2"><ImagePlus size={18} />{image ? image.name : "Add product photo"}</SecondaryButton><PrimaryButton disabled={busy} className="w-full">{busy ? "Publishing..." : "Publish listing"}</PrimaryButton></form></div>;
}
