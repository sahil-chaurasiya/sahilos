"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useKnowledge(params = {}) {
  const [entries, setEntries]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [JSON.stringify(params)]);

  const buildQuery = useCallback((p = 1) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    q.set("limit", "100"); // fetch up to 100 per page — enough for most vaults
    q.set("page", String(p));
    return q.toString();
  }, [JSON.stringify(params)]);

  const fetchEntries = useCallback(async (p = 1, append = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/knowledge?${buildQuery(p)}`);
      if (append) {
        setEntries((prev) => [...prev, ...res.data.data]);
      } else {
        setEntries(res.data.data);
      }
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchEntries(1, false); }, [fetchEntries]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchEntries(next, true);
  }, [page, fetchEntries]);

  const createEntry = useCallback(async (payload) => {
    const res = await api.post("/knowledge", payload);
    setEntries((prev) => [res.data.data, ...prev]);
    toast.success("Entry saved to Knowledge Vault");
    return res.data.data;
  }, []);

  const updateEntry = useCallback(async (id, payload) => {
    const res = await api.put(`/knowledge/${id}`, payload);
    setEntries((prev) => prev.map((e) => (e._id === id ? res.data.data : e)));
    toast.success("Entry updated");
    return res.data.data;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    await api.delete(`/knowledge/${id}`);
    setEntries((prev) => prev.filter((e) => e._id !== id));
    toast.success("Entry deleted");
  }, []);

  return {
    entries, pagination, loading,
    fetchEntries, loadMore, createEntry, updateEntry, deleteEntry,
    hasMore: pagination?.hasNext ?? false,
  };
}