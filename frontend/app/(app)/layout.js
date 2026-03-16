"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Spinner } from "@/components/ui";
import { AchievementProvider } from "@/hooks/useAchievements";
import { AchievementPopupQueue } from "@/components/achievements/AchievementPopup";

function AppShell({ children }) {
  const [queue, setQueue] = useState([]);

  const handleUnlock = (achievement) => {
    setQueue((q) => [...q, achievement]);
  };

  const handleDismiss = (id) => {
    setQueue((q) => q.filter((a) => a._id !== id));
  };

  return (
    <AchievementProvider onUnlock={handleUnlock}>
      <div className="flex h-screen bg-surface overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        {/* Global popup — on top of everything, on every page */}
        <AchievementPopupQueue queue={queue} onDismiss={handleDismiss} />
      </div>
    </AchievementProvider>
  );
}

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading SahilOS…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <AppShell>{children}</AppShell>;
}