"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

const BADGE_STYLES = {
  habit_streak_7:   { ring: "#f59e0b", glow: "rgba(245,158,11,0.3)",  shine: "#fbbf24" },
  habit_streak_30:  { ring: "#a855f7", glow: "rgba(168,85,247,0.3)",  shine: "#c084fc" },
  habit_streak_100: { ring: "#06b6d4", glow: "rgba(6,182,212,0.35)",  shine: "#22d3ee" },
  tasks_10:         { ring: "#10b981", glow: "rgba(16,185,129,0.3)",  shine: "#34d399" },
  tasks_50:         { ring: "#3b82f6", glow: "rgba(59,130,246,0.3)",  shine: "#60a5fa" },
  tasks_100:        { ring: "#f59e0b", glow: "rgba(245,158,11,0.35)", shine: "#fbbf24" },
  projects_1:       { ring: "#6366f1", glow: "rgba(99,102,241,0.3)",  shine: "#818cf8" },
  projects_5:       { ring: "#8b5cf6", glow: "rgba(139,92,246,0.3)",  shine: "#a78bfa" },
  projects_10:      { ring: "#ec4899", glow: "rgba(236,72,153,0.3)",  shine: "#f472b6" },
  learning_5:       { ring: "#06b6d4", glow: "rgba(6,182,212,0.3)",   shine: "#22d3ee" },
  learning_20:      { ring: "#a855f7", glow: "rgba(168,85,247,0.3)",  shine: "#c084fc" },
  journal_7:        { ring: "#f97316", glow: "rgba(249,115,22,0.3)",  shine: "#fb923c" },
  journal_30:       { ring: "#ef4444", glow: "rgba(239,68,68,0.3)",   shine: "#f87171" },
  knowledge_10:     { ring: "#10b981", glow: "rgba(16,185,129,0.3)",  shine: "#34d399" },
  budget_first:     { ring: "#22c55e", glow: "rgba(34,197,94,0.3)",   shine: "#4ade80" },
};

function getStyle(key) {
  return BADGE_STYLES[key] || { ring: "#6366f1", glow: "rgba(99,102,241,0.3)", shine: "#818cf8" };
}

function AchievementToast({ achievement, onDone }) {
  const [phase, setPhase] = useState("enter");
  const s = getStyle(achievement.key);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 50);
    const t2 = setTimeout(() => setPhase("exit"), 4500);
    const t3 = setTimeout(() => onDone(), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      onClick={() => { setPhase("exit"); setTimeout(onDone, 700); }}
      className={clsx(
        "relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer select-none border backdrop-blur-md shadow-2xl",
        "transition-all duration-700",
        phase === "enter" && "opacity-0 translate-y-6 scale-95",
        phase === "show"  && "opacity-100 translate-y-0 scale-100",
        phase === "exit"  && "opacity-0 translate-y-4 scale-95",
      )}
      style={{
        background: "linear-gradient(135deg, #0f1117 0%, #161b27 100%)",
        borderColor: `${s.ring}50`,
        boxShadow: `0 0 40px ${s.glow}, 0 20px 60px rgba(0,0,0,0.6)`,
        minWidth: 320,
        maxWidth: 380,
      }}
    >
      {/* Shimmer line */}
      <div className="absolute top-0 left-6 right-6 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${s.ring}, transparent)` }} />

      {/* Badge icon */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: s.ring, animationDuration: "1.5s" }} />
        <div className="relative h-16 w-16 rounded-2xl flex items-center justify-center text-3xl border-2"
          style={{
            background: `linear-gradient(135deg, ${s.ring}25, ${s.ring}10)`,
            borderColor: `${s.ring}60`,
            boxShadow: `0 0 20px ${s.glow}`,
          }}>
          {achievement.icon}
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border"
          style={{ background: s.ring, borderColor: "#0f1117", color: "#0f1117" }}>
          ✦
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: s.shine }}>
          Achievement Unlocked
        </p>
        <p className="font-bold text-slate-100 text-base leading-tight">{achievement.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{achievement.description}</p>
      </div>

      <p className="absolute bottom-1.5 right-3 text-[9px] text-slate-700">tap to dismiss</p>
    </div>
  );
}

// Queue: shows one popup at a time
export function AchievementPopupQueue({ queue, onDismiss }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || queue.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <div className="pointer-events-auto">
        <AchievementToast
          key={queue[0]._id}
          achievement={queue[0]}
          onDone={() => onDismiss(queue[0]._id)}
        />
      </div>
    </div>,
    document.body
  );
}