"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { api } from "@/lib/client";
import type { Me, Post } from "@/lib/types";
import { Toast } from "./ui";

type PostListener = (post: Post | null) => void;
const languageListeners = new Set<() => void>();
const readLanguage = () => (typeof window !== "undefined" && window.localStorage.getItem("shalter:language") === "ru" ? "ru" : "en") as "en" | "ru";
const subscribeLanguage = (listener: () => void) => { languageListeners.add(listener); return () => languageListeners.delete(listener); };

type AppState = {
  me: Me;
  setMe: (me: Me) => void;
  unread: { notifications: number; messages: number };
  refreshUnread: () => void;
  toast: (message: string) => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  openPost: (post: Post, onChange?: PostListener) => void;
  openShare: (post: Post) => void;
  modalPost: { post: Post; onChange?: PostListener } | null;
  closePost: () => void;
  sharePost: Post | null;
  closeShare: () => void;
  language: "en" | "ru";
  setLanguage: (language: "en" | "ru") => void;
};

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({ initialMe, children }: { initialMe: Me; children: ReactNode }) {
  const [me, setMe] = useState(initialMe);
  const [unread, setUnread] = useState({ notifications: 0, messages: 0 });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [modalPost, setModalPost] = useState<AppState["modalPost"]>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const language = useSyncExternalStore(subscribeLanguage, readLanguage, () => "en" as const);

  const setLanguage = useCallback((next: "en" | "ru") => {
    window.localStorage.setItem("shalter:language", next);
    document.documentElement.lang = next;
    languageListeners.forEach((listener) => listener());
  }, []);

  const refreshUnread = useCallback(() => {
    api<{ notifications: number; messages: number }>("/api/unread").then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const t = setInterval(refreshUnread, 8000);
    return () => clearInterval(t);
  }, [refreshUnread]);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const openPost = useCallback((post: Post, onChange?: PostListener) => setModalPost({ post, onChange }), []);
  const closePost = useCallback(() => setModalPost(null), []);
  const openShare = useCallback((post: Post) => setSharePost(post), []);
  const closeShare = useCallback(() => setSharePost(null), []);

  return (
    <Ctx.Provider
      value={{
        me,
        setMe,
        unread,
        refreshUnread,
        toast,
        createOpen,
        setCreateOpen,
        openPost,
        openShare,
        modalPost,
        closePost,
        sharePost,
        closeShare,
        language,
        setLanguage,
      }}
    >
      {children}
      <Toast message={toastMsg} />
    </Ctx.Provider>
  );
}
