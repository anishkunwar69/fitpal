"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useEffect } from "react";

const Background = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute w-[200px] h-[200px] rounded-full bg-orange-200/30 -top-20 -right-20 blur-3xl animate-pulse" />
    <div className="absolute w-[200px] h-[200px] rounded-full bg-orange-100/40 -bottom-20 -left-20 blur-3xl animate-pulse" />
  </div>
));
Background.displayName = 'Background';

export default function Welcome() {
  const router = useRouter();

  const { data, isError, refetch } = useQuery({
    queryKey: ["sync-user-status"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users/sync", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!res.ok) {
        throw new Error('Network response was not ok')
      }
      return await res.json()
    },
    retry: 2,
    staleTime: 5000,
    gcTime: 10000,
  })

  useEffect(() => {
    if (data?.success) {
      router.replace("/dashboard")
    }
  }, [data, router])

  const containerClass = "min-h-[90vh] bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-6";

  if (isError) {
    return (
      <div className={containerClass}>
        <Background />
        <div className="text-center space-y-6 relative">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Oops! Something went wrong.</h1>
            <p className="text-gray-600 max-w-[280px] mx-auto mb-4">
              We encountered an error while setting up your account.
            </p>
            <button 
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Background />
      <div className="text-center space-y-6 relative">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Setting Things Up</h1>
          <p className="text-gray-600 max-w-[280px] mx-auto">
            We're preparing your fitness journey. Just a moment...
          </p>
        </div>
      </div>
    </div>
  );
}