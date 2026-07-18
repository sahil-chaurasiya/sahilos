"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Circle, Feather } from "lucide-react";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/constants";
import clsx from "clsx";

// ─── Palette — matches NooriCard: candlelight, old paper, sealing wax ────────
const L = {
  void:      "#120b08",
  deep:      "#1c120c",
  parchment: "rgb(232,214,178)",
  rose:      "rgb(214,150,159)",
  gold:      "rgb(197,157,74)",
  wax:       "rgb(155,32,53)",
  border:    "rgba(197,157,74,0.14)",
  borderHot: "rgba(197,157,74,0.34)",
  inputBg:   "rgba(197,157,74,0.05)",
};

// ─── Shared field label ───────────────────────────────────────────────────────
function NLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: "italic",
      fontWeight: 600,
      fontSize: "0.7rem",
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(197,157,74,0.60)",
      marginBottom: "0.45rem",
    }}>
      {children}
    </p>
  );
}

// ─── Styled input ─────────────────────────────────────────────────────────────
function NInput({ value, onChange, placeholder, autoFocus, style = {} }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: L.inputBg,
        border: `1px solid ${L.border}`,
        borderRadius: "0.75rem",
        padding: "0.65rem 1rem",
        fontFamily: "'Caveat', cursive",
        fontSize: "1.05rem",
        color: L.parchment,
        outline: "none",
        transition: "border-color 0.2s ease",
        caretColor: L.gold,
        ...style,
      }}
      onFocus={(e)  => e.currentTarget.style.borderColor = L.borderHot}
      onBlur={(e)   => e.currentTarget.style.borderColor = L.border}
    />
  );
}

// ─── Styled textarea ──────────────────────────────────────────────────────────
function NTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: L.inputBg,
        border: `1px solid ${L.border}`,
        borderRadius: "0.75rem",
        padding: "0.65rem 1rem",
        fontFamily: "'Caveat', cursive",
        fontSize: "1.05rem",
        color: L.parchment,
        outline: "none",
        resize: "none",
        transition: "border-color 0.2s ease",
        caretColor: L.gold,
        lineHeight: 1.7,
      }}
      onFocus={(e)  => e.currentTarget.style.borderColor = L.borderHot}
      onBlur={(e)   => e.currentTarget.style.borderColor = L.border}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function NooriEditModal({ open, onClose, onSave, initial }) {
  const blank = {
    title: "", description: "", status: "active",
    repoLink: "", liveUrl: "", notes: "",
    milestones: [], categories: [],
  };

  const [form,    setForm]    = useState(blank);
  const [msInput, setMs]      = useState("");
  const [saving,  setSaving]  = useState(false);
  const msRef = useRef(null);

  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : blank);
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addMilestone = () => {
    if (!msInput.trim()) return;
    setForm((f) => ({
      ...f,
      milestones: [...(f.milestones || []), { title: msInput.trim(), done: false }],
    }));
    setMs("");
    setTimeout(() => msRef.current?.focus(), 30);
  };

  const removeMilestone = (i) =>
    setForm((f) => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }));

  const toggleCategory = (val) =>
    setForm((f) => ({
      ...f,
      categories: f.categories?.includes(val)
        ? f.categories.filter((c) => c !== val)
        : [...(f.categories || []), val],
    }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "radial-gradient(ellipse at 40% 30%, rgba(155,32,53,0.16) 0%, rgba(0,0,0,0.80) 100%)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-lg pointer-events-auto flex flex-col"
              style={{
                background: "linear-gradient(165deg, #1c120c 0%, #150d09 55%, #120b08 100%)",
                border: "1px solid rgba(197,157,74,0.16)",
                borderRadius: "1.5rem",
                boxShadow: "0 0 0 1px rgba(197,157,74,0.05), 0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(155,32,53,0.12)",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient candlelight glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none rounded-full"
                style={{ background: "radial-gradient(circle, rgba(197,157,74,0.14) 0%, transparent 65%)", filter: "blur(40px)" }} />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 pointer-events-none rounded-full"
                style={{ background: "radial-gradient(circle, rgba(155,32,53,0.08) 0%, transparent 65%)", filter: "blur(36px)" }} />

              {/* Header */}
              <div className="relative flex items-start gap-3 px-6 pt-6 pb-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(197,157,74,0.10)" }}>
                <motion.span
                  animate={{ rotate: [0, -6, 0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="mt-1 select-none shrink-0">
                  <Feather size={20} style={{ color: L.gold }} />
                </motion.span>
                <div className="flex-1 min-w-0">
                  <h2 style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    background: "linear-gradient(125deg, rgb(197,157,74) 0%, rgb(232,214,178) 50%, rgb(214,150,159) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    lineHeight: 1.2,
                  }}>
                    {initial ? "revise the letter" : "begin a letter"}
                  </h2>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "0.68rem",
                    color: "rgba(197,157,74,0.55)",
                    letterSpacing: "0.12em",
                    marginTop: "0.25rem",
                  }}>
                    ♡ every word, for her ♡
                  </p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-xl transition-all shrink-0"
                  style={{ color: "rgba(197,157,74,0.45)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = L.rose}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(197,157,74,0.45)"}>
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(197,157,74,0.18) transparent" }}>

                {/* Title */}
                <div>
                  <NLabel>her name for this</NLabel>
                  <NInput
                    autoFocus
                    value={form.title}
                    onChange={set("title")}
                    placeholder="what do you call this letter…"
                    style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.2rem" }}
                  />
                </div>

                {/* Description */}
                <div>
                  <NLabel>opening line</NLabel>
                  <NTextarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="how would this letter begin…"
                    rows={3}
                  />
                </div>

                {/* Status */}
                <div>
                  <NLabel>status</NLabel>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_STATUSES.map((s) => (
                      <button key={s.value}
                        onClick={() => setV("status", s.value)}
                        style={{
                          fontFamily: "'Caveat', cursive",
                          fontSize: "0.9rem",
                          padding: "0.4rem 0.9rem",
                          borderRadius: "999px",
                          border: form.status === s.value
                            ? "1px solid rgba(197,157,74,0.42)"
                            : "1px solid rgba(197,157,74,0.14)",
                          background: form.status === s.value
                            ? "rgba(155,32,53,0.20)"
                            : "rgba(197,157,74,0.03)",
                          color: form.status === s.value
                            ? L.rose
                            : "rgba(197,157,74,0.50)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <NLabel>categories</NLabel>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_CATEGORIES.map((cat) => {
                      const selected = form.categories?.includes(cat.value);
                      return (
                        <button key={cat.value}
                          onClick={() => toggleCategory(cat.value)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontFamily: "'Caveat', cursive",
                            fontSize: "0.9rem",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "999px",
                            border: selected
                              ? "1px solid rgba(197,157,74,0.40)"
                              : "1px solid rgba(197,157,74,0.14)",
                            background: selected
                              ? "rgba(197,157,74,0.12)"
                              : "rgba(197,157,74,0.03)",
                            color: selected ? L.gold : "rgba(197,157,74,0.50)",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}>
                          {cat.icon} {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Repo link */}
                <div>
                  <NLabel>repository</NLabel>
                  <NInput
                    value={form.repoLink || ""}
                    onChange={set("repoLink")}
                    placeholder="https://github.com/…"
                  />
                </div>

                {/* Live URL */}
                <div>
                  <NLabel>live url</NLabel>
                  <NInput
                    value={form.liveUrl || ""}
                    onChange={set("liveUrl")}
                    placeholder="https://noori.app"
                  />
                </div>

                {/* Milestones */}
                <div>
                  <NLabel>promises</NLabel>

                  {/* Existing milestones */}
                  {form.milestones?.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {form.milestones.map((m, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: "rgba(197,157,74,0.04)", border: "1px solid rgba(197,157,74,0.10)" }}>
                          <Circle size={12} style={{ color: "rgba(197,157,74,0.28)", flexShrink: 0 }} />
                          <span className="flex-1" style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: "0.95rem",
                            color: "rgba(232,214,178,0.85)",
                          }}>
                            {m.title}
                          </span>
                          <button onClick={() => removeMilestone(i)}
                            className="transition-colors shrink-0"
                            style={{ color: "rgba(197,157,74,0.28)" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(197,157,74,0.28)"}>
                            <Trash2 size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add milestone input */}
                  <div className="flex gap-2">
                    <input
                      ref={msRef}
                      value={msInput}
                      onChange={(e) => setMs(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
                      placeholder="promise her something… press enter"
                      style={{
                        flex: 1,
                        background: L.inputBg,
                        border: `1px solid ${L.border}`,
                        borderRadius: "0.75rem",
                        padding: "0.55rem 0.9rem",
                        fontFamily: "'Caveat', cursive",
                        fontSize: "0.95rem",
                        color: L.parchment,
                        outline: "none",
                        caretColor: L.gold,
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = L.borderHot}
                      onBlur={(e)  => e.currentTarget.style.borderColor = L.border}
                    />
                    <button onClick={addMilestone}
                      style={{
                        width: "2.4rem",
                        height: "2.4rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(197,157,74,0.20)",
                        background: "rgba(155,32,53,0.16)",
                        color: L.gold,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(155,32,53,0.26)"; e.currentTarget.style.borderColor = "rgba(197,157,74,0.34)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(155,32,53,0.16)"; e.currentTarget.style.borderColor = "rgba(197,157,74,0.20)"; }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <NLabel>postscript</NLabel>
                  <NTextarea
                    value={form.notes || ""}
                    onChange={set("notes")}
                    placeholder="notes, thoughts, loose threads…"
                    rows={3}
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 shrink-0 flex gap-3"
                style={{ borderTop: "1px solid rgba(197,157,74,0.10)" }}>
                <button onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "0.7rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(197,157,74,0.16)",
                    background: "transparent",
                    fontFamily: "'Caveat', cursive",
                    fontSize: "1rem",
                    color: "rgba(197,157,74,0.55)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = L.gold; e.currentTarget.style.borderColor = "rgba(197,157,74,0.30)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(197,157,74,0.55)"; e.currentTarget.style.borderColor = "rgba(197,157,74,0.16)"; }}>
                  never mind
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!form.title.trim() || saving}
                  onClick={handleSave}
                  style={{
                    flex: 2,
                    padding: "0.7rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(197,157,74,0.26)",
                    background: "linear-gradient(135deg, rgba(155,32,53,0.42), rgba(197,157,74,0.14))",
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    color: saving || !form.title.trim() ? "rgba(197,157,74,0.35)" : L.parchment,
                    cursor: !form.title.trim() || saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: form.title.trim() && !saving ? "0 0 24px rgba(155,32,53,0.22)" : "none",
                  }}>
                  {saving ? "sealing…" : initial ? "save & reseal ♡" : "seal it ♡"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}