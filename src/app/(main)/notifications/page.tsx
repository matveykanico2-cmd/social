"use client";

import { useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { NotificationList } from "@/components/panels";

// Phone version of the notifications panel.
export default function NotificationsPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-[700px] px-4 md:py-6">
      <header className="vk-card sticky top-0 z-20 flex h-14 items-center border-b border-separator bg-elevated px-2 md:static md:mb-4 md:px-4">
        <button onClick={() => router.back()} aria-label="Back" className="p-1">
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2 pr-8 text-base font-semibold md:justify-start md:pr-0"><Bell size={18} className="text-link" />Notifications</div>
      </header>
      <NotificationList />
    </div>
  );
}
