"use client";

import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function Providers({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  useEffect(() => {
    onlineManager.setOnline(online);
  }, [online]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
