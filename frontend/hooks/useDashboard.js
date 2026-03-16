"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export function useDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Send client's local date so server uses correct midnight for IST users
      const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz
      const res = await api.get(`/dashboard?localDate=${localDate}`);
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetch(); }, [fetch]);

  // Refetch silently when tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetch(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetch]);

  // Refetch when window regains focus
  useEffect(() => {
    const onFocus = () => fetch(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}