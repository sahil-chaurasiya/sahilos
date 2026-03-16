"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Code, BookOpen, Zap, Minimize2 } from "lucide-react";
import { useDailyStat } from "@/hooks/useDailyStat";
import LifeHeatmap from "@/components/heatmap/LifeHeatmap";
import { Button, Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

const FIELDS = [
  { key: "codingMinutes",   label: "Coding",  icon: Code,      color: "text-blue-400",   unit: "min", placeholder: "120" },
  { key: "readingMinutes",  label: "Reading", icon: BookOpen,  color: "text-green-400",  unit: "min", placeholder: "30"  },
  { key: "habitsCompleted", label: "Habits",  icon: Zap,       color: "text-amber-400",  unit: "",    placeholder: "5"   },
  { key: "focusMinutes",    label: "Focus",   icon: Minimize2, color: "text-violet-400", unit: "min", placeholder: "90"  },
];

export default function HeatmapPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const from  = format(subDays(new Date(), 182), "yyyy-MM-dd");

  const { stats, today: todayStat, loading, logStat } = useDailyStat({ from, to: today });

  const [form, setForm] = useState({
    codingMinutes: "", readingMinutes: "", habitsCompleted: "", focusMinutes: "",
  });

  // Pre-fill with today's logged values once loaded
  useEffect(() => {
    if (todayStat) {
      setForm({
        codingMinutes:   todayStat.codingMinutes   || "",
        readingMinutes:  todayStat.readingMinutes  || "",
        habitsCompleted: todayStat.habitsCompleted || "",
        focusMinutes:    todayStat.focusMinutes    || "",
      });
    }
  }, [todayStat]);

  const handleLog = async () => {
    await logStat({
      date:            today,
      codingMinutes:   Number(form.codingMinutes)   || 0,
      readingMinutes:  Number(form.readingMinutes)  || 0,
      habitsCompleted: Number(form.habitsCompleted) || 0,
      focusMinutes:    Number(form.focusMinutes)    || 0,
    });
  };

  const activeDays = stats.filter(
    (s) => s.codingMinutes + s.readingMinutes + s.habitsCompleted + s.focusMinutes > 0
  ).length;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="page-title">Life Heatmap</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeDays} active days in the last 6 months</p>
        </div>

        {/* Log today */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4">
            Log Today — <span className="text-slate-500 font-normal">{format(new Date(), "MMMM d, yyyy")}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {FIELDS.map(({ key, label, icon: Icon, color, unit, placeholder }) => (
              <div key={key} className="bg-[#1e2535] rounded-xl p-4">
                <div className={clsx("flex items-center gap-1.5 text-xs font-medium mb-3", color)}>
                  <Icon size={12} />
                  {label}
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="bg-transparent text-2xl font-bold text-slate-100 w-full focus:outline-none placeholder-slate-700"
                  />
                  {unit && <span className="text-xs text-slate-600">{unit}</span>}
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" onClick={handleLog}>Log Today</Button>
        </div>

        {/* Heatmap */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <LifeHeatmap stats={stats} weeks={26} />
        )}

        {/* Summary stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FIELDS.map(({ key, label, icon: Icon, color, unit }) => {
              const total = stats.reduce((sum, s) => sum + (s[key] || 0), 0);
              const avg   = activeDays > 0 ? Math.round(total / activeDays) : 0;
              return (
                <div key={key} className="card p-4">
                  <div className={clsx("flex items-center gap-1.5 text-xs font-medium mb-2", color)}>
                    <Icon size={12} />{label}
                  </div>
                  <p className="text-2xl font-bold text-slate-100">
                    {total}
                    {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">~{avg}{unit} / active day</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}