"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, parseISO, subDays, isToday, isYesterday } from "date-fns";
import {
  ChevronDown, Save, Sparkles, CheckCircle, Zap,
  Wallet, BookOpen, X, Flame, Hash, Loader2,
} from "lucide-react";
import { useJournal } from "@/hooks/useIdeas";
import api from "@/lib/api";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CURSIVE = "'Dancing Script', cursive";

const MOOD_CFG = {
  great:   { emoji: "🚀", label: "Great",   color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)"  },
  good:    { emoji: "😊", label: "Good",    color: "#818cf8", bg: "rgba(99,102,241,0.1)",   border: "rgba(99,102,241,0.3)"  },
  neutral: { emoji: "😐", label: "Neutral", color: "#64748b", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.2)" },
  bad:     { emoji: "😔", label: "Low",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)"  },
  awful:   { emoji: "😞", label: "Rough",   color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.3)" },
};

const STICKERS = [
  { id: "star",      label: "⭐ Star",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 8l4.5 13.5H48l-11 8 4.2 13.5L30 35l-11.2 8 4.2-13.5-11-8h13.5z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/><circle cx="30" cy="27" r="3.5" fill="#fef9c3" opacity="0.7"/></svg>` },
  { id: "heart",     label: "❤️ Heart",     svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 50s-22-14-22-27a12 12 0 0124 0 12 12 0 0124 0c0 13-22 27-22 27z" fill="#f87171" stroke="#ef4444" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="22" cy="24" rx="4" ry="5" fill="#fca5a5" opacity="0.5" transform="rotate(-20 22 24)"/></svg>` },
  { id: "plant",     label: "🌿 Plant",     svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="42" width="16" height="10" rx="3" fill="#92400e" stroke="#78350f" stroke-width="1"/><path d="M30 42V20" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="22" cy="28" rx="9" ry="7" fill="#4ade80" stroke="#16a34a" stroke-width="1.5" transform="rotate(-20 22 28)"/><ellipse cx="38" cy="24" rx="9" ry="7" fill="#22c55e" stroke="#16a34a" stroke-width="1.5" transform="rotate(15 38 24)"/><ellipse cx="30" cy="18" rx="7" ry="6" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/></svg>` },
  { id: "coffee",    label: "☕ Coffee",    svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 28h28l-4 20H18z" fill="#d97706" stroke="#b45309" stroke-width="1.5" stroke-linejoin="round"/><rect x="42" y="30" width="6" height="10" rx="3" fill="#d97706" stroke="#b45309" stroke-width="1.5"/><path d="M22 14c0 0 2-4 0-6M30 14c0 0 2-4 0-6M38 14c0 0 2-4 0-6" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/></svg>` },
  { id: "moon",      label: "🌙 Moon",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38 12a20 20 0 11-26 26A16 16 0 0038 12z" fill="#818cf8" stroke="#6366f1" stroke-width="1.5"/><circle cx="26" cy="22" r="2.5" fill="#e0e7ff" opacity="0.5"/><circle cx="34" cy="30" r="1.5" fill="#e0e7ff" opacity="0.4"/></svg>` },
  { id: "fire",      label: "🔥 Fire",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 52c-12 0-18-8-18-16 0-6 4-10 8-12-1 4 1 8 4 10 0-8 4-14 10-20 2 6 6 10 6 16a8 8 0 01-8 8 8 8 0 008-2c2-2 2-6 0-8 2 2 8 8 2 16-2 4-6 8-12 8z" fill="#f97316" stroke="#ea580c" stroke-width="1" stroke-linejoin="round"/><path d="M30 44c-4 0-8-4-8-8 0-2 1-4 3-5 0 2 1 4 3 5 0-4 2-6 4-9 1 3 3 5 3 8a4 4 0 01-5-1z" fill="#fbbf24"/></svg>` },
  { id: "rainbow",   label: "🌈 Rainbow",   svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 44a22 22 0 0144 0" stroke="#f87171" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M13 44a17 17 0 0134 0" stroke="#fb923c" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M18 44a12 12 0 0124 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M22 44a8 8 0 0116 0" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M26 44a4 4 0 018 0" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>` },
  { id: "lightning", label: "⚡ Lightning", svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 8L16 34h14l-4 18L46 26H32z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/></svg>` },
  { id: "gem",       label: "💎 Gem",       svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 20l12-10 12 10-12 28z" fill="#67e8f9" stroke="#0891b2" stroke-width="1.5" stroke-linejoin="round"/><path d="M18 20h24M30 10l-6 10 6 28 6-28z" stroke="#0891b2" stroke-width="1" opacity="0.5"/></svg>` },
  { id: "cloud",     label: "🌧️ Cloud",    svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 40a10 10 0 010-20 1 1 0 010 0 12 12 0 0122-6 8 8 0 010 26z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5"/><line x1="22" y1="47" x2="20" y2="53" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="47" x2="30" y2="55" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="47" x2="36" y2="53" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/></svg>` },
  { id: "sparkle",   label: "✨ Sparkle",   svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 8v10M30 42v10M8 30h10M42 30h10" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/><path d="M16 16l7 7M37 37l7 7M16 44l7-7M37 23l7-7" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="5" fill="#fef3c7" stroke="#fbbf24" stroke-width="1.5"/></svg>` },
  { id: "flower",    label: "🌸 Flower",    svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="22" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><ellipse cx="30" cy="11" rx="5" ry="7" fill="#f9a8d4" stroke="#ec4899" stroke-width="1.2"/><ellipse cx="30" cy="33" rx="5" ry="7" fill="#f9a8d4" stroke="#ec4899" stroke-width="1.2"/><ellipse cx="19" cy="22" rx="7" ry="5" fill="#fbcfe8" stroke="#ec4899" stroke-width="1.2"/><ellipse cx="41" cy="22" rx="7" ry="5" fill="#fbcfe8" stroke="#ec4899" stroke-width="1.2"/><path d="M30 28v16" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/></svg>` },
  { id: "book",      label: "📖 Book",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="22" height="40" rx="3" fill="#818cf8" stroke="#6366f1" stroke-width="1.5"/><rect x="28" y="10" width="22" height="40" rx="3" fill="#a5b4fc" stroke="#6366f1" stroke-width="1.5"/><path d="M30 12v36" stroke="#6366f1" stroke-width="1.5"/></svg>` },
  { id: "cat",       label: "🐱 Cat",       svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="36" rx="18" ry="16" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M14 26l-4-12 10 6M46 26l4-12-10 6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/><circle cx="23" cy="35" r="3" fill="white"/><circle cx="37" cy="35" r="3" fill="white"/><circle cx="24" cy="35" r="1.5" fill="#1e293b"/><circle cx="38" cy="35" r="1.5" fill="#1e293b"/></svg>` },
  { id: "sun",       label: "☀️ Sun",       svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="11" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M30 8v6M30 46v6M8 30h6M46 30h6M14 14l4 4M42 42l4 4M42 14l-4 4M18 42l-4 4" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id: "balloon",   label: "🎈 Balloon",   svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="24" rx="16" ry="19" fill="#f87171" stroke="#ef4444" stroke-width="1.5"/><path d="M30 43l2 4-4 2 2-4-2-4 4 2z" fill="#ef4444"/><line x1="30" y1="49" x2="30" y2="56" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/></svg>` },
  { id: "butterfly", label: "🦋 Butterfly", svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="18" cy="22" rx="14" ry="10" fill="#a78bfa" stroke="#7c3aed" stroke-width="1.2" transform="rotate(-20 18 22)"/><ellipse cx="42" cy="22" rx="14" ry="10" fill="#818cf8" stroke="#4f46e5" stroke-width="1.2" transform="rotate(20 42 22)"/><ellipse cx="20" cy="38" rx="10" ry="7" fill="#c4b5fd" stroke="#7c3aed" stroke-width="1.2" transform="rotate(15 20 38)"/><ellipse cx="40" cy="38" rx="10" ry="7" fill="#a5b4fc" stroke="#4f46e5" stroke-width="1.2" transform="rotate(-15 40 38)"/><path d="M30 16 Q28 26 30 44 Q32 26 30 16z" fill="#4c1d95" stroke="#3b0764" stroke-width="1"/></svg>` },
  { id: "pizza",     label: "🍕 Pizza",     svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 8 L52 50 L8 50 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M30 8 L52 50 L8 50 Z" fill="#f97316" opacity="0.6"/><circle cx="30" cy="32" r="3" fill="#ef4444"/><circle cx="22" cy="40" r="2.5" fill="#ef4444"/><circle cx="38" cy="40" r="2.5" fill="#ef4444"/></svg>` },
  { id: "trophy",    label: "🏆 Trophy",    svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h24v18a12 12 0 01-24 0z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M42 14h6a4 4 0 010 8h-6M18 14h-6a4 4 0 000 8h6" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/><rect x="24" y="38" width="12" height="8" rx="2" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><rect x="18" y="46" width="24" height="5" rx="2.5" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/></svg>` },
  { id: "music",     label: "🎵 Music",     svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 42V16l24-6v26" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="44" r="6" fill="#818cf8" stroke="#6366f1" stroke-width="1.5"/><circle cx="44" cy="38" r="6" fill="#a5b4fc" stroke="#6366f1" stroke-width="1.5"/></svg>` },
  { id: "mountain",  label: "⛰️ Mountain",  svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 52 L24 18 L42 52 Z" fill="#64748b" stroke="#475569" stroke-width="1.5" stroke-linejoin="round"/><path d="M22 52 L36 24 L50 52 Z" fill="#94a3b8" stroke="#64748b" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 18 L20 26 L28 26 Z" fill="white" opacity="0.9"/><path d="M36 24 L32 32 L40 32 Z" fill="white" opacity="0.9"/></svg>` },
  { id: "rocket",    label: "🚀 Rocket",    svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 8 Q42 16 42 34 L30 44 L18 34 Q18 16 30 8Z" fill="#818cf8" stroke="#6366f1" stroke-width="1.5"/><circle cx="30" cy="26" r="6" fill="#e0e7ff" stroke="#a5b4fc" stroke-width="1.2"/><path d="M18 34 L10 46 L22 42 Z" fill="#f87171" stroke="#ef4444" stroke-width="1"/><path d="M42 34 L50 46 L38 42 Z" fill="#f87171" stroke="#ef4444" stroke-width="1"/></svg>` },
  { id: "wave",      label: "👋 Wave",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 32 Q20 20 30 30 Q40 40 50 28" stroke="#34d399" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M10 40 Q20 28 30 38 Q40 48 50 36" stroke="#6ee7b7" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/></svg>` },
  { id: "dice",      label: "🎲 Dice",      svg: `<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="44" height="44" rx="10" fill="#818cf8" stroke="#6366f1" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="white"/><circle cx="40" cy="20" r="4" fill="white"/><circle cx="30" cy="30" r="4" fill="white"/><circle cx="20" cy="40" r="4" fill="white"/><circle cx="40" cy="40" r="4" fill="white"/></svg>` },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const buildDays = () => Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"));
const countWords = (t) => t?.trim() ? t.trim().split(/\s+/).length : 0;
const dayLabel = (ds) => {
  const d = parseISO(ds);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE");
};

// ─────────────────────────────────────────────────────────────────────────────
// StickerBtn — shared small sticker button
// ─────────────────────────────────────────────────────────────────────────────
function StickerBtn({ s, size = 26, selected, onClick }) {
  return (
    <button
      key={s.id}
      title={s.label}
      onClick={onClick}
      className="flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
      style={{
        width: size + 10, height: size + 10,
        background: selected ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
        border: selected ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: selected ? "0 0 8px rgba(99,102,241,0.4)" : "none",
        flexShrink: 0,
      }}
    >
      <span style={{ display: "inline-block", width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: s.svg }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StickerPanel — left sidebar (md+)
// ─────────────────────────────────────────────────────────────────────────────
function StickerPanel({ pickedId, onPick }) {
  return (
    <div
      className="hidden md:flex flex-col w-20 shrink-0 overflow-hidden"
      style={{ borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
    >
      <div className="pt-5 pb-2 flex justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Stickers</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {STICKERS.map((s) => (
            <StickerBtn
              key={s.id}
              s={s}
              size={24}
              selected={pickedId === s.id}
              onClick={() => onPick(pickedId === s.id ? null : s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StickerTray — popup inside focus mode bottom bar
// ─────────────────────────────────────────────────────────────────────────────
function StickerTray({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5"
        style={{
          background: open ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: open ? "#a5b4fc" : "#64748b",
        }}
      >
        ✦ Stickers
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 rounded-2xl p-3 z-20"
          style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", width: 280 }}
        >
          <div className="grid grid-cols-6 gap-2">
            {STICKERS.map((s) => (
              <StickerBtn key={s.id} s={s} size={24} onClick={() => { onPick(s); setOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileStickerBar — floating pill + bottom tray (mobile only)
// ─────────────────────────────────────────────────────────────────────────────
function MobileStickerBar({ pickedId, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95"
        style={{
          background: open ? "rgba(99,102,241,0.9)" : "rgba(15,15,25,0.95)",
          border: "1px solid rgba(99,102,241,0.4)",
          color: open ? "white" : "#818cf8",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ fontSize: 16 }}>✦</span>
        {open ? "Close" : "Stickers"}
      </button>

      {open && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-20 pt-4 px-4"
          style={{ background: "rgba(10,10,18,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 text-center">
            Tap a sticker, then tap an entry
          </p>
          <div className="grid grid-cols-8 gap-2">
            {STICKERS.map((s) => (
              <StickerBtn
                key={s.id}
                s={s}
                size={26}
                selected={pickedId === s.id}
                onClick={() => { onPick(pickedId === s.id ? null : s); setOpen(false); }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FocusMode — full-screen writing overlay
// ─────────────────────────────────────────────────────────────────────────────
function FocusMode({ dateStr, initialContent, initialMood, initialStickers, onSave, onClose }) {
  const [content, setContent]   = useState(initialContent || "");
  const [mood, setMood]         = useState(initialMood || "neutral");
  const [stickers, setStickers] = useState(initialStickers || []);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);
  const textareaRef = useRef(null);
  const autosaveRef = useRef(null);
  const moodCfg = MOOD_CFG[mood];

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 80); }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [content]);

  useEffect(() => {
    if (!dirty) return;
    clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => doSave(true), 2500);
    return () => clearTimeout(autosaveRef.current);
  }, [content, mood, stickers, dirty]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") doClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, mood, stickers, dirty]);

  const doSave = async (silent = false) => {
    try {
      setSaving(true);
      await onSave({ date: dateStr, content, mood, stickers });
      setDirty(false);
      if (!silent) toast.success("Saved");
    } catch {
      if (!silent) toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doClose = async () => {
    if (dirty) await doSave(true);
    onClose({ content, mood, stickers });
  };

  const addSticker = (s) => {
    const x = 60 + Math.random() * 40;
    const y = 60 + Math.random() * 80;
    setStickers((prev) => [...prev, { ...s, instanceId: `${Date.now()}-${Math.random()}`, x, y, size: 54 }]);
    setDirty(true);
  };

  const removeSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.instanceId !== id));
    setDirty(true);
  };

  const wc = countWords(content);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#06060e" }}>

      {/* ── Mobile header ── */}
      <div className="sm:hidden shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Back + date + save */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={doClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}
          >
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{dayLabel(dateStr)}</p>
            <p className="text-xs text-slate-600">{format(parseISO(dateStr), "MMM d, yyyy")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <Loader2 size={13} className="animate-spin text-slate-600" />}
            {dirty && !saving && <span className="text-[10px]" style={{ color: "#fbbf24" }}>•</span>}
            <button
              onClick={() => doSave(false)}
              disabled={!dirty || saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7" }}
            >
              Save
            </button>
          </div>
        </div>
        {/* Mood row */}
        <div className="flex items-center justify-around px-4 pb-3">
          {Object.entries(MOOD_CFG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setMood(key); setDirty(true); }}
              className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all active:scale-95"
              style={mood === key ? { background: cfg.bg, border: `1px solid ${cfg.border}` } : { opacity: 0.3 }}
            >
              <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
              {mood === key && (
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden sm:flex items-center justify-between px-8 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p className="text-sm font-semibold text-slate-200">{dayLabel(dateStr)}</p>
          <p className="text-xs text-slate-600">{format(parseISO(dateStr), "MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {Object.entries(MOOD_CFG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setMood(key); setDirty(true); }}
              title={cfg.label}
              className="rounded-xl text-xl flex items-center justify-center transition-all"
              style={{ width: 38, height: 38, ...(mood === key ? { background: cfg.bg, border: `1.5px solid ${cfg.border}`, transform: "scale(1.15)" } : { opacity: 0.22 }) }}
            >
              {cfg.emoji}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-700 tabular-nums">{wc}w</span>
          {saving && <Loader2 size={13} className="animate-spin text-slate-600" />}
          {dirty && !saving && <span className="text-[10px]" style={{ color: "#fbbf24" }}>unsaved</span>}
          <button
            onClick={() => doSave(false)}
            disabled={!dirty || saving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-20"
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#6ee7b7" }}
          >
            <Save size={11} className="inline mr-1" />Save
          </button>
          <button onClick={doClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Writing area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative max-w-[720px] mx-auto px-5 sm:px-16 py-6 sm:py-10">
          <div className="w-10 h-0.5 rounded-full mb-6 opacity-60" style={{ background: moodCfg.color }} />

          {stickers.map((s) => (
            <div
              key={s.instanceId}
              className="absolute group"
              style={{ left: s.x, top: s.y, zIndex: 10, cursor: "grab" }}
            >
              <div style={{ width: s.size, height: s.size }} dangerouslySetInnerHTML={{ __html: s.svg }} />
              <button
                onClick={() => removeSticker(s.instanceId)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex text-[9px]"
              >
                ×
              </button>
            </div>
          ))}

          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-slate-100 placeholder-slate-800 resize-none focus:outline-none relative"
            style={{
              fontFamily: CURSIVE,
              fontSize: "clamp(18px, 4vw, 22px)",
              lineHeight: 1.85,
              letterSpacing: "0.01em",
              minHeight: "65vh",
              zIndex: 1,
            }}
            placeholder="Write freely. This is your space."
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
          />
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="px-4 sm:px-8 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3">
          <StickerTray onPick={addSticker} />
          <span className="text-xs text-slate-800 hidden sm:inline">Esc to close</span>
        </div>
        {wc >= 20 && (
          <span className="text-xs text-slate-700">~{Math.ceil(wc / 200)} min · {wc}w</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MoodTimeline — 7-day emoji row
// ─────────────────────────────────────────────────────────────────────────────
function MoodTimeline({ trend }) {
  if (!trend?.length) return null;
  return (
    <div className="relative py-2">
      <div
        className="absolute top-1/2 left-5 right-5 h-px"
        style={{ background: "rgba(255,255,255,0.05)", transform: "translateY(-50%)" }}
      />
      <div className="flex items-center justify-between relative">
        {trend.map(({ date, mood }) => {
          const cfg = mood ? MOOD_CFG[mood] : null;
          const isT = isToday(parseISO(date));
          return (
            <div key={date} className="flex flex-col items-center gap-1.5" title={format(parseISO(date), "MMM d")}>
              <div
                className="flex items-center justify-center rounded-full transition-all relative"
                style={{
                  width: isT ? 42 : 36,
                  height: isT ? 42 : 36,
                  background: cfg ? cfg.bg : "rgba(255,255,255,0.03)",
                  border: cfg ? `2px solid ${cfg.border}` : isT ? "2px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isT && cfg ? `0 0 18px ${cfg.color}45` : "none",
                  fontSize: isT ? 22 : 18,
                }}
              >
                {cfg ? cfg.emoji : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1e293b", display: "block" }} />}
                {isT && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full" style={{ background: "#6366f1", border: "2px solid #07070f" }} />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: isT ? "#818cf8" : "#2d3748" }}>
                {format(parseISO(date), "EEE")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DayInsights
// ─────────────────────────────────────────────────────────────────────────────
function DayInsights({ dateStr }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/journal/insights/${dateStr}`)
      .then((r) => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [dateStr]);

  if (loading) return (
    <div className="flex items-center gap-2 py-2">
      <Loader2 size={12} className="animate-spin text-slate-700" />
      <span className="text-xs text-slate-700">Loading…</span>
    </div>
  );
  if (!data) return null;

  const hasAny = data.tasksCompleted?.length || data.habitLogs?.length || data.budgetEntries?.length || data.learningItems?.length;
  if (!hasAny) return <p className="text-xs text-slate-800 py-1">Nothing logged this day.</p>;

  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {data.tasksCompleted?.length > 0 && (
        <MiniChips icon={<CheckCircle size={10} />} label="Tasks" color="#34d399" items={data.tasksCompleted.map((t) => t.title)} />
      )}
      {data.habitLogs?.length > 0 && (
        <MiniChips icon={<Zap size={10} />} label="Habits" color="#fbbf24" items={data.habitLogs.map((h) => `${h.habitIcon} ${h.habitTitle}`)} />
      )}
      {data.budgetEntries?.length > 0 && (
        <MiniChips icon={<Wallet size={10} />} label="Budget" color="#818cf8"
          items={data.budgetEntries.map((b) => `${b.type === "income" ? "+" : "−"}₹${Number(b.amount).toLocaleString("en-IN")} ${b.title}`)} />
      )}
      {data.learningItems?.length > 0 && (
        <MiniChips icon={<BookOpen size={10} />} label="Learning" color="#60a5fa"
          items={data.learningItems.map((l) => `${l.title} (${l.progress}%)`)} />
      )}
    </div>
  );
}

function MiniChips({ icon, label, color, items }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 3).map((item, i) => (
          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: `${color}12`, color: `${color}cc`, border: `1px solid ${color}22` }}>
            {item}
          </span>
        ))}
        {items.length > 3 && <span className="text-[11px] text-slate-700 px-1">+{items.length - 3}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineReflection
// ─────────────────────────────────────────────────────────────────────────────
function InlineReflection({ dateStr, content, mood, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post("/journal/reflect", { content, date: dateStr, mood })
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Reflection failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300">AI Reflection</span>
        </div>
        <button onClick={onClose} className="text-slate-700 hover:text-slate-400 transition-colors">
          <X size={12} />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={12} className="animate-spin text-indigo-600" />
          <span className="text-xs text-slate-700">Thinking…</span>
        </div>
      ) : data ? (
        <div className="space-y-2.5">
          <p className="text-sm text-slate-300 leading-relaxed">{data.summary}</p>
          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
            {data.emotionalTone}
          </span>
          <div className="rounded-xl px-3 py-2.5 text-sm italic"
            style={{ borderLeft: "2px solid rgba(99,102,241,0.4)", background: "rgba(255,255,255,0.02)", color: "#cbd5e1" }}>
            "{data.question}"
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-700">Could not generate.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EntryCard
// ─────────────────────────────────────────────────────────────────────────────
function EntryCard({ dateStr, entryData, onOpenFocus, onStickerDrop, pickedSticker, onClearPick }) {
  const [expanded, setExpanded]         = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showReflect, setShowReflect]   = useState(false);
  const [dragOver, setDragOver]         = useState(false);

  const content  = entryData?.content  || "";
  const mood     = entryData?.mood     || null;
  const stickers = entryData?.stickers || [];
  const moodCfg  = mood ? MOOD_CFG[mood] : null;
  const wc       = countWords(content);
  const hasEntry = content.trim().length > 0;
  const isT      = isToday(parseISO(dateStr));
  const isY      = isYesterday(parseISO(dateStr));
  const preview  = content.length > 150 ? content.slice(0, 150).trim() + "…" : content;

  const handleCardClick = () => {
    if (pickedSticker) { onStickerDrop(dateStr, pickedSticker); onClearPick(); return; }
    if (hasEntry) setExpanded((v) => !v);
  };

  return (
    <div className="relative group mb-2">
      {/* Timeline dot */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center" style={{ width: 24 }}>
        <div
          className="h-3 w-3 rounded-full shrink-0 mt-5 transition-all"
          style={{
            background: moodCfg ? moodCfg.color : isT ? "#6366f1" : "#1e293b",
            boxShadow: moodCfg ? `0 0 8px ${moodCfg.color}50` : isT ? "0 0 10px rgba(99,102,241,0.5)" : "none",
          }}
        />
        <div className="flex-1 w-px mt-1" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Card */}
      <div
        className="ml-9 rounded-2xl transition-all duration-200 overflow-hidden cursor-pointer"
        style={{
          background: expanded ? "rgba(255,255,255,0.03)" : hasEntry ? "rgba(255,255,255,0.02)" : "transparent",
          border: dragOver
            ? "1.5px dashed rgba(99,102,241,0.5)"
            : pickedSticker
            ? "1.5px dashed rgba(99,102,241,0.3)"
            : expanded
            ? "1px solid rgba(255,255,255,0.07)"
            : hasEntry
            ? "1px solid rgba(255,255,255,0.04)"
            : "1px solid rgba(255,255,255,0.02)",
          ...(moodCfg && hasEntry ? { borderLeft: `3px solid ${moodCfg.color}55` } : {}),
        }}
        onClick={handleCardClick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          try { const s = JSON.parse(e.dataTransfer.getData("sticker")); onStickerDrop(dateStr, s); } catch {}
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold" style={{ color: isT ? "#a5b4fc" : isY ? "#94a3b8" : "#475569" }}>
                {dayLabel(dateStr)}
              </span>
              <span className="text-xs text-slate-700">{format(parseISO(dateStr), "MMM d")}</span>
              {moodCfg && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: moodCfg.bg, color: moodCfg.color, border: `1px solid ${moodCfg.border}` }}
                >
                  {moodCfg.emoji} {moodCfg.label}
                </span>
              )}
              {stickers.length > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  {stickers.slice(0, 4).map((s) => (
                    <span
                      key={s.instanceId}
                      title={s.label}
                      style={{ display: "inline-block", width: 18, height: 18 }}
                      dangerouslySetInnerHTML={{ __html: s.svg }}
                    />
                  ))}
                  {stickers.length > 4 && <span className="text-[10px] text-slate-700">+{stickers.length - 4}</span>}
                </div>
              )}
            </div>
            {hasEntry && !expanded && (
              <p className="text-sm mt-0.5 truncate leading-relaxed" style={{ color: "#4b5563" }}>
                {preview}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {hasEntry && (
              <span className="text-[10px] text-slate-700 hidden sm:flex items-center gap-1">
                <Hash size={9} />{wc}w
              </span>
            )}
            {!hasEntry ? (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFocus(dateStr, "", "neutral", []); }}
                className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: isT ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                  border: isT ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  color: isT ? "#a5b4fc" : "#475569",
                }}
              >
                {isT ? "✦ Write today" : "Add entry"}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFocus(dateStr, content, mood, stickers); }}
                className="text-[11px] px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-400 transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && hasEntry && (
          <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            <p className="leading-relaxed whitespace-pre-wrap mb-3" style={{ fontFamily: CURSIVE, fontSize: 18, color: "#cbd5e1", lineHeight: 1.8 }}>
              {content}
            </p>
            {stickers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {stickers.map((s) => (
                  <span key={s.instanceId} title={s.label} style={{ display: "inline-block", width: 34, height: 34 }}
                    dangerouslySetInnerHTML={{ __html: s.svg }} />
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
              <button
                onClick={() => setShowInsights((v) => !v)}
                className="text-xs font-medium transition-all"
                style={{ color: showInsights ? "#fbbf24" : "#475569" }}
              >
                ✦ {showInsights ? "Hide summary" : "Day summary"}
              </button>
              {content.length >= 20 && (
                <button
                  onClick={() => setShowReflect((v) => !v)}
                  className="text-xs font-medium transition-all flex items-center gap-1.5"
                  style={{ color: showReflect ? "#a5b4fc" : "#475569" }}
                >
                  <Sparkles size={11} />{showReflect ? "Hide" : "AI reflect"}
                </button>
              )}
            </div>
            {showInsights && <DayInsights dateStr={dateStr} />}
            {showReflect && <InlineReflection dateStr={dateStr} content={content} mood={mood} onClose={() => setShowReflect(false)} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RightGutter — decorative (xl only)
// ─────────────────────────────────────────────────────────────────────────────
function RightGutter() {
  return (
    <div
      className="hidden xl:flex flex-col items-center pt-8 px-2 w-[76px] shrink-0 gap-5 overflow-hidden"
      style={{ borderLeft: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
    >
      <div style={{ animation: "slowspin 20s linear infinite" }}>
        <svg viewBox="0 0 44 44" width={32} height={32}>
          <path d="M22 4v8M22 32v8M4 22h8M32 22h8M9 9l5.5 5.5M29.5 29.5L35 35M9 35l5.5-5.5M29.5 14.5L35 9" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="22" cy="22" r="5" fill="#6366f1" opacity="0.8"/>
          <circle cx="22" cy="22" r="2.5" fill="#a5b4fc"/>
        </svg>
      </div>
      <div className="flex flex-col items-center gap-2">
        {["#6366f1","#818cf8","#a5b4fc","#c7d2fe","rgba(255,255,255,0.15)","rgba(255,255,255,0.07)","rgba(255,255,255,0.03)"].map((c, i) => (
          <div key={i} className="rounded-full" style={{ width: i < 2 ? 7 : i < 4 ? 5 : 4, height: i < 2 ? 7 : i < 4 ? 5 : 4, background: c }} />
        ))}
      </div>
      <svg viewBox="0 0 40 40" width={32} height={32}>
        <path d="M28 10a18 18 0 11-18 20A13 13 0 0028 10z" fill="#818cf8" opacity="0.7"/>
        <circle cx="18" cy="16" r="2" fill="#e0e7ff" opacity="0.6"/>
        <circle cx="24" cy="26" r="1.5" fill="#c7d2fe" opacity="0.5"/>
      </svg>
      <svg viewBox="0 0 20 80" width={16} height={64}>
        <path d="M4 4 Q16 16 4 28 Q16 40 4 52 Q16 64 4 76" stroke="#34d399" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
      <svg viewBox="0 0 40 40" width={30} height={30}>
        <path d="M20 4l2.8 8.6H32l-7.4 5.3 2.8 8.6L20 21.2l-7.4 5.3 2.8-8.6L8 12.6h9.2z" fill="#fbbf24" opacity="0.65" stroke="#f59e0b" strokeWidth="0.5"/>
      </svg>
      <svg viewBox="0 0 30 36" width={22} height={28}>
        <path d="M15 2l13 10-13 22L2 12z" fill="#67e8f9" opacity="0.5" stroke="#0891b2" strokeWidth="1"/>
      </svg>
      <div className="flex flex-col items-center gap-3">
        {[0,1,2,3,4].map((i) => (
          <div key={i} className="rounded-full" style={{
            width: i % 2 === 0 ? 5 : 3,
            height: i % 2 === 0 ? 5 : 3,
            background: i % 3 === 0 ? "rgba(251,191,36,0.4)" : i % 3 === 1 ? "rgba(99,102,241,0.35)" : "rgba(52,211,153,0.3)",
            marginLeft: i % 2 === 0 ? 4 : -4,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const DAYS = buildDays();

  // Inject keyframe
  useEffect(() => {
    const id = "sahilos-journal-anim";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = "@keyframes slowspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }";
      document.head.appendChild(el);
    }
  }, []);

  const [entryMap, setEntryMap]           = useState({});
  const [loadedDates, setLoaded]          = useState(new Set());
  const [streak, setStreak]               = useState(0);
  const [totalEntries, setTotal]          = useState(0);
  const [moodTrend, setMoodTrend]         = useState([]);
  const [focusDate, setFocusDate]         = useState(null);
  const [focusContent, setFocusContent]   = useState("");
  const [focusMood, setFocusMood]         = useState("neutral");
  const [focusStickers, setFocusStickers] = useState([]);
  const [daysShown, setDaysShown]         = useState(10);
  const [pickedSticker, setPickedSticker] = useState(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const { upsertEntry } = useJournal();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Load entries
  useEffect(() => {
    const toLoad = DAYS.slice(0, daysShown).filter((d) => !loadedDates.has(d));
    if (!toLoad.length) return;
    setLoaded((prev) => new Set([...prev, ...toLoad]));
    toLoad.forEach((ds) => {
      api.get(`/journal/date/${ds}`)
        .then((r) => {
          const { content, mood } = r.data.data;
          if (content) setEntryMap((prev) => ({ ...prev, [ds]: { content, mood: mood || "neutral", stickers: prev[ds]?.stickers || [] } }));
        })
        .catch(() => {});
    });
  }, [daysShown]);

  // Load stickers from sessionStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("sahilos_stickers") || "{}");
      setEntryMap((prev) => {
        const m = { ...prev };
        Object.entries(saved).forEach(([ds, stickers]) => {
          m[ds] = { ...(m[ds] || { content: "", mood: "neutral" }), stickers };
        });
        return m;
      });
    } catch {}
  }, []);

  // Load streak + mood trend
  useEffect(() => {
    api.get("/journal/streak").then((r) => { setStreak(r.data.data.streak); setTotal(r.data.data.totalEntries); }).catch(() => {});
    api.get("/journal/mood-trend").then((r) => setMoodTrend(r.data.data)).catch(() => {});
  }, []);

  const openFocus = (ds, content, mood, stickers) => {
    setFocusDate(ds);
    setFocusContent(content || "");
    setFocusMood(mood || "neutral");
    setFocusStickers(stickers || []);
  };

  const handleFocusSave = useCallback(async ({ date, content, mood, stickers }) => {
    await upsertEntry({ date, content, mood });
    setEntryMap((prev) => ({ ...prev, [date]: { content, mood, stickers: stickers || [] } }));
    try {
      const saved = JSON.parse(sessionStorage.getItem("sahilos_stickers") || "{}");
      saved[date] = stickers || [];
      sessionStorage.setItem("sahilos_stickers", JSON.stringify(saved));
    } catch {}
    api.get("/journal/streak").then((r) => { setStreak(r.data.data.streak); setTotal(r.data.data.totalEntries); }).catch(() => {});
    api.get("/journal/mood-trend").then((r) => setMoodTrend(r.data.data)).catch(() => {});
  }, [upsertEntry]);

  const handleFocusClose = ({ content, mood, stickers }) => {
    if (focusDate) {
      setEntryMap((prev) => ({
        ...prev,
        [focusDate]: { content: content || prev[focusDate]?.content || "", mood: mood || "neutral", stickers: stickers || [] },
      }));
    }
    setFocusDate(null);
  };

  const handleStickerDrop = (ds, sticker) => {
    const instance = { ...sticker, instanceId: `${Date.now()}-${Math.random()}`, x: 0, y: 0, size: 40 };
    setEntryMap((prev) => {
      const existing = prev[ds] || { content: "", mood: "neutral", stickers: [] };
      const updated = { ...existing, stickers: [...(existing.stickers || []), instance] };
      try {
        const saved = JSON.parse(sessionStorage.getItem("sahilos_stickers") || "{}");
        saved[ds] = updated.stickers;
        sessionStorage.setItem("sahilos_stickers", JSON.stringify(saved));
      } catch {}
      return { ...prev, [ds]: updated };
    });
    toast.success(`${sticker.label} added!`, { duration: 1500 });
  };

  const todayEntry = entryMap[todayStr];

  return (
    <>
      {focusDate && (
        <FocusMode
          dateStr={focusDate}
          initialContent={focusContent}
          initialMood={focusMood}
          initialStickers={focusStickers}
          onSave={handleFocusSave}
          onClose={handleFocusClose}
        />
      )}

      <div className="flex h-full overflow-hidden" style={{ background: "#07070f" }}>

        {/* Left sticker panel — md+ */}
        <StickerPanel
          pickedId={pickedSticker?.id}
          onPick={(s) => {
            setPickedSticker(s);
            if (s) toast(`Click an entry to add "${s.label}"`, { duration: 2000 });
          }}
        />

        {/* Main column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* ── Header ── */}
          <div
            className="px-6 sm:px-8 pt-4 sm:pt-7 pb-4 sm:pb-5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {/* Title row — always visible */}
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-600" style={{ fontFamily: CURSIVE, fontSize: "clamp(14px, 3vw, 16px)" }}>The</span>
                  <h1 className="text-slate-100" style={{ fontFamily: CURSIVE, fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1 }}>
                    Chronicle
                  </h1>
                </div>
                {!headerCollapsed && (
                  <p className="text-xs text-slate-700 mt-1">Your private record of days</p>
                )}
              </div>

              {/* Stats + collapse toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <Flame size={13} style={{ color: "#fbbf24" }} />
                    <div>
                      <p className="font-bold tabular-nums leading-none" style={{ color: "#fbbf24" }}>{streak}</p>
                      <p className="text-[9px] text-slate-700 mt-0.5">streak</p>
                    </div>
                  </div>
                )}
                {totalEntries > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <BookOpen size={13} style={{ color: "#818cf8" }} />
                    <div>
                      <p className="font-bold tabular-nums leading-none" style={{ color: "#818cf8" }}>{totalEntries}</p>
                      <p className="text-[9px] text-slate-700 mt-0.5">entries</p>
                    </div>
                  </div>
                )}
                {/* Collapse toggle — mobile only */}
                <button
                  onClick={() => setHeaderCollapsed((v) => !v)}
                  className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  style={{ color: "#475569", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {headerCollapsed ? "Show ↓" : "Hide ↑"}
                </button>
              </div>
            </div>

            {/* Collapsible content — hidden on mobile when collapsed, always visible on sm+ */}
            <div className={headerCollapsed ? "hidden sm:block" : "block"}>
              {moodTrend.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1">This week</p>
                  <MoodTimeline trend={moodTrend} />
                </div>
              )}

              {!todayEntry?.content && (
                <button
                  onClick={() => openFocus(todayStr, "", "neutral", [])}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px dashed rgba(99,102,241,0.22)", color: "#6366f1" }}
                >
                  ✦ Write today's entry
                </button>
              )}

              {pickedSticker && (
                <div
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                >
                  <span style={{ display: "inline-block", width: 22, height: 22 }} dangerouslySetInnerHTML={{ __html: pickedSticker.svg }} />
                  <span>{`Click any entry to place "${pickedSticker.label}"`}</span>
                  <button onClick={() => setPickedSticker(null)} className="ml-auto"><X size={11} /></button>
                </div>
              )}
            </div>
          </div>

          {/* ── Timeline feed ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-xl mx-auto px-5 sm:px-8 pt-5 pb-16">
              {DAYS.slice(0, daysShown).map((ds) => (
                <EntryCard
                  key={ds}
                  dateStr={ds}
                  entryData={entryMap[ds] || null}
                  onOpenFocus={openFocus}
                  onStickerDrop={handleStickerDrop}
                  pickedSticker={pickedSticker}
                  onClearPick={() => setPickedSticker(null)}
                />
              ))}

              {daysShown < 30 && (
                <button
                  onClick={() => setDaysShown((v) => Math.min(v + 10, 30))}
                  className="w-full mt-1 py-3 flex items-center justify-center gap-1.5 transition-colors"
                  style={{ color: "#334155" }}
                >
                  <ChevronDown size={13} />Load older entries
                </button>
              )}
              {daysShown >= 30 && (
                <p className="text-center mt-4 text-xs" style={{ color: "#1e293b" }}>Showing last 30 days</p>
              )}
            </div>
          </div>
        </div>

        {/* Right decorative gutter — xl only */}
        <RightGutter />
      </div>

      {/* Mobile sticker bar — floats above timeline */}
      <MobileStickerBar
        pickedId={pickedSticker?.id}
        onPick={(s) => {
          setPickedSticker(s);
          if (s) toast(`Tap any entry to add "${s.label}"`, { duration: 2000 });
        }}
      />
    </>
  );
}