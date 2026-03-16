"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export function useAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary]           = useState({ total: 0, unlocked: 0 });
  const [loading, setLoading]           = useState(true);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/achievements");
      setAchievements(res.data.data);
      setSummary(res.data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAchievements(); }, [fetchAchievements]);

  const triggerEvaluation = useCallback(async () => {
    await api.post("/achievements/evaluate");
    await fetchAchievements();
  }, [fetchAchievements]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked   = achievements.filter((a) => !a.unlocked);

  return { achievements, unlocked, locked, summary, loading, fetchAchievements, triggerEvaluation };
}
