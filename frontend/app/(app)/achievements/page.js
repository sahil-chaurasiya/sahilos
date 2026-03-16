"use client";

import { useAchievements } from "@/hooks/useAchievements";
import { Button, Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import { Trophy, RefreshCw } from "lucide-react";
import clsx from "clsx";

function AchievementCard({ achievement }) {
  const { unlocked, icon, title, description, unlockedAt } = achievement;

  return (
    <div className={clsx(
      "card p-5 flex flex-col gap-3 transition-all duration-200",
      unlocked
        ? "border-brand/30 bg-brand/5"
        : "opacity-50 grayscale"
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx(
          "h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0",
          unlocked ? "bg-brand/15" : "bg-surface-2"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-200 text-sm">{title}</p>
            {unlocked && (
              <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded font-semibold">
                UNLOCKED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          {unlocked && unlockedAt && (
            <p className="text-[11px] text-slate-600 mt-1">
              {new Date(unlockedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { unlocked, locked, summary, loading, triggerEvaluation } = useAchievements();

  const pct = summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Achievements</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {summary.unlocked} of {summary.total} unlocked · {pct}% complete
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={triggerEvaluation}>
            <RefreshCw size={14} /> Check Progress
          </Button>
        </div>

        {/* Progress bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-semibold text-slate-200">Overall Progress</span>
            <span className="text-brand font-bold">{pct}%</span>
          </div>
          <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <span>{summary.unlocked} unlocked</span>
            <span>{summary.total - summary.unlocked} remaining</span>
          </div>
        </div>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <section>
            <p className="section-title mb-3 flex items-center gap-2">
              <Trophy size={12} className="text-amber-400" />
              Unlocked ({unlocked.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {unlocked.map((a) => <AchievementCard key={a._id} achievement={a} />)}
            </div>
          </section>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <section>
            <p className="section-title mb-3">Locked ({locked.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {locked.map((a) => <AchievementCard key={a._id} achievement={a} />)}
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
