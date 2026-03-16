"use client";
import { useState, useMemo, useRef } from "react";
import { format, subDays, eachDayOfInterval, startOfWeek, parseISO } from "date-fns";
import clsx from "clsx";

const LEVELS = {
  coding:  ["#1e2535", "#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"],
  reading: ["#1e2535", "#14432a", "#15803d", "#22c55e", "#86efac"],
  habits:  ["#1e2535", "#451a03", "#b45309", "#f59e0b", "#fcd34d"],
  focus:   ["#1e2535", "#2e1065", "#7c3aed", "#a855f7", "#d8b4fe"],
};

const TRACK_META = {
  coding:  { label: "Coding",   key: "codingMinutes",   unit: "min", max: 240 },
  reading: { label: "Reading",  key: "readingMinutes",  unit: "min", max: 120 },
  habits:  { label: "Habits",   key: "habitsCompleted", unit: "",    max: 10  },
  focus:   { label: "Focus",    key: "focusMinutes",    unit: "min", max: 240 },
};

function getLevel(value, max) {
  if (!value || value === 0) return 0;
  const pct = Math.min(value / max, 1);
  if (pct < 0.25) return 1;
  if (pct < 0.5)  return 2;
  if (pct < 0.75) return 3;
  return 4;
}

function HeatCell({ dateStr, stat, track, isToday }) {
  const meta    = TRACK_META[track];
  const value   = stat?.[meta.key] ?? 0;
  const level   = getLevel(value, meta.max);
  const bgColor = LEVELS[track][level];
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <div
        className={clsx(
          "rounded-[3px] cursor-pointer transition-opacity hover:opacity-80",
          isToday && "ring-1 ring-white/40 ring-offset-1 ring-offset-[#0f1117]"
        )}
        style={{ width: 12, height: 12, backgroundColor: bgColor, flexShrink: 0 }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ whiteSpace: "nowrap" }}>
          <div className="bg-[#161b27] border border-[#252d40] rounded-lg px-3 py-2 text-xs shadow-xl">
            <p className="font-semibold text-slate-200">{format(parseISO(dateStr), "MMM d, yyyy")}</p>
            <p className="text-slate-400 mt-0.5">
              {meta.label}: <span className="text-slate-200">{value}{meta.unit ? ` ${meta.unit}` : ""}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LifeHeatmap({ stats = [], weeks = 26 }) {
  const [activeTrack, setActiveTrack] = useState("coding");
  const scrollRef = useRef(null);

  const today    = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const statMap = useMemo(() => {
    const m = {};
    stats.forEach((s) => { m[s.date] = s; });
    return m;
  }, [stats]);

  // Build columns (each column = 1 week = up to 7 days, Sun→Sat)
  const { columns, monthMarkers } = useMemo(() => {
    const start = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
    const days  = eachDayOfInterval({ start, end: today });

    const cols = [];
    let col    = [];
    days.forEach((day) => {
      col.push(format(day, "yyyy-MM-dd"));
      if (col.length === 7) { cols.push(col); col = []; }
    });
    if (col.length) cols.push(col);

    // Month label at first column of each new month
    const markers = [];
    let lastMonth = "";
    cols.forEach((c, i) => {
      const m = format(parseISO(c[0]), "MMM");
      if (m !== lastMonth) { markers.push({ colIndex: i, label: m }); lastMonth = m; }
    });

    return { columns: cols, monthMarkers: markers };
  }, [weeks]);

  const meta       = TRACK_META[activeTrack];
  const totalValue = stats.reduce((sum, s) => sum + (s[meta.key] ?? 0), 0);
  const activeDays = stats.filter((s) => (s[meta.key] ?? 0) > 0).length;

  // Cell size + gap in px — used to position month labels precisely
  const CELL = 12;
  const GAP  = 3;
  const COL_W = CELL + GAP; // 15px per column

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">Life Heatmap</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeDays} active days · {totalValue}{meta.unit ? ` ${meta.unit}` : ""} {meta.label.toLowerCase()} total
          </p>
        </div>
        {/* Track tabs */}
        <div className="flex gap-1 bg-[#1e2535] rounded-lg p-1">
          {Object.entries(TRACK_META).map(([key, m]) => (
            <button
              key={key}
              onClick={() => setActiveTrack(key)}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                activeTrack === key
                  ? "bg-[#252d40] text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable grid wrapper */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-visible pb-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Inner container — natural width based on column count */}
        <div style={{ minWidth: columns.length * COL_W + 4 }}>

          {/* Month labels row */}
          <div className="relative h-5 mb-1" style={{ minWidth: columns.length * COL_W }}>
            {monthMarkers.map(({ colIndex, label }) => (
              <span
                key={`${colIndex}-${label}`}
                className="absolute text-[10px] text-slate-600 font-medium"
                style={{ left: colIndex * COL_W }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Day-of-week labels + grid side by side */}
          <div className="flex gap-1">
            {/* Day labels — Mon, Wed, Fri */}
            <div className="flex flex-col" style={{ gap: GAP, marginRight: 4 }}>
              {["", "M", "", "W", "", "F", ""].map((d, i) => (
                <div key={i} style={{ height: CELL, width: 10 }}
                  className="text-[9px] text-slate-700 flex items-center justify-end">
                  {d}
                </div>
              ))}
            </div>

            {/* The actual grid */}
            <div className="flex" style={{ gap: GAP }}>
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
                  {col.map((dateStr) => (
                    <HeatCell
                      key={dateStr}
                      dateStr={dateStr}
                      stat={statMap[dateStr]}
                      track={activeTrack}
                      isToday={dateStr === todayStr}
                    />
                  ))}
                  {/* Pad short columns (last partial week) */}
                  {col.length < 7 && Array.from({ length: 7 - col.length }).map((_, i) => (
                    <div key={`pad-${i}`} style={{ width: CELL, height: CELL, flexShrink: 0 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-600">Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className="rounded-[3px]"
            style={{ width: 12, height: 12, backgroundColor: LEVELS[activeTrack][l] }}
          />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
        <span className="text-[10px] text-slate-700 ml-2">
          — scroll horizontally on small screens
        </span>
      </div>
    </div>
  );
}