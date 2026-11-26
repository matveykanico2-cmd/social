"use client";

import { useApi } from "@/lib/client";
import { Users } from "lucide-react";
import type { FollowUser } from "@/lib/types";
import { FollowButton, UserRow } from "@/components/social";
import { Spinner } from "@/components/ui";

export default function SuggestedPeoplePage() {
  const { data } = useApi<{ users: (FollowUser & { reason: string })[] }>("/api/suggestions?limit=50");
  return (
    <div className="mx-auto max-w-[600px] px-4 py-4 md:py-10">
      <div className="vk-card mb-4 flex items-center gap-3 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-link/10 text-link"><Users size={21} /></span><div><h1 className="text-lg font-bold">Friends</h1><p className="text-sm text-muted">People you may know and want to follow</p></div></div>
      {!data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : data.users.length === 0 ? (
        <p className="px-4 text-muted">You&apos;re following everyone. Nice!</p>
      ) : (
        <div className="vk-card overflow-hidden">{data.users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            subtitle={`${u.name}${u.name ? " · " : ""}${u.reason}`}
            action={<FollowButton username={u.username} isFollowing={u.isFollowing} />}
          />
        ))}</div>
      )}
    </div>
  );
}
