"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useDailyStat(range = {}) {
  const [stats, setStats]       = useState([]);
  const [today, setToday]       = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (range.from) q.set("from", range.from);
      if (range.to)   q.set("to",   range.to);
      const [statsRes, todayRes] = await Promise.all([
        api.get(`/daily-stats?${q.toString()}`),
        api.get("/daily-stats/today"),
      ]);
      setStats(statsRes.data.data);
      setToday(todayRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(range)]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const logStat = useCallback(async (payload) => {
    const res = await api.post("/daily-stats", payload);
    setToday(res.data.data);
    setStats((prev) => {
      const existing = prev.findIndex((s) => s.date === res.data.data.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = res.data.data;
        return updated;
      }
      return [...prev, res.data.data];
    });
    toast.success("Stats logged");
    return res.data.data;
  }, []);

  return { stats, today, loading, fetchStats, logStat };
}
