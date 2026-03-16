"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  ArrowRight, CheckCircle, Zap, Folder,
  Briefcase, GraduationCap, Activity, Wallet,
  TrendingUp, TrendingDown, Sparkles, Target,
  BarChart3, Clock, AlertCircle,
} from "lucide-react";
import { ProgressBar, Badge } from "@/components/ui";
import { TASK_PRIORITIES, ACTIVITY_META } from "@/lib/constants";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Daily Quote — fetched from Anthropic API, cached per day in sessionStorage
// ─────────────────────────────────────────────────────────────────────────────
function useDailyQuote(name) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toDateString();
    const cacheKey = `daily_quote_${today}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      setQuote(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const dayOfWeek = format(new Date(), "EEEE");

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 120,
        messages: [{
          role: "user",
          content: `Generate a short, punchy motivational quote for a developer/student named ${name} on a ${dayOfWeek} ${timeOfDay}. Return ONLY a JSON object like: {"quote": "...", "author": "...", "vibe": "energetic|calm|focused|ambitious"}. Make the quote feel fresh, not cliché. Max 20 words. Real author or "Anonymous". No preamble, just the JSON.`,
        }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data.content?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        setQuote(parsed);
      })
      .catch(() => {
        // Fallback quotes pool
        const fallbacks = [
          { quote: "Build things that matter. Ship things that work.", author: "Anonymous", vibe: "focused" },
          { quote: "Every expert was once a beginner who refused to quit.", author: "Anonymous", vibe: "ambitious" },
          { quote: "The best time to start was yesterday. The second best is now.", author: "Anonymous", vibe: "energetic" },
          { quote: "Code is poetry written in logic.", author: "Anonymous", vibe: "calm" },
        ];
        const fallback = fallbacks[new Date().getDay() % fallbacks.length];
        sessionStorage.setItem(cacheKey, JSON.stringify(fallback));
        setQuote(fallback);
      })
      .finally(() => setLoading(false));
  }, [name]);

  return { quote, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
// Greeting Card — hero widget with quote
// ─────────────────────────────────────────────────────────────────────────────
const VIBE_STYLES = {
  energetic: { accent: "#f59e0b", glow: "rgba(245,158,11,0.12)" },
  calm:      { accent: "#6366f1", glow: "rgba(99,102,241,0.12)" },
  focused:   { accent: "#06b6d4", glow: "rgba(6,182,212,0.12)" },
  ambitious: { accent: "#8b5cf6", glow: "rgba(139,92,246,0.12)" },
};

export function GreetingCard({ name }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Still up?" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.split(" ")[0] || name;
  const { quote, loading } = useDailyQuote(name);

  const vibe = quote?.vibe || "calm";
  const style = VIBE_STYLES[vibe] || VIBE_STYLES.calm;

  return (
    <div
      className="col-span-full rounded-2xl p-6 border relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${style.glow} 0%, rgba(15,15,20,0) 60%)`,
        borderColor: `${style.accent}30`,
      }}
    >
      {/* Decorative glow blob */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: style.accent }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        {/* Left — greeting */}
        <div>
          <p className="text-slate-400 text-sm font-medium">{greeting},</p>
          <h2 className="text-3xl font-bold text-slate-100 mt-0.5 tracking-tight">{firstName} 👋</h2>
          <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-1.5">
            <Clock size={12} />
            {format(new Date(), "EEEE, MMMM do yyyy")}
          </p>
        </div>

        {/* Right — quote */}
        <div
          className="sm:max-w-xs rounded-xl px-4 py-3 border flex-shrink-0"
          style={{ background: `${style.glow}`, borderColor: `${style.accent}25` }}
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-700 rounded w-3/4" />
              <div className="h-2 bg-slate-800 rounded w-1/2 mt-2" />
            </div>
          ) : quote ? (
            <>
              <div className="flex items-start gap-2">
                <Sparkles size={13} className="shrink-0 mt-0.5" style={{ color: style.accent }} />
                <p className="text-sm text-slate-300 leading-relaxed italic">"{quote.quote}"</p>
              </div>
              <p className="text-xs text-slate-600 mt-2 ml-5">— {quote.author}</p>
            </>
          ) : null}
        </div>
      </div>

      {/* Bottom stats strip */}
      <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/[0.05]">
        <QuickStat label="Today's date" value={format(new Date(), "dd MMM")} />
        <QuickStat label="Day of week" value={format(new Date(), "EEEE")} />
        <QuickStat label="Week" value={`W${format(new Date(), "ww")}`} />
        <QuickStat label="Time" value={format(new Date(), "h:mm a")} live />
      </div>
    </div>
  );
}

function QuickStat({ label, value, live }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setDisplay(format(new Date(), "h:mm a")), 1000);
    return () => clearInterval(id);
  }, [live]);

  return (
    <div>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-300 mt-0.5">{display}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header helper
// ─────────────────────────────────────────────────────────────────────────────
function WidgetHeader({ icon: Icon, iconColor, label, href }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={clsx("p-1.5 rounded-lg", iconColor + "/15")}>
          <Icon size={13} className={iconColor} />
        </div>
        <span className="text-sm font-semibold text-slate-200">{label}</span>
      </div>
      <Link href={href} className="text-xs text-slate-600 hover:text-brand flex items-center gap-1 transition-colors">
        All <ArrowRight size={10} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus Tasks Widget
// ─────────────────────────────────────────────────────────────────────────────
export function FocusTasksWidget({ tasks = [] }) {
  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={CheckCircle} iconColor="text-emerald-400" label="Focus Tasks" href="/tasks" />

      {tasks.length === 0 ? (
        <EmptySlate emoji="🎉" text="No urgent tasks — you're clear!" />
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task) => {
            const pri = TASK_PRIORITIES.find((p) => p.value === task.priority);
            const isUrgent = task.priority === "urgent";
            return (
              <li key={task._id} className={clsx(
                "flex items-start gap-2.5 group rounded-lg px-2.5 py-2 -mx-2.5 transition-colors",
                "hover:bg-surface-2",
              )}>
                <div className={clsx(
                  "h-2 w-2 rounded-full mt-2 shrink-0",
                  isUrgent ? "bg-red-400 animate-pulse" : pri?.dot,
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate group-hover:text-slate-100 transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pri && <Badge className={clsx("text-[10px]", pri.color)}>{pri.label}</Badge>}
                    {task.dueDate && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock size={9} />Due {format(new Date(task.dueDate), "MMM d")}
                      </p>
                    )}
                  </div>
                </div>
                {isUrgent && <AlertCircle size={13} className="text-red-400 shrink-0 mt-1" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Habit Streak Widget
// ─────────────────────────────────────────────────────────────────────────────
export function HabitStreakWidget({ habits = [] }) {
  const todayDone = habits.filter((h) => h.completedToday).length;
  const total     = habits.length;

  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={Zap} iconColor="text-amber-400" label="Habit Streaks" href="/habits" />

      {total > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">{todayDone}/{total} done today</p>
          <div className="flex gap-1">
            {habits.map((h) => (
              <div
                key={h._id}
                className={clsx(
                  "h-1.5 w-4 rounded-full transition-all",
                  h.completedToday ? "bg-amber-400" : "bg-surface-3",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <EmptySlate emoji="⚡" text="No habits yet" />
      ) : (
        <ul className="space-y-2.5">
          {habits.map((habit) => (
            <li key={habit._id} className="flex items-center gap-3 group rounded-lg px-2.5 py-1.5 -mx-2.5 hover:bg-surface-2 transition-colors">
              <span className="text-base leading-none">{habit.icon || "⚡"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{habit.title}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {habit.completedToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                <span className="text-xs font-bold text-amber-400 tabular-nums">
                  {habit.currentStreak}
                  <span className="ml-0.5">🔥</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Stats Widget
// ─────────────────────────────────────────────────────────────────────────────
export function TaskStatsWidget({ stats = {} }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const done  = stats["done"] || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const STAT_ITEMS = [
    { label: "Done",        value: done,                     color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "In Progress", value: stats["in-progress"] || 0, color: "text-blue-400",   bg: "bg-blue-400/10" },
    { label: "To Do",       value: stats["todo"] || 0,       color: "text-slate-400",   bg: "bg-slate-400/10" },
    { label: "Total",       value: total,                    color: "text-slate-300",   bg: "bg-slate-500/10" },
  ];

  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={BarChart3} iconColor="text-blue-400" label="Task Overview" href="/tasks" />

      {/* Big pct + ring */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="5"
              strokeDasharray={`${(pct / 100) * 138.2} 138.2`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-200">{pct}%</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-100">{done}<span className="text-slate-600 text-base font-normal">/{total}</span></p>
          <p className="text-xs text-slate-500 mt-0.5">tasks complete</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STAT_ITEMS.map(({ label, value, color, bg }) => (
          <div key={label} className={clsx("rounded-xl px-3 py-2.5 flex items-center justify-between", bg)}>
            <span className="text-xs text-slate-500">{label}</span>
            <span className={clsx("text-sm font-bold tabular-nums", color)}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Progress Widget
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectProgressWidget({ projects = [] }) {
  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={Folder} iconColor="text-violet-400" label="Active Projects" href="/projects" />

      {projects.length === 0 ? (
        <EmptySlate emoji="📁" text="No active projects" />
      ) : (
        <ul className="space-y-3.5">
          {projects.map((p) => (
            <li key={p._id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color || "#6366f1" }} />
                  <p className="text-sm text-slate-300 truncate">{p.title}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500 ml-2 shrink-0 tabular-nums">{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} color="bg-violet-500" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Pipeline Widget
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "saved",     label: "Saved",     color: "text-slate-400",   bg: "bg-slate-400/10",   bar: "bg-slate-400" },
  { key: "applied",   label: "Applied",   color: "text-blue-400",    bg: "bg-blue-400/10",    bar: "bg-blue-400" },
  { key: "interview", label: "Interview", color: "text-violet-400",  bg: "bg-violet-400/10",  bar: "bg-violet-400" },
  { key: "offer",     label: "Offer",     color: "text-emerald-400", bg: "bg-emerald-400/10", bar: "bg-emerald-400" },
  { key: "rejected",  label: "Rejected",  color: "text-red-400",     bg: "bg-red-400/10",     bar: "bg-red-400" },
];

export function JobPipelineWidget({ pipeline = {} }) {
  const total = Object.values(pipeline).reduce((a, b) => a + b, 0);
  const max   = Math.max(...Object.values(pipeline), 1);

  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={Briefcase} iconColor="text-cyan-400" label="Job Pipeline" href="/jobs" />

      {total === 0 ? (
        <EmptySlate emoji="💼" text="No applications yet" />
      ) : (
        <div className="space-y-2.5">
          {PIPELINE_STAGES.map(({ key, label, color, bg, bar }) => {
            const count = pipeline[key] || 0;
            const pct   = Math.round((count / max) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={clsx("text-xs w-16 shrink-0", color)}>{label}</span>
                <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={clsx("h-full rounded-full transition-all duration-700", bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={clsx("text-xs font-bold w-4 text-right tabular-nums shrink-0", color)}>{count}</span>
              </div>
            );
          })}
          <p className="text-xs text-slate-600 mt-1 pt-1 border-t border-white/[0.04]">{total} total applications</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Learning Widget
// ─────────────────────────────────────────────────────────────────────────────
export function LearningWidget({ items = [] }) {
  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={GraduationCap} iconColor="text-indigo-400" label="Learning" href="/learning" />

      {items.length === 0 ? (
        <EmptySlate emoji="📚" text="Nothing in progress" />
      ) : (
        <ul className="space-y-3.5">
          {items.map((item) => (
            <li key={item._id}>
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm text-slate-300 truncate">{item.title}</p>
                <span className="text-xs font-semibold text-slate-500 ml-2 shrink-0 tabular-nums">{item.progress}%</span>
              </div>
              <ProgressBar value={item.progress} color="bg-indigo-500" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Feed Widget
// ─────────────────────────────────────────────────────────────────────────────
export function ActivityFeedWidget({ activities = [] }) {
  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={Activity} iconColor="text-pink-400" label="Recent Activity" href="/activity" />

      {activities.length === 0 ? (
        <EmptySlate emoji="📋" text="No activity yet" />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-surface-3" />
          <ul className="space-y-3 pl-5">
            {activities.map((a, i) => {
              const meta = ACTIVITY_META[a.type];
              return (
                <li key={a._id} className="relative">
                  {/* Dot */}
                  <div className={clsx(
                    "absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 border-surface-1",
                    meta?.color?.replace("text-", "bg-") || "bg-slate-600",
                  )} />
                  <div>
                    <p className="text-xs text-slate-300 leading-snug">{a.entityTitle}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {meta?.label} · {format(new Date(a.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget Widget
// ─────────────────────────────────────────────────────────────────────────────
export function BudgetWidget({ budget = {} }) {
  const { income = 0, expense = 0, balance = 0 } = budget;
  const isPositive  = balance >= 0;
  const spendPct    = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const safePct     = Math.min(100, spendPct);
  const dangerColor = spendPct > 90 ? "bg-red-400" : spendPct > 70 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="card p-5 flex flex-col">
      <WidgetHeader icon={Wallet} iconColor="text-emerald-400" label="Budget" href="/budget" />

      {income === 0 && expense === 0 ? (
        <EmptySlate emoji="💰" text="No budget entries this month" />
      ) : (
        <>
          {/* Balance hero */}
          <div className="rounded-xl px-4 py-3 mb-4 text-center" style={{
            background: isPositive ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${isPositive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`,
          }}>
            <p className="text-xs text-slate-500 mb-0.5">Balance this month</p>
            <p className={clsx("text-2xl font-bold tracking-tight", isPositive ? "text-emerald-400" : "text-red-400")}>
              {isPositive ? "+" : "−"}₹{Math.abs(balance).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Income / Expense row */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-emerald-400/8 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <TrendingUp size={13} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500">Income</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">₹{income.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="bg-red-400/8 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <TrendingDown size={13} className="text-red-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500">Spent</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">₹{expense.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>

          {/* Spend bar */}
          {income > 0 && (
            <>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span>Spent of income</span>
                <span className={clsx("font-semibold", spendPct > 90 ? "text-red-400" : "text-slate-400")}>{spendPct}%</span>
              </div>
              <ProgressBar value={safePct} color={dangerColor} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptySlate({ emoji, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2">
      <span className="text-2xl opacity-40">{emoji}</span>
      <p className="text-xs text-slate-600 text-center">{text}</p>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Achievements Widget
// ─────────────────────────────────────────────────────────────────────────────
export function AchievementsWidget({ achievements = [], summary = {} }) {
  const unlocked = achievements.filter((a) => a.unlocked).slice(0, 8);
  const pct = summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <span className="text-sm font-semibold text-slate-200">Achievements</span>
        </div>
        <Link href="/achievements" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
          All <ArrowRight size={11} />
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{summary.unlocked || 0} unlocked</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {unlocked.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-3">Complete habits & tasks to unlock achievements</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {unlocked.map((a) => (
            <div key={a._id} title={`${a.title} — ${a.description}`}
              className="h-9 w-9 rounded-xl bg-brand/10 flex items-center justify-center text-lg cursor-default hover:bg-brand/20 transition-colors">
              {a.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
