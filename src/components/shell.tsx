"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CreateModal } from "./create-modal";
import { MessagesBubble } from "./messages-bubble";
import { BottomNav, Sidebar, TopBar } from "./nav";
import { PostModal } from "./post-view";
import { ShareModal } from "./share-modal";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const narrow = pathname.startsWith("/direct");
  // Like Instagram on phones, an open chat hides the bottom tab bar.
  const inThread = pathname.startsWith("/direct/t/");
  // Stories and the printable reconciliation report take the whole window.
  const fullscreen = pathname.startsWith("/stories") || /^\/reconcile\/\d+\/report$/.test(pathname);
  return (
    <>
      {!fullscreen && <Sidebar />}
      {!fullscreen && !narrow && <TopBar />}
      <main className={fullscreen ? "" : `${inThread ? "" : "pb-[var(--nav-h)]"} md:pb-0 md:pl-[72px] ${narrow ? "" : "xl:pl-[244px] md:pt-16 xl:pl-[244px]"}`}>{children}</main>
      {!fullscreen && !inThread && <BottomNav />}
      {!fullscreen && !narrow && <MessagesBubble />}
      <PostModal />
      <ShareModal />
      <CreateModal />
    </>
  );
}
