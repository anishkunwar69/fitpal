'use client'

import { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function Providers({ children }: PropsWithChildren) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default Providers;
