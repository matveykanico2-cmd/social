"use client";

import { useState } from "react";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { useApi } from "@/lib/client";
import type { Post } from "@/lib/types";
import { SearchBox } from "@/components/panels";
import { PostGrid } from "@/components/post-view";
import { Spinner } from "@/components/ui";

export default function ExplorePage() {
  const { data, setData } = useApi<{ posts: Post[] }>("/api/explore");
  const [searching, setSearching] = useState(false);

  return (
    <div className="mx-auto max-w-[975px] md:px-5 md:pt-6">
      <div className="vk-card mb-5 hidden items-center justify-between px-5 py-4 md:flex">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-link/10 text-link"><Compass size={21} /></span><div><h1 className="text-lg font-bold">Discover</h1><p className="text-sm text-muted">Photos, videos and people you may know</p></div></div>
        <div className="flex items-center gap-2 text-sm text-muted"><Search size={17} />Use the search in the header</div>
      </div>
      {/* Phone: search bar on top, like Instagram's mobile web Explore */}
      <div className="sticky top-0 z-20 flex items-center gap-2 bg-bg px-4 py-2 md:hidden">
        {searching && (
          <button onClick={() => setSearching(false)} aria-label="Back">
            <ArrowLeft size={24} />
          </button>
        )}
        {!searching && (
          <button
            onClick={() => setSearching(true)}
            className="w-full rounded-lg bg-secondary px-4 py-[9px] text-left text-base text-muted"
          >
            Search
          </button>
        )}
      </div>
      {searching ? (
        <div className="md:hidden">
          <SearchBox compactInput onNavigate={() => setSearching(false)} />
        </div>
      ) : !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="vk-card overflow-hidden">
        <PostGrid
          explore
          posts={data.posts}
          onChange={(id, p) =>
            setData({ posts: p ? data.posts.map((x) => (x.id === id ? p : x)) : data.posts.filter((x) => x.id !== id) })
          }
        />
        </div>
      )}
    </div>
  );
}
