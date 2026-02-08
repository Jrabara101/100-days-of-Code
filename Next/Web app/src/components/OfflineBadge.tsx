"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBadge() {
  const online = useOnlineStatus();

  return (
    <div
      className={`offline-pill flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        online ? "text-emerald-700" : "text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden
      />
      {online ? "Online" : "Working Offline"}
    </div>
  );
}