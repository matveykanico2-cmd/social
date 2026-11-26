"use client";

import { BarChart3, Eye, Heart, MessageCircle, Radio, Users } from "lucide-react";
import { useApi } from "@/lib/client";
import { Spinner } from "@/components/ui";

type Insights = { periodDays: number; totals: { posts: number; reels: number; likes: number; comments: number; followers: number; following: number; stories: number; storyViews: number; live: number; liveViewers: number }; daily: { day: string; posts: number; likes: number; comments: number }[] };

export default function InsightsPage() {
  const { data, loading, error } = useApi<Insights>("/api/insights");
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (error) return <p className="p-6 text-danger">{error}</p>;
  if (!data) return null;
  const cards = [[Users, "Followers", data.totals.followers], [Heart, "Likes received", data.totals.likes], [MessageCircle, "Comments", data.totals.comments], [Eye, "Story views", data.totals.storyViews], [BarChart3, "Posts", data.totals.posts], [Radio, "Live viewers", data.totals.liveViewers]] as const;
  const max = Math.max(1, ...data.daily.map((item) => item.likes + item.comments));
  return <div className="mx-auto max-w-[1000px] px-4 py-6 md:px-8">
    <header className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-link/10 text-link"><BarChart3 size={24} /></span><div><h1 className="text-2xl font-bold">Insights</h1><p className="text-sm text-muted">Real activity from the last {data.periodDays} days</p></div></header>
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([Icon, label, value]) => <div key={label} className="vk-card p-4"><Icon size={20} className="text-muted" /><div className="mt-3 text-2xl font-bold">{value}</div><div className="text-sm text-muted">{label}</div></div>)}</div>
    <section className="vk-card p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Engagement over time</h2><p className="text-sm text-muted">Likes and comments grouped by day</p></div><span className="rounded-full bg-field px-3 py-1 text-xs text-muted">30 days</span></div><div className="flex h-52 items-end gap-1 overflow-x-auto border-b border-border pb-1">{data.daily.map((item) => { const value = item.likes + item.comments; return <div key={item.day} className="group flex h-full min-w-3 flex-1 flex-col justify-end"><div className="relative min-h-1 rounded-t bg-link/70" style={{ height: `${Math.max(2, value / max * 100)}%` }} title={`${item.day}: ${value} interactions`} /><span className="mt-2 hidden rotate-45 whitespace-nowrap text-[9px] text-muted group-hover:block">{item.day.slice(5)}</span></div>; })}</div>{!data.daily.length && <p className="py-10 text-center text-sm text-muted">Publish content to see your activity here.</p>}</section>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="vk-card p-4"><div className="text-sm text-muted">Reels</div><div className="mt-1 text-xl font-bold">{data.totals.reels}</div></div><div className="vk-card p-4"><div className="text-sm text-muted">Stories published</div><div className="mt-1 text-xl font-bold">{data.totals.stories}</div></div><div className="vk-card p-4"><div className="text-sm text-muted">Live sessions</div><div className="mt-1 text-xl font-bold">{data.totals.live}</div></div></div>
  </div>;
}
