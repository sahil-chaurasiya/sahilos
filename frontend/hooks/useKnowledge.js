"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useKnowledge(params = {}) {
  const [entries, setEntries]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return q.toString();
  }, [JSON.stringify(params)]);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/knowledge?${buildQuery()}`);
      setEntries(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

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

  return { entries, pagination, loading, fetchEntries, createEntry, updateEntry, deleteEntry };
}
