// ── Task ──────────────────────────────────────────────────────────────────────
export const TASK_STATUSES = [
  { value: "todo",        label: "To Do",      color: "bg-slate-500/20 text-slate-400" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  { value: "review",      label: "Review",      color: "bg-amber-500/20 text-amber-400" },
  { value: "done",        label: "Done",        color: "bg-emerald-500/20 text-emerald-400" },
];

export const TASK_PRIORITIES = [
  { value: "low",    label: "Low",    color: "bg-slate-500/20 text-slate-400",  dot: "bg-slate-400" },
  { value: "medium", label: "Medium", color: "bg-blue-500/20 text-blue-400",    dot: "bg-blue-400" },
  { value: "high",   label: "High",   color: "bg-amber-500/20 text-amber-400",  dot: "bg-amber-400" },
  { value: "urgent", label: "Urgent", color: "bg-red-500/20 text-red-400",      dot: "bg-red-400" },
];

// ── Project ───────────────────────────────────────────────────────────────────
export const PROJECT_STATUSES = [
  { value: "active",    label: "Active",    color: "bg-emerald-500/20 text-emerald-400" },
  { value: "paused",    label: "Paused",    color: "bg-amber-500/20 text-amber-400" },
  { value: "completed", label: "Completed", color: "bg-slate-500/20 text-slate-400" },
];

export const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#3b82f6", "#14b8a6",
];

// ── Job ───────────────────────────────────────────────────────────────────────
export const JOB_STAGES = [
  { value: "saved",     label: "Saved",     color: "bg-slate-500/20 text-slate-400" },
  { value: "applied",   label: "Applied",   color: "bg-blue-500/20 text-blue-400" },
  { value: "interview", label: "Interview", color: "bg-violet-500/20 text-violet-400" },
  { value: "offer",     label: "Offer",     color: "bg-emerald-500/20 text-emerald-400" },
  { value: "rejected",  label: "Rejected",  color: "bg-red-500/20 text-red-400" },
];

// ── Learning ──────────────────────────────────────────────────────────────────
export const LEARNING_CATEGORIES = [
  { value: "skill",  label: "Skill" },
  { value: "course", label: "Course" },
  { value: "book",   label: "Book" },
  { value: "other",  label: "Other" },
];

export const LEARNING_STATUSES = [
  { value: "not-started",  label: "Not Started", color: "bg-slate-500/20 text-slate-400" },
  { value: "in-progress",  label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  { value: "completed",    label: "Completed",   color: "bg-emerald-500/20 text-emerald-400" },
];

// ── Journal moods ─────────────────────────────────────────────────────────────
export const MOODS = [
  { value: "great",   label: "Great",   emoji: "🚀", color: "text-emerald-400" },
  { value: "good",    label: "Good",    emoji: "😊", color: "text-green-400" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "text-slate-400" },
  { value: "bad",     label: "Bad",     emoji: "😔", color: "text-amber-400" },
  { value: "awful",   label: "Awful",   emoji: "😞", color: "text-red-400" },
];

// ── Activity types ────────────────────────────────────────────────────────────
export const ACTIVITY_META = {
  task_created:        { label: "Created a task",          icon: "CheckSquare",   color: "text-blue-400" },
  task_completed:      { label: "Completed a task",        icon: "CheckCircle",   color: "text-emerald-400" },
  habit_completed:     { label: "Completed a habit",       icon: "Zap",           color: "text-amber-400" },
  project_created:     { label: "Created a project",       icon: "FolderPlus",    color: "text-violet-400" },
  project_updated:     { label: "Updated a project",       icon: "Folder",        color: "text-violet-300" },
  job_added:           { label: "Added a job application", icon: "Briefcase",     color: "text-cyan-400" },
  job_stage_changed:   { label: "Updated job stage",       icon: "ArrowRight",    color: "text-cyan-300" },
  idea_saved:          { label: "Saved an idea",           icon: "Lightbulb",     color: "text-yellow-400" },
  journal_written:     { label: "Wrote a journal entry",   icon: "BookOpen",      color: "text-pink-400" },
  learning_updated:    { label: "Updated learning item",   icon: "GraduationCap", color: "text-indigo-400" },
  knowledge_added:     { label: "Added to Knowledge Vault",icon: "Brain",         color: "text-teal-400" },
  vision_updated:      { label: "Updated Life Vision",     icon: "Compass",       color: "text-brand" },
  achievement_unlocked:{ label: "Unlocked an achievement", icon: "Trophy",        color: "text-amber-400" },
  daily_stat_logged:   { label: "Logged daily stats",      icon: "BarChart2",     color: "text-slate-400" },
};

// ── Nav items ─────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: "LayoutDashboard" },
  { href: "/tasks",        label: "Tasks",        icon: "CheckSquare" },
  { href: "/projects",     label: "Projects",     icon: "Folder" },
  { href: "/habits",       label: "Habits",       icon: "Zap" },
  { href: "/ideas",        label: "Ideas",        icon: "Lightbulb" },
  { href: "/jobs",         label: "Jobs",         icon: "Briefcase" },
  { href: "/learning",     label: "Learning",     icon: "GraduationCap" },
  { href: "/budget",       label: "Budget",       icon: "Wallet" },
  { href: "/knowledge",    label: "Knowledge",    icon: "Brain" },
  { href: "/vision",       label: "Life Vision",  icon: "Compass" },
  { href: "/heatmap",      label: "Heatmap",      icon: "BarChart2" },
  { href: "/achievements", label: "Achievements", icon: "Trophy" },
  { href: "/journal",      label: "Journal",      icon: "BookOpen" },
  { href: "/activity",     label: "Activity",     icon: "Activity" },
  { href: "/ai",           label: "AI Assistant", icon: "Sparkles" },
];