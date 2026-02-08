"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineTheme({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.offline = online ? "false" : "true";
  }, [online]);

  return <>{children}</>;
}