"use client";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { BarChart2, Dumbbell, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Memoize handler to prevent recreation on each render
  const handleResize = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when screen size increases past mobile breakpoint
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Memoize navigation to prevent recreation on each render
  const navigation = useMemo(() => [
    {
      name: "Workout Programs",
      href: "/dashboard/workout-programs",
      icon: Dumbbell,
      current: pathname === "/dashboard/exercises",
    },
    {
      name: "Statistics",
      href: "/dashboard/statistics",
      icon: BarChart2,
      current: pathname === "/dashboard/statistics",
    },
  ], [pathname]);

  // Memoize toggle handler
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 bg-white border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.emailAddresses[0].emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gray-200 mx-6" />

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                      item.current
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quick Stats Section */}
          <div className="mt-auto p-4 space-y-4 border-t border-gray-200">
            {/* Motivation Quote */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-xs text-orange-600 font-medium mb-2">Daily Motivation</p>
              <p className="text-sm text-gray-700 italic">
                "The only bad workout is the one that didn't happen."
              </p>
            </div>
            
            {/* Back to Home Button */}
            <Link
              href="/"
              className="block w-full px-4 py-2 text-sm text-center text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
} 