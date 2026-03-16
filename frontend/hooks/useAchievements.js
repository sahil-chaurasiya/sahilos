"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ── Context ───────────────────────────────────────────────────────────────────
const AchievementContext = createContext(null);

// ── Provider — mount once in (app)/layout.js ──────────────────────────────────
export function AchievementProvider({ children, onUnlock }) {
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary]           = useState({ total: 0, unlocked: 0 });
  const [loading, setLoading]           = useState(true);
  const prevUnlockedIds                 = useRef(null);

  const fetchAndCheck = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res     = await api.get("/achievements");
      const fresh   = res.data.data;
      setAchievements(fresh);
      setSummary(res.data.summary);

      const freshUnlocked = fresh.filter((a) => a.unlocked);

      // First load — record baseline, no popup
      if (prevUnlockedIds.current === null) {
        prevUnlockedIds.current = new Set(freshUnlocked.map((a) => a._id));
        return;
      }

      // Diff — find newly unlocked since last check
      const newlyUnlocked = freshUnlocked.filter(
        (a) => !prevUnlockedIds.current.has(a._id)
      );
      if (newlyUnlocked.length > 0) {
        prevUnlockedIds.current = new Set(freshUnlocked.map((a) => a._id));
        newlyUnlocked.forEach((a) => onUnlock?.(a));
      }
    } finally {
      setLoading(false);
    }
  }, [onUnlock]);

  // Initial fetch
  useEffect(() => { fetchAndCheck(); }, [fetchAndCheck]);

  // Poll every 15s silently
  useEffect(() => {
    const id = setInterval(() => fetchAndCheck(true), 15000);
    return () => clearInterval(id);
  }, [fetchAndCheck]);

  const triggerEvaluation = useCallback(async () => {
    await api.post("/achievements/evaluate");
    await fetchAndCheck(true);
  }, [fetchAndCheck]);

  const value = {
    achievements,
    summary,
    loading,
    unlocked: achievements.filter((a) => a.unlocked),
    locked:   achievements.filter((a) => !a.unlocked),
    fetchAchievements: fetchAndCheck,
    triggerEvaluation,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

// ── Hook — use anywhere inside (app) ─────────────────────────────────────────
export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievements must be used inside AchievementProvider");
  return ctx;
}