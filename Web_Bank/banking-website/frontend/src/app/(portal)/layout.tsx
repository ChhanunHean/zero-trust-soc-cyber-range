"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import PortalSidebar from "@/components/PortalSidebar";
import { LogoutIcon } from "@/components/Icons";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-royal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <PortalSidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <PortalSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 text-navy lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="-mt-0.5 font-semibold text-navy">{user.firstName} {user.lastName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-royal-50 text-sm font-bold text-royal">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <button
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="btn-ghost px-3 py-2 text-sm"
            >
              <LogoutIcon width={18} height={18} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
