"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useLifeVision() {
  const [vision, setVision]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const autosaveRef             = useRef(null);

  const fetchVision = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/vision");
      setVision(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVision(); }, [fetchVision]);

  const saveVision = useCallback(async (payload, silent = false) => {
    try {
      setSaving(true);
      const res = await api.put("/vision", payload);
      setVision(res.data.data);
      if (!silent) toast.success("Vision saved");
    } catch {
      if (!silent) toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }, []);

  // Autosave helper — call this with the full payload after any field change
  const scheduleAutosave = useCallback((payload) => {
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => saveVision(payload, true), 1500);
  }, [saveVision]);

  return { vision, loading, saving, saveVision, scheduleAutosave, fetchVision };
}
