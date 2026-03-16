"use client";

import { useState } from "react";
import { useAchievements } from "@/hooks/useAchievements";
import { Button, Spinner, ProgressBar } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import { RefreshCw, X, Lock, CheckCircle } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";

// ── Full achievement catalog with tier progression ────────────────────────────
// Each "series" shows progression: bronze → silver → gold → diamond
const SERIES = [
  {
    id: "habit_streak",
    label: "Habit Warrior",
    description: "Build unbreakable daily habits",
    tiers: [
      { key: "habit_streak_7",   icon: "🔥", title: "7-Day Streak",    ring: "#f59e0b", needed: 7,   unit: "days" },
      { key: "habit_streak_30",  icon: "🌟", title: "30-Day Streak",   ring: "#a855f7", needed: 30,  unit: "days" },
      { key: "habit_streak_100", icon: "💎", title: "Century Streak",  ring: "#06b6d4", needed: 100, unit: "days" },
    ],
    conditionType: "habit_streak",
  },
  {
    id: "tasks",
    label: "Task Slayer",
    description: "Crush your to-do list",
    tiers: [
      { key: "tasks_10",  icon: "✅", title: "10 Tasks Done",   ring: "#10b981", needed: 10,  unit: "tasks" },
      { key: "tasks_50",  icon: "⚡", title: "50 Tasks Done",   ring: "#3b82f6", needed: 50,  unit: "tasks" },
      { key: "tasks_100", icon: "🏆", title: "100 Tasks Done",  ring: "#f59e0b", needed: 100, unit: "tasks" },
    ],
    conditionType: "tasks_completed",
  },
  {
    id: "projects",
    label: "Builder",
    description: "Ship real things into the world",
    tiers: [
      { key: "projects_1",  icon: "🚀", title: "First Ship",        ring: "#6366f1", needed: 1,  unit: "projects" },
      { key: "projects_5",  icon: "🏗️", title: "Serial Builder",    ring: "#8b5cf6", needed: 5,  unit: "projects" },
      { key: "projects_10", icon: "🎯", title: "Prolific Creator",  ring: "#ec4899", needed: 10, unit: "projects" },
    ],
    conditionType: "projects_done",
  },
  {
    id: "learning",
    label: "Scholar",
    description: "Never stop learning",
    tiers: [
      { key: "learning_5",  icon: "📚", title: "5 Items Done",   ring: "#06b6d4", needed: 5,  unit: "items" },
      { key: "learning_20", icon: "🧠", title: "20 Items Done",  ring: "#a855f7", needed: 20, unit: "items" },
    ],
    conditionType: "learning_done",
  },
  {
    id: "journal",
    label: "Reflector",
    description: "Build a journaling practice",
    tiers: [
      { key: "journal_7",  icon: "📖", title: "7-Day Journal",   ring: "#f97316", needed: 7,  unit: "days" },
      { key: "journal_30", icon: "✍️", title: "30-Day Journal",  ring: "#ef4444", needed: 30, unit: "days" },
    ],
    conditionType: "journal_streak",
  },
  {
    id: "knowledge",
    label: "Archivist",
    description: "Build your second brain",
    tiers: [
      { key: "knowledge_10", icon: "💡", title: "10 Entries",  ring: "#10b981", needed: 10, unit: "entries" },
    ],
    conditionType: "knowledge_count",
  },
  {
    id: "budget",
    label: "Money Mind",
    description: "Take control of your finances",
    tiers: [
      { key: "budget_first", icon: "💰", title: "First Entry",  ring: "#22c55e", needed: 1, unit: "entries" },
    ],
    conditionType: "budget_count",
  },
  {
    id: "test",
    label: "Early Adopter",
    description: "Just getting started",
    tiers: [
      { key: "first_login", icon: "👋", title: "Welcome", ring: "#6366f1", needed: 1, unit: "entries" },
    ],
    conditionType: "knowledge_count",
  },
];

const TIER_NAMES  = ["Bronze", "Silver", "Gold"];
const TIER_COLORS = {
  Bronze:  { text: "text-amber-600",  ring: "#b45309", bg: "bg-amber-900/20",  border: "border-amber-700/30" },
  Silver:  { text: "text-slate-300",  ring: "#94a3b8", bg: "bg-slate-700/20",  border: "border-slate-500/30" },
  Gold:    { text: "text-yellow-400", ring: "#facc15", bg: "bg-yellow-900/20", border: "border-yellow-600/30" },
  Diamond: { text: "text-cyan-300",   ring: "#67e8f9", bg: "bg-cyan-900/20",   border: "border-cyan-500/30"  },
};

function getTierName(index) {
  return TIER_NAMES[index] || "Diamond";
}

// ── Badge Detail Modal ────────────────────────────────────────────────────────
function BadgeModal({ series, achMap, onClose }) {
  const tiers = series.tiers;
  const unlockedCount = tiers.filter(t => achMap[t.key]?.unlocked).length;
  const currentTierIdx = unlockedCount - 1; // highest unlocked
  const nextTierIdx    = unlockedCount;     // next to unlock
  const nextTier       = tiers[nextTierIdx];
  const nextAch        = nextTier ? achMap[nextTier.key] : null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
          style={{ background: "#0f1117", borderColor: "#252d40" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <p className="font-bold text-slate-100 text-lg">{series.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{series.description}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/5">
              <X size={16} />
            </button>
          </div>

          {/* Tier progression */}
          <div className="px-6 py-5 space-y-4">
            {tiers.map((tier, i) => {
              const ach       = achMap[tier.key];
              const isUnlocked = ach?.unlocked;
              const tierName  = getTierName(i);
              const tc        = TIER_COLORS[tierName];
              const isNext    = i === nextTierIdx;

              return (
                <div
                  key={tier.key}
                  className={clsx(
                    "rounded-xl border p-4 transition-all",
                    isUnlocked ? `${tc.bg} ${tc.border}` : "bg-surface-2 border-surface-3",
                    isNext && !isUnlocked && "border-dashed"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={clsx("h-14 w-14 rounded-xl flex items-center justify-center text-2xl border-2 shrink-0 relative")}
                      style={isUnlocked ? {
                        background: `linear-gradient(135deg, ${tier.ring}30, ${tier.ring}10)`,
                        borderColor: `${tier.ring}60`,
                        boxShadow: `0 0 20px ${tier.ring}40`,
                      } : {
                        background: "#1e2535",
                        borderColor: "#252d40",
                        filter: "grayscale(1)",
                        opacity: 0.5,
                      }}
                    >
                      {tier.icon}
                      {isUnlocked && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ background: tier.ring, color: "#0f1117" }}>
                          <CheckCircle size={12} />
                        </div>
                      )}
                      {!isUnlocked && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-3 border border-surface-2 flex items-center justify-center">
                          <Lock size={9} className="text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-widest", isUnlocked ? tc.text : "text-slate-600")}>
                          {tierName}
                        </span>
                        {isNext && !isUnlocked && (
                          <span className="text-[9px] bg-brand/15 text-brand px-1.5 py-0.5 rounded font-semibold">NEXT</span>
                        )}
                      </div>
                      <p className={clsx("font-semibold text-sm", isUnlocked ? "text-slate-100" : "text-slate-500")}>
                        {tier.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Reach {tier.needed} {tier.unit}
                      </p>
                      {isUnlocked && ach?.unlockedAt && (
                        <p className="text-[10px] mt-1" style={{ color: tier.ring }}>
                          Unlocked {new Date(ach.unlockedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Series Card ───────────────────────────────────────────────────────────────
function SeriesCard({ series, achMap, onClick }) {
  const tiers          = series.tiers;
  const unlockedCount  = tiers.filter(t => achMap[t.key]?.unlocked).length;
  const totalTiers     = tiers.length;
  const isFullyDone    = unlockedCount === totalTiers;
  const currentTier    = tiers[unlockedCount - 1]; // highest unlocked tier
  const nextTier       = tiers[unlockedCount];     // next to unlock
  const pct            = totalTiers > 0 ? Math.round((unlockedCount / totalTiers) * 100) : 0;

  // Show the highest unlocked tier's style, or the first tier's if none
  const displayTier    = currentTier || tiers[0];
  const displayTierIdx = currentTier ? unlockedCount - 1 : -1;
  const tierName       = displayTierIdx >= 0 ? getTierName(displayTierIdx) : null;
  const tc             = tierName ? TIER_COLORS[tierName] : null;
  const nextTierName   = nextTier ? getTierName(unlockedCount) : null;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative rounded-2xl border p-5 cursor-pointer transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-xl group",
        isFullyDone
          ? "border-yellow-500/30"
          : unlockedCount > 0
          ? "border-surface-2"
          : "border-surface-2 opacity-75 hover:opacity-100"
      )}
      style={isFullyDone ? {
        background: "linear-gradient(135deg, rgba(234,179,8,0.08) 0%, #161b27 60%)",
        boxShadow: "0 0 30px rgba(234,179,8,0.1)",
      } : unlockedCount > 0 ? {
        background: `linear-gradient(135deg, ${displayTier.ring}08 0%, #161b27 60%)`,
      } : {
        background: "#161b27",
      }}
    >
      {/* Fully complete badge */}
      {isFullyDone && (
        <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-yellow-400 bg-yellow-900/30 border border-yellow-600/30 px-2 py-0.5 rounded-full">
          Complete ✦
        </div>
      )}

      {/* Top row — icon + tier badge */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative">
          {/* Tier icons stacked */}
          <div className="flex -space-x-2">
            {tiers.map((tier, i) => {
              const unlocked = achMap[tier.key]?.unlocked;
              return (
                <div
                  key={tier.key}
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-xl border-2 transition-all"
                  style={unlocked ? {
                    background: `linear-gradient(135deg, ${tier.ring}30, ${tier.ring}10)`,
                    borderColor: `${tier.ring}60`,
                    boxShadow: `0 0 12px ${tier.ring}40`,
                    zIndex: i + 1,
                  } : {
                    background: "#1e2535",
                    borderColor: "#252d40",
                    filter: "grayscale(1)",
                    opacity: 0.4,
                    zIndex: i + 1,
                  }}
                >
                  {tier.icon}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-bold text-slate-100 text-sm leading-tight">{series.label}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{series.description}</p>
        </div>
      </div>

      {/* Current tier */}
      {tierName && tc && (
        <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-3", tc.bg, tc.border, "border", tc.text)}>
          ◆ {tierName} tier
        </div>
      )}
      {!tierName && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-3 bg-surface-3 border border-surface-2 text-slate-600">
          🔒 Locked
        </div>
      )}

      {/* Progress bar across tiers */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
          <span>{unlockedCount}/{totalTiers} tiers</span>
          {nextTierName && !isFullyDone && (
            <span className="text-brand">Next: {nextTierName}</span>
          )}
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isFullyDone
                ? "linear-gradient(90deg, #f59e0b, #facc15)"
                : unlockedCount > 0
                ? `linear-gradient(90deg, ${displayTier.ring}, ${nextTier?.ring || displayTier.ring})`
                : "#6366f1",
            }}
          />
        </div>
      </div>

      {/* What's needed for next tier */}
      {nextTier && !isFullyDone && (
        <p className="text-[10px] text-slate-600 mt-1.5">
          Reach {nextTier.needed} {nextTier.unit} → {getTierName(unlockedCount)}
        </p>
      )}

      {/* Click hint */}
      <p className="absolute bottom-3 right-3 text-[9px] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
        View details →
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const { achievements, summary, loading, triggerEvaluation } = useAchievements();
  const [selectedSeries, setSelectedSeries] = useState(null);

  const pct    = summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;
  const achMap = Object.fromEntries(achievements.map((a) => [a.key, a]));

  const unlockedSeries = SERIES.filter(s => s.tiers.some(t => achMap[t.key]?.unlocked));
  const lockedSeries   = SERIES.filter(s => !s.tiers.some(t => achMap[t.key]?.unlocked));

  if (loading) {
    return <PageWrapper className="flex items-center justify-center"><Spinner size="lg" /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">

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

        {/* Overall progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-semibold text-slate-200">Overall Progress</span>
            <span className="font-bold text-brand">{pct}%</span>
          </div>
          <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)" }} />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <span>{summary.unlocked} unlocked</span>
            <span>{summary.total - summary.unlocked} remaining</span>
          </div>
        </div>

        {/* Tier legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(TIER_COLORS).map(([tier, tc]) => (
            <div key={tier} className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold", tc.bg, tc.border, tc.text)}>
              ◆ {tier}
            </div>
          ))}
        </div>

        {/* Unlocked series */}
        {unlockedSeries.length > 0 && (
          <section>
            <p className="section-title mb-4">In Progress ({unlockedSeries.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {unlockedSeries.map(s => (
                <SeriesCard key={s.id} series={s} achMap={achMap} onClick={() => setSelectedSeries(s)} />
              ))}
            </div>
          </section>
        )}

        {/* Locked series */}
        {lockedSeries.length > 0 && (
          <section>
            <p className="section-title mb-4">Locked ({lockedSeries.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {lockedSeries.map(s => (
                <SeriesCard key={s.id} series={s} achMap={achMap} onClick={() => setSelectedSeries(s)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Detail modal */}
      {selectedSeries && (
        <BadgeModal
          series={selectedSeries}
          achMap={achMap}
          onClose={() => setSelectedSeries(null)}
        />
      )}
    </PageWrapper>
  );
}