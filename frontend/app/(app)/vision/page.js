"use client";

import { useState, useEffect } from "react";
import { Compass, Target, Calendar, Crosshair, Loader2, CheckCircle } from "lucide-react";
import { useLifeVision } from "@/hooks/useLifeVision";
import { Spinner } from "@/components/ui";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

const SECTIONS = [
  {
    key:         "mission",
    label:       "Mission",
    icon:        Compass,
    color:       "text-brand",
    bg:          "bg-brand/10",
    placeholder: "What is your core purpose? Why do you exist? What drives you every single day?\n\nWrite your personal mission statement — the north star that guides every decision…",
    hint:        "Your core purpose & reason for being",
  },
  {
    key:         "threeYearVision",
    label:       "3 Year Vision",
    icon:        Target,
    color:       "text-violet-400",
    bg:          "bg-violet-500/10",
    placeholder: "Paint a vivid picture of your life 3 years from now.\n\nWhere are you living? What are you building? Who are you becoming?\n\nBe specific. Be bold. Be honest…",
    hint:        "Where you will be in 3 years",
  },
  {
    key:         "oneYearGoals",
    label:       "1 Year Goals",
    icon:        Calendar,
    color:       "text-emerald-400",
    bg:          "bg-emerald-500/10",
    placeholder: "What must you accomplish this year to be on track for your 3-year vision?\n\nList your most important goals for the next 12 months…",
    hint:        "Concrete goals for the next 12 months",
  },
  {
    key:         "currentFocus",
    label:       "Current Focus",
    icon:        Crosshair,
    color:       "text-amber-400",
    bg:          "bg-amber-500/10",
    placeholder: "What is the ONE thing you are focused on right now?\n\nThis week. This month. What deserves your full attention and energy?",
    hint:        "Your #1 priority right now",
  },
];

// ── Section Editor ────────────────────────────────────────────────────────────
function VisionSection({ section, value, onChange }) {
  const Icon = section.icon;
  const [focused, setFocused] = useState(false);
  const wordCount = value?.trim().split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className={clsx(
      "card rounded-2xl overflow-hidden transition-all duration-200",
      focused && "border-surface-2 shadow-glow"
    )}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className={clsx("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", section.bg)}>
          <Icon size={17} className={section.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200 text-sm">{section.label}</p>
          <p className="text-xs text-slate-600">{section.hint}</p>
        </div>
        {wordCount > 0 && (
          <span className="text-[10px] text-slate-600">{wordCount}w</span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-3 mx-5" />

      {/* Textarea */}
      <textarea
        className={clsx(
          "w-full bg-transparent px-5 py-4 resize-none focus:outline-none",
          "text-[15px] leading-[1.8] text-slate-200 placeholder-slate-700",
          "min-h-[160px] transition-all duration-150"
        )}
        placeholder={section.placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VisionPage() {
  const { vision, loading, saving, saveVision, scheduleAutosave } = useLifeVision();

  const [form, setForm] = useState({
    mission:         "",
    threeYearVision: "",
    oneYearGoals:    "",
    currentFocus:    "",
  });

  // Sync from API once loaded
  useEffect(() => {
    if (vision) {
      setForm({
        mission:         vision.mission         || "",
        threeYearVision: vision.threeYearVision || "",
        oneYearGoals:    vision.oneYearGoals    || "",
        currentFocus:    vision.currentFocus    || "",
      });
    }
  }, [vision]);

  const handleChange = (key, value) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    scheduleAutosave(updated);
  };

  const totalWords = Object.values(form).join(" ").trim().split(/\s+/).filter(Boolean).length;

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Life Vision</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your north star — {totalWords} words
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle size={12} />
                Saved
              </div>
            )}
          </div>
        </div>

        {/* Quote */}
        <div className="card p-4 border-l-2 border-brand/50 rounded-l-none">
          <p className="text-sm text-slate-400 italic leading-relaxed">
            "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one."
          </p>
          <p className="text-xs text-slate-600 mt-1.5">— Mark Twain</p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <VisionSection
            key={section.key}
            section={section}
            value={form[section.key]}
            onChange={(val) => handleChange(section.key, val)}
          />
        ))}

        {/* Save button */}
        <div className="flex justify-end pb-4">
          <button
            onClick={() => saveVision(form)}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save Vision"}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
