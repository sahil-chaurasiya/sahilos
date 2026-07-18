"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2, Trash2, GitBranch, Globe,
  CheckCircle, Circle, ChevronRight,
  X, ExternalLink, Target, ScrollText,
  Calendar, Loader2, Feather,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { PROJECT_STATUSES, PROJECT_CATEGORIES } from "@/lib/constants";
import api from "@/lib/api";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────────────
// NOORI — "A Letter, Sealed"
//
// This project isn't a dashboard tile. It's an envelope. Closed, it just sits
// there, quiet, waiting. Hover it and the seal cracks, the flap lifts, and a
// line from the letter shows itself for a moment before folding away again.
// Open it, and the whole thing reads like a page — ink, not UI chrome.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Palette — candlelight, old paper, sealing wax. Nothing borrowed from the
// rest of the app's cosmic/purple theme; this one is warm on purpose. ────────
const L = {
  void:        "#120b08",
  deep:        "#1c120c",
  // Full-opacity readable colors
  parchment:   "rgb(232,214,178)",   // aged paper / ink-on-page text
  rose:        "rgb(214,150,159)",   // dusty rose accent
  gold:        "rgb(197,157,74)",    // antique gold foil
  wax:         "rgb(155,32,53)",     // sealing wax
  // Dimmed variants
  parchDim:    "rgba(232,214,178,0.55)",
  parchMuted:  "rgba(232,214,178,0.35)",
  roseDim:     "rgba(214,150,159,0.60)",
  goldDim:     "rgba(224,190,120,0.82)",
  goldMuted:   "rgba(197,157,74,0.40)",
  // Borders
  border:      "rgba(197,157,74,0.13)",
  borderHot:   "rgba(197,157,74,0.34)",
};

// A line from the letter — shown for a breath when the seal cracks.
const LETTER_LINES = [
  "sealed with something words can't hold.",
  "every page here is addressed to her.",
  "this ink was never meant to dry.",
  "some things deserve their own paper.",
  "written in the quiet hours, just for her.",
  "a letter that keeps finding new pages.",
  "not sent. just always, always here.",
  "still writing, after all this time.",
];

const PETALS = ["❀", "♡", "❦", "·", "❀", "♡"];
const statusMeta = (v) => PROJECT_STATUSES.find((s) => s.value === v);

// ─────────────────────────────────────────────────────────────────────────────
// Sound — a seal pressed into warm wax, and paper unfolding underneath it.
// Built loud enough to actually hear: previous version peaked around 0.05
// gain, which is close to inaudible on most speakers. This one runs through
// a compressor so it stays clean at a level you can actually hear.
// ─────────────────────────────────────────────────────────────────────────────
let _nooriCtx = null;
function getNooriAudioCtx() {
  if (typeof window === "undefined") return null;
  try {
    if (!_nooriCtx) _nooriCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_nooriCtx.state === "suspended") _nooriCtx.resume().catch(() => {});
    return _nooriCtx;
  } catch (_) {
    return null;
  }
}

function playSealSound() {
  const ctx = getNooriAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Master bus — a gentle compressor glues the layers together and keeps
    // things from clipping, so we can push the gain up and still sound warm
    // instead of harsh.
    const master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-20, now);
    comp.knee.setValueAtTime(22, now);
    comp.ratio.setValueAtTime(4, now);
    comp.attack.setValueAtTime(0.004, now);
    comp.release.setValueAtTime(0.28, now);
    master.gain.value = 1;
    master.connect(comp);
    comp.connect(ctx.destination);

    // Warm bell — the sound of a seal settling, three soft harmonics
    [
      { f: 392, g: 0.30, d: 2.4 }, // G4
      { f: 587, g: 0.19, d: 1.9 }, // D5
      { f: 784, g: 0.11, d: 1.4 }, // G5
    ].forEach(({ f, g, d }, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      const pan  = ctx.createStereoPanner();
      filt.type = "lowpass";
      filt.frequency.value = 2600;
      osc.type = "triangle";
      osc.frequency.value = f;
      pan.pan.value = i % 2 === 0 ? -0.08 : 0.08;
      osc.connect(filt); filt.connect(gain); gain.connect(pan); pan.connect(master);
      const t = now + i * 0.045;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(g, t + 0.028);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
      osc.start(t); osc.stop(t + d + 0.1);
    });

    // Paper unfolding underneath — filtered noise swell
    const dur = 0.5;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1500;
    bpf.Q.value = 0.9;
    const ng = ctx.createGain();
    src.connect(bpf); bpf.connect(ng); ng.connect(master);
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.14, now + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.start(now); src.stop(now + dur + 0.05);
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Wax seal — sits closed, cracks open on hover
// ─────────────────────────────────────────────────────────────────────────────
function WaxSeal({ active, letter = "N", size = 34 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0"
        style={{
          borderRadius: "42% 58% 55% 45% / 45% 42% 58% 55%",
          background: "radial-gradient(circle at 32% 26%, rgb(196,72,88) 0%, rgb(139,30,63) 46%, rgb(92,17,42) 100%)",
        }}
        animate={{
          scale: active ? 1.08 : 1,
          rotate: active ? -5 : 0,
          boxShadow: active
            ? "0 0 20px rgba(197,157,74,0.38), inset 0 1px 1px rgba(255,255,255,0.28), inset 0 -2px 4px rgba(0,0,0,0.45)"
            : "0 2px 6px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.45)",
        }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center select-none"
        style={{
          fontFamily: "'Parisienne', cursive",
          fontSize: size * 0.5,
          color: "rgba(232,214,178,0.90)",
          textShadow: "0 1px 1px rgba(0,0,0,0.55)",
        }}
      >
        {letter}
      </span>
      <motion.svg
        viewBox="0 0 34 34"
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.path
          d="M6 20 L13 15 L15 22 L20 12 L27 17"
          fill="none"
          stroke="rgba(15,8,6,0.55)"
          strokeWidth="0.9"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Envelope flap seam — the fold-line of an envelope, along the top edge
// ─────────────────────────────────────────────────────────────────────────────
function FlapSeam({ active }) {
  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      viewBox="0 0 100 34"
      preserveAspectRatio="none"
      style={{ height: 58 }}
    >
      <motion.path
        d="M0 0 L50 29 L100 0"
        fill="none"
        strokeWidth="0.6"
        animate={{ stroke: active ? "rgba(197,157,74,0.42)" : "rgba(197,157,74,0.15)" }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Falling petal — replaces the old star-sparkle floaters
// ─────────────────────────────────────────────────────────────────────────────
function Petal({ x, delay, symbol, drift }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-[11px]"
      style={{ left: `${x}%`, bottom: "10%", color: L.rose }}
      initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
      animate={{ opacity: [0, 0.7, 0], y: -66, x: drift, rotate: drift > 0 ? 50 : -50 }}
      transition={{ duration: 3.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {symbol}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ink flourish — a hand-drawn calligraphy swirl, replaces the constellation
// ─────────────────────────────────────────────────────────────────────────────
function InkFlourish({ active }) {
  const strokes = [
    "M6 40 C 16 10, 34 10, 39 28 C 44 46, 62 46, 68 26",
    "M14 8 C 24 22, 19 34, 31 34",
    "M70 10 C 79 18, 74 30, 87 30",
  ];
  const flecks = [[20, 15], [45, 30], [76, 18], [60, 40]];
  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 55"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "60%", top: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {strokes.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(197,157,74,0.22)"
          strokeWidth="0.55"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 1.1, delay: i * 0.12, ease: "easeOut" }}
        />
      ))}
      {flecks.map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx} cy={cy} r="0.6"
          fill={L.rose}
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 0.45 : 0 }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
        />
      ))}
    </motion.svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress ring — reskinned as a small circular wax stamp
// ─────────────────────────────────────────────────────────────────────────────
function NooriProgressRing({ value, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(197,157,74,0.10)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#nRing)" strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.3s ease" }} />
      <defs>
        <linearGradient id="nRing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={L.wax} />
          <stop offset="100%" stopColor={L.gold} />
        </linearGradient>
      </defs>
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90,${size / 2},${size / 2})`}
        fill={L.parchment} fontSize={10}
        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}>
        {value}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A small heading within the letter itself — not a dashboard section label.
// No uppercase, no border, no box. Just a line of the page.
// ─────────────────────────────────────────────────────────────────────────────
function LetterHeading({ children }) {
  return (
    <p style={{
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
      fontSize: "1.5rem",
      color: "rgb(214,150,159)",
      marginBottom: "0.9rem",
    }}>
      {children}
    </p>
  );
}

// A thin, hand-ruled divider — replaces bordered card wrappers between blocks
function Ruled() {
  return (
    <div className="my-6 flex items-center justify-center gap-3" aria-hidden>
      <span style={{ width: 28, height: 1, background: "rgba(197,157,74,0.22)" }} />
      <span style={{ color: "rgba(214,150,159,0.5)", fontSize: "0.7rem" }}>❦</span>
      <span style={{ width: 28, height: 1, background: "rgba(197,157,74,0.22)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOORI LINKED TASKS — "pages" — a plain ruled list, not a stack of cards
// ─────────────────────────────────────────────────────────────────────────────
const NOORI_TASK_STATUS = {
  "todo":        { label: "to do",       color: "rgba(232,214,178,0.50)" },
  "in-progress": { label: "in progress", color: "rgb(214,150,159)" },
  "review":      { label: "review",      color: L.gold },
  "done":        { label: "done",        color: "rgba(232,214,178,0.35)" },
};

function NooriLinkedTasks({ projectId }) {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}/tasks`)
      .then((r) => { setTasks(r.data.data); setError(null); })
      .catch(() => setError("could not turn this page"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const done = tasks.filter((t) => t.status === "done").length;

  if (loading) {
    return <p style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem", color: L.goldMuted, fontStyle: "italic" }}>unfolding the pages…</p>;
  }
  if (error) {
    return <p style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem", color: L.goldMuted, fontStyle: "italic" }}>{error}</p>;
  }
  if (tasks.length === 0) {
    return <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.9rem", color: "rgba(197,157,74,0.35)" }}>no pages written yet.</p>;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mb-1"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.78rem", color: L.goldMuted, letterSpacing: "0.04em" }}
      >
        {done}/{tasks.length} finished — {expanded ? "collapse ↑" : "expand ↓"}
      </button>

      {expanded && (
        <div className="mt-2">
          {tasks.map((task, i) => {
            const sm = NOORI_TASK_STATUS[task.status] || NOORI_TASK_STATUS["todo"];
            const isDone = task.status === "done";
            return (
              <div key={task._id}
                className="flex items-start gap-3 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(197,157,74,0.06)" }}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone
                    ? <CheckCircle size={13} style={{ color: "rgba(232,214,178,0.55)" }} />
                    : <Circle      size={13} style={{ color: "rgba(197,157,74,0.28)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: "1rem",
                      color: isDone ? "rgba(232,214,178,0.55)" : L.parchment,
                      lineHeight: 1.4,
                    }}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.68rem", letterSpacing: "0.06em", color: sm.color }}>
                      {sm.label}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.68rem", color: "rgba(197,157,74,0.42)" }}>
                        <Calendar size={9} />
                        {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOORI DRAWER — an actual letter, unfolded on the desk.
//
// Not a sidebar. No stat-card grid, no bordered sections stacked like a
// settings page. It opens centered, sits at a faint tilt like a page just
// laid down, and reads top to bottom the way a letter reads: a dateline,
// a name, an opening line, the promises made, the pages written, a
// postscript, a signature. Structure comes from typography and rhythm,
// not from boxes.
// ─────────────────────────────────────────────────────────────────────────────
export function NooriDrawer({ projectId, onClose, onEdit, onDelete, onMilestoneToggle }) {
  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then((r) => setProject(r.data.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleMilestone = async (mid) => {
    setToggling(mid);
    try {
      await onMilestoneToggle(projectId, mid);
      const r = await api.get(`/projects/${projectId}`);
      setProject(r.data.data);
    } finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!confirm("Unseal and remove this letter for good? This cannot be undone.")) return;
    onClose(); await onDelete(projectId);
  };
  const handleEdit = () => { onClose(); setTimeout(() => onEdit(project), 100); };

  const status = project ? statusMeta(project.status) : null;
  const done   = project?.milestones?.filter((m) => m.done).length || 0;
  const total  = project?.milestones?.length || 0;
  const taskCounts = {};
  (project?.taskStats || []).forEach(({ _id, count }) => { taskCounts[_id] = count; });
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  const firstLetter = project?.description ? project.description.charAt(0) : "";
  const restOfFirstLine = project?.description ? project.description.slice(1) : "";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{
          background: "radial-gradient(ellipse at 50% 35%, rgba(155,32,53,0.10) 0%, rgba(0,0,0,0.88) 100%)",
          backdropFilter: "blur(3px)",
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* The page itself — centered, not docked to a side, so it never reads as a UI panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
        <motion.div
          className="relative w-full max-w-xl pointer-events-auto flex flex-col overflow-hidden"
          style={{
            maxHeight: "88vh",
            background: "linear-gradient(172deg, #2a1c11 0%, #20150d 45%, #180f09 100%)",
            border: "1px solid rgba(197,157,74,0.22)",
            borderRadius: "3px 14px 5px 16px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.4), 0 0 90px rgba(155,32,53,0.14), inset 0 0 0 1px rgba(197,157,74,0.05)",
          }}
          initial={{ opacity: 0, scale: 0.93, rotate: -1.6, y: 14 }}
          animate={{ opacity: 1, scale: 1, rotate: -0.4, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, rotate: 1.2, y: 10 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Paper grain */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "160px",
            }}
          />
          {/* Folded corner — top right, like a page just set down */}
          <div className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: 0, height: 0,
              borderStyle: "solid",
              borderWidth: "0 30px 30px 0",
              borderColor: "transparent rgba(0,0,0,0.35) transparent transparent",
            }} />
          <div className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: 0, height: 0,
              borderStyle: "solid",
              borderWidth: "0 29px 29px 0",
              borderColor: "transparent rgba(232,214,178,0.05) transparent transparent",
            }} />

          {/* Ambient candlelight */}
          <div className="absolute -top-20 left-10 w-64 h-64 pointer-events-none rounded-full"
            style={{ background: "radial-gradient(circle, rgba(197,157,74,0.10) 0%, transparent 65%)", filter: "blur(50px)" }} />

          {/* Close / edit / delete — small, floating, not a header bar */}
          <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-0.5">
            {project && (
              <>
                <button onClick={handleEdit}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "rgba(197,157,74,0.45)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = L.gold}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(197,157,74,0.45)"}>
                  <Edit2 size={13} />
                </button>
                <button onClick={handleDelete}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: "rgba(197,157,74,0.35)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = L.rose}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(197,157,74,0.35)"}>
              <X size={14} />
            </button>
          </div>

          {/* ── The page ── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-3 py-24">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={18} style={{ color: L.gold }} />
              </motion.div>
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.1rem", color: L.goldDim }}>
                unfolding the letter…
              </span>
            </div>
          ) : !project ? (
            <div className="flex-1 flex items-center justify-center py-24"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: L.goldDim, fontSize: "0.9rem" }}>
              this page could not be found.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-8 md:px-14 py-10">

              {/* Dateline, like the top corner of a real letter */}
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.75rem",
                letterSpacing: "0.06em",
                color: L.goldDim,
                marginBottom: "1.5rem",
              }}>
                {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>

              {/* Seal + heading */}
              <div className="flex items-start gap-4 mb-2">
                <WaxSeal active letter="G" size={42} />
                <div className="flex-1 min-w-0 pt-1">
                  <h2 style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "2rem",
                    fontWeight: 700,
                    background: "linear-gradient(125deg, rgb(197,157,74) 0%, rgb(232,214,178) 45%, rgb(214,150,159) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    lineHeight: 1.15,
                  }}>
                    {project.title}
                  </h2>
                  {status && (
                    <div className="mt-1.5">
                      <Badge className={clsx(status.color, "opacity-70")}>{status.label}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.78rem",
                color: L.goldDim,
                letterSpacing: "0.06em",
                marginBottom: "2rem",
              }}>
                ♡ sealed with everything I couldn't say aloud ♡
              </p>

              {/* Opening paragraph — the description, with a dropped first letter */}
              {project.description && (
                <p style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "1.22rem",
                  color: L.parchment,
                  lineHeight: 1.85,
                  letterSpacing: "0.01em",
                }}>
                  <span style={{
                    float: "left",
                    fontFamily: "'Dancing Script', cursive",
                    fontWeight: 700,
                    fontSize: "3rem",
                    lineHeight: "2.2rem",
                    paddingRight: "0.5rem",
                    paddingTop: "0.2rem",
                    color: L.gold,
                  }}>
                    {firstLetter}
                  </span>
                  {restOfFirstLine}
                </p>
              )}

              {/* A small aside noting where things stand — not a stat grid */}
              <p className="flex items-center justify-center gap-3 flex-wrap text-center"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.82rem",
                  color: L.goldDim,
                  marginTop: "1.75rem",
                }}>
                <span className="inline-flex items-center gap-1"><Target size={11} />{done}/{total} promises kept</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="inline-flex items-center gap-1"><ScrollText size={11} />{totalTasks} pages</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{project.progress}% written</span>
              </p>
              <div className="h-px w-full mt-3 rounded-full overflow-hidden" style={{ background: "rgba(197,157,74,0.09)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${L.wax}, ${L.rose}, ${L.gold})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }} />
              </div>

              {/* Categories / links — a footnote line, not boxed sections */}
              {(project.categories?.length > 0 || project.repoLink || project.liveUrl) && (
                <p className="flex items-center justify-center gap-2 flex-wrap text-center"
                  style={{ marginTop: "1.25rem" }}>
                  {project.categories?.map((cat) => {
                    const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
                    return meta ? (
                      <span key={cat} className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium opacity-70", meta.color)}>
                        {meta.icon} {meta.label}
                      </span>
                    ) : null;
                  })}
                  {project.repoLink && (
                    <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 transition-colors"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem", color: L.goldDim }}
                      onMouseEnter={(e) => e.currentTarget.style.color = L.gold}
                      onMouseLeave={(e) => e.currentTarget.style.color = L.goldDim}>
                      <GitBranch size={11} />repo<ExternalLink size={9} />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 transition-colors"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem", color: L.roseDim }}
                      onMouseEnter={(e) => e.currentTarget.style.color = L.rose}
                      onMouseLeave={(e) => e.currentTarget.style.color = L.roseDim}>
                      <Globe size={11} />live<ExternalLink size={9} />
                    </a>
                  )}
                </p>
              )}

              {/* Promises — the milestones, written straight into the page */}
              {total > 0 && (
                <>
                  <Ruled />
                  <LetterHeading>the promises I made</LetterHeading>
                  <div>
                    {project.milestones.map((m, i) => (
                      <button key={m._id}
                        onClick={() => handleMilestone(m._id)}
                        disabled={toggling === m._id}
                        className={clsx(
                          "w-full flex items-center gap-3 py-2.5 text-left transition-opacity",
                          toggling === m._id && "opacity-40 pointer-events-none"
                        )}
                        style={{ borderTop: i === 0 ? "none" : "1px solid rgba(197,157,74,0.06)" }}>
                        {m.done
                          ? <CheckCircle size={15} style={{ color: L.gold }} className="shrink-0" />
                          : <Circle      size={15} style={{ color: "rgba(197,157,74,0.28)" }} className="shrink-0" />}
                        <span className="flex-1 text-left"
                          style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: "1.05rem",
                            color: m.done ? "rgb(214,150,159)" : L.parchment,
                          }}>
                          {m.title}
                        </span>
                        {m.done && (
                          <span className="shrink-0" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.68rem", letterSpacing: "0.08em", color: L.goldDim }}>
                            kept
                          </span>
                        )}
                        {m.dueDate && (
                          <span className="flex items-center gap-1 shrink-0"
                            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.72rem", color: L.goldDim }}>
                            <Calendar size={9} />{new Date(m.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Pages — the linked tasks */}
              <Ruled />
              <LetterHeading>the pages so far</LetterHeading>
              <NooriLinkedTasks projectId={projectId} />

              {/* Postscript — notes */}
              {project.notes && (
                <>
                  <Ruled />
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.85rem", color: L.goldDim, marginBottom: "0.5rem" }}>
                    P.S.
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: "1.1rem", color: L.parchment }}>
                    {project.notes}
                  </p>
                </>
              )}

              {/* Signature */}
              <div className="text-center" style={{ marginTop: "2.75rem" }}>
                <p style={{ fontFamily: "'Parisienne', cursive", fontSize: "1.4rem", color: L.goldDim }}>
                  — always, quietly, endlessly.
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.68rem",
                  color: "rgba(197,157,74,0.35)",
                  marginTop: "0.5rem",
                }}>
                  last revised {new Date(project.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Continue writing — a quiet text link, not a CTA button */}
              <div className="flex justify-center" style={{ marginTop: "2rem" }}>
                <motion.button
                  whileHover={{ letterSpacing: "0.08em" }}
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2"
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: "1.15rem",
                    color: L.gold,
                    borderBottom: "1px solid rgba(197,157,74,0.30)",
                    paddingBottom: "0.15rem",
                  }}>
                  <Feather size={13} /> continue writing
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOORI CARD — the sealed envelope
// ─────────────────────────────────────────────────────────────────────────────
export default function NooriCard({ project, onView, onEdit, onDelete, onMilestoneToggle, onPin }) {
  const status = statusMeta(project.status);

  const [active,     setActive]     = useState(false);
  const [whisper,    setWhisper]    = useState("");
  const [floaters,   setFloaters]   = useState([]);
  const [soundReady, setSoundReady] = useState(false);
  const [tapCount,   setTapCount]   = useState(0);

  const cardRef  = useRef(null);
  const glowRef  = useRef(null);
  const touchRef = useRef(null);

  // Lightweight glow: track mouse pos in a ref, update DOM directly on mousemove
  const glowPos = useRef({ x: 50, y: 50 });

  const updateGlowCSS = useCallback(() => {
    if (!glowRef.current) return;
    const { x, y } = glowPos.current;
    glowRef.current.style.background =
      `radial-gradient(ellipse 68% 52% at ${x}% ${y}%, rgba(197,157,74,0.16) 0%, rgba(155,32,53,0.08) 50%, transparent 70%)`;
  }, []);

  const spawnFloaters = () => {
    setFloaters(
      Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: 5 + Math.random() * 90,
        delay: i * 0.09,
        drift: (Math.random() - 0.5) * 24,
        symbol: PETALS[Math.floor(Math.random() * PETALS.length)],
      }))
    );
  };

  const activate = useCallback((clientX, clientY) => {
    setActive(true);
    setWhisper((prev) => {
      const pool = LETTER_LINES.filter((w) => w !== prev);
      return pool[Math.floor(Math.random() * pool.length)];
    });
    spawnFloaters();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect && clientX !== undefined) {
      glowPos.current = {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
      updateGlowCSS();
    }
    // First hover unlocks the audio context (browsers require a gesture);
    // every hover after that actually plays the seal.
    if (soundReady) playSealSound();
    setSoundReady(true);
  }, [soundReady, updateGlowCSS]);

  const deactivate = useCallback(() => {
    setActive(false);
    glowPos.current = { x: 50, y: 50 };
  }, []);

  const onMouseEnter = useCallback((e) => activate(e.clientX, e.clientY), [activate]);
  const onMouseLeave = useCallback(() => deactivate(), [deactivate]);
  const onMouseMove  = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    glowPos.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    updateGlowCSS();
  }, [updateGlowCSS]);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    activate(t.clientX, t.clientY);
    setTapCount((c) => c + 1);
    clearTimeout(touchRef.current);
    touchRef.current = setTimeout(() => setTapCount(0), 700);
  };
  const onTouchEnd = (e) => {
    e.preventDefault();
    if (tapCount >= 1) { deactivate(); onView(project); }
    else setTimeout(() => deactivate(), 2200);
  };
  useEffect(() => () => clearTimeout(touchRef.current), []);

  return (
    <motion.div
      ref={cardRef}
      // ── BREATHING animation — scale AND subtle box-shadow pulse ──
      animate={active ? { scale: 1.016 } : { scale: [1, 1.006, 1] }}
      transition={active
        ? { duration: 0.22, ease: "easeOut" }
        : { duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
      }
      className="relative overflow-hidden cursor-pointer rounded-2xl flex flex-col gap-3.5 p-5 pt-9 group select-none h-full"
      style={{
        background: "linear-gradient(155deg, #1c120c 0%, #180f0a 55%, #120b08 100%)",
        border: active ? "1px solid rgba(197,157,74,0.30)" : "1px solid rgba(197,157,74,0.12)",
        willChange: "transform",
        transition: "border-color 0.5s ease",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => { if (window.matchMedia("(hover: hover)").matches) onView(project); }}
    >
      {/* Cursor glow */}
      <div ref={glowRef}
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: active ? 1 : 0, transition: "opacity 0.6s ease" }}
      />

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "140px",
        }}
      />

      {/* Envelope flap seam */}
      <FlapSeam active={active} />

      {/* Wax seal, sitting on the flap point */}
      <div className="absolute z-20" style={{ top: 22, left: "50%", transform: "translateX(-50%)" }}>
        <WaxSeal active={active} letter="G" />
      </div>

      {/* Ink flourish on hover */}
      <InkFlourish active={active} />

      {/* Falling petals */}
      <AnimatePresence>
        {active && floaters.map((f) => (
          <Petal key={f.id} x={f.x} delay={f.delay} drift={f.drift} symbol={f.symbol} />
        ))}
      </AnimatePresence>

      {/* Hover overlay — the seal has cracked, a line from the letter shows */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center gap-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(18,11,8,0.93) 0%, rgba(18,11,8,0.78) 100%)",
              backdropFilter: "blur(5px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Feather size={26} style={{ color: L.gold }} />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={whisper}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="text-center px-8"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "1.08rem",
                  fontStyle: "italic",
                  color: "rgba(232,214,178,0.85)",
                  lineHeight: 1.5,
                  letterSpacing: "0.015em",
                }}
              >
                {whisper}
              </motion.p>
            </AnimatePresence>

            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.7rem",
              color: "rgba(197,157,74,0.35)",
              letterSpacing: "0.14em",
            }}>
              ♡ only she can open this ♡
            </p>

            <p className="text-[10px] md:hidden"
              style={{ color: "rgba(197,157,74,0.30)", fontFamily: "'Caveat', cursive" }}>
              tap again to open
            </p>

            {/* Pin button — lives inside the overlay so it's always reachable */}
            {onPin && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                onClick={(e) => { e.stopPropagation(); onPin(project._id); }}
                className="absolute bottom-3.5 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl pointer-events-auto transition-all"
                style={{
                  background: project.pinned
                    ? "rgba(197,157,74,0.14)"
                    : "rgba(197,157,74,0.06)",
                  border: project.pinned
                    ? "1px solid rgba(197,157,74,0.34)"
                    : "1px solid rgba(197,157,74,0.14)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = project.pinned ? "rgba(197,157,74,0.20)" : "rgba(197,157,74,0.12)";
                  e.currentTarget.style.borderColor = project.pinned ? "rgba(197,157,74,0.48)" : "rgba(197,157,74,0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = project.pinned ? "rgba(197,157,74,0.14)" : "rgba(197,157,74,0.06)";
                  e.currentTarget.style.borderColor = project.pinned ? "rgba(197,157,74,0.34)" : "rgba(197,157,74,0.14)";
                }}
                title={project.pinned ? "Unpin" : "Pin to top"}
              >
                <span style={{ fontSize: "0.7rem" }}>{project.pinned ? "❀" : "❦"}</span>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  color: project.pinned ? L.gold : L.goldMuted,
                }}>
                  {project.pinned ? "pinned" : "pin"}
                </span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit / Delete (desktop hover) */}
      <div
        className="absolute top-3.5 right-3.5 z-30 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(197,157,74,0.45)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = L.gold}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(197,157,74,0.45)"}>
          <Edit2 size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* ── Card content ── */}
      <div className="relative z-10 flex flex-col gap-3.5">

        {/* Title */}
        <div className="flex items-center justify-center min-w-0 pr-0 pt-1">
          <p style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: "1.3rem",
            fontWeight: 700,
            background: "linear-gradient(128deg, rgb(197,157,74) 0%, rgb(232,214,178) 55%, rgb(214,150,159) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            letterSpacing: "0.01em",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}>
            {project.title}
          </p>
        </div>

        {/* Description — static, no animation */}
        {project.description && (
          <p className="line-clamp-2 text-center" style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.9rem",
            fontStyle: "italic",
            color: "rgba(214,150,159,0.75)",
            lineHeight: 1.55,
          }}>
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {status && <Badge className={clsx(status.color, "opacity-65 text-[10px]")}>{status.label}</Badge>}
          {project.categories?.map((cat) => {
            const meta = PROJECT_CATEGORIES.find((c) => c.value === cat);
            return meta ? (
              <span key={cat} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-60", meta.color)}>
                {meta.icon} {meta.label}
              </span>
            ) : null;
          })}
          {project.repoLink && (
            <a href={project.repoLink} target="_blank" rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: L.goldMuted, fontFamily: "'Caveat', cursive" }}
              onClick={(e) => e.stopPropagation()}>
              <GitBranch size={10} />Repo
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-1 z-30 transition-colors"
              style={{ color: "rgba(214,150,159,0.55)", fontFamily: "'Caveat', cursive" }}
              onClick={(e) => e.stopPropagation()}>
              <Globe size={10} />Live
            </a>
          )}
        </div>

        {/* Progress bar — wax ribbon */}
        <div>
          <div className="flex justify-between mb-1.5" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.68rem",
            letterSpacing: "0.1em",
            color: "rgba(197,157,74,0.45)",
          }}>
            <span>progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-[1.5px] rounded-full overflow-hidden"
            style={{ background: "rgba(197,157,74,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${L.wax}, rgb(214,150,159), ${L.gold})` }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Milestones preview */}
        {project.milestones?.length > 0 && (
          <div className="space-y-1.5">
            {project.milestones.slice(0, 3).map((m) => (
              <div key={m._id}
                onClick={(e) => { e.stopPropagation(); onMilestoneToggle(project._id, m._id); }}
                className="flex items-center gap-2 cursor-pointer z-30">
                {m.done
                  ? <CheckCircle size={11} style={{ color: L.gold }} className="shrink-0" />
                  : <Circle      size={11} style={{ color: "rgba(197,157,74,0.25)" }} className="shrink-0" />}
                <span className={m.done ? "line-through" : ""}
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "0.83rem",
                    color: m.done ? "rgba(197,157,74,0.40)" : "rgba(232,214,178,0.85)",
                  }}>
                  {m.title}
                </span>
              </div>
            ))}
            {project.milestones.length > 3 && (
              <p className="flex items-center gap-0.5" style={{
                fontSize: "0.65rem",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "rgba(197,157,74,0.38)",
              }}>
                +{project.milestones.length - 3} more <ChevronRight size={9} />
              </p>
            )}
          </div>
        )}
      </div>

      {/* Desktop view hint */}
      <div className="absolute bottom-3.5 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="flex items-center gap-0.5" style={{
          fontSize: "0.65rem",
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          color: "rgba(197,157,74,0.32)",
        }}>
          Open <ChevronRight size={8} />
        </span>
      </div>

      {/* Bottom shimmer */}
      <div className="absolute bottom-0 left-5 right-5 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(197,157,74,0.10), rgba(214,150,159,0.06), transparent)`,
          opacity: active ? 1 : 0.35,
          transition: "opacity 0.6s ease",
        }}
      />
    </motion.div>
  );
}