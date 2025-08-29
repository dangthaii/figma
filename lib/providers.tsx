"use client";

import { RefetchAll } from "@/components/tools/RefetchAll";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { LoadingProvider } from "./loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          {children}
          <RefetchAll />
        </LoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
