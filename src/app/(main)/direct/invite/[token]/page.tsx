"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Spinner } from "@/components/ui";

export default function ConversationInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!params.token) return;
    api<{ id: number }>(`/api/conversations/invite/${encodeURIComponent(params.token)}`, { method: "POST" }).then(({ id }) => router.replace(`/direct/t/${id}`)).catch((e) => setError((e as Error).message));
  }, [params.token, router]);
  return <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">{error ? <div><p className="font-semibold">Invite unavailable</p><p className="mt-2 text-sm text-muted">{error}</p></div> : <div><Spinner /><p className="mt-3 text-sm text-muted">Joining conversation…</p></div>}</div>;
}
