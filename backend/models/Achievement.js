const mongoose = require("mongoose");

// All possible achievement definitions — seeded on first check per user
const ACHIEVEMENT_DEFINITIONS = [
  // ── TEST (remove after verifying popup works) ──────────────────────────────
  { key: "first_login",    title: "Welcome to SahilOS", description: "Open the achievements page",           icon: "👋", conditionType: "knowledge_count", conditionValue: 1 },

  // Habits
  { key: "habit_streak_7",   title: "7-Day Streak",       description: "Complete a habit 7 days in a row",      icon: "🔥", conditionType: "habit_streak",    conditionValue: 7 },
  { key: "habit_streak_30",  title: "30-Day Streak",      description: "Complete a habit 30 days in a row",     icon: "🌟", conditionType: "habit_streak",    conditionValue: 30 },
  { key: "habit_streak_100", title: "Century Streak",     description: "Complete a habit 100 days in a row",    icon: "💎", conditionType: "habit_streak",    conditionValue: 100 },
  // Tasks
  { key: "tasks_10",         title: "Task Slayer",         description: "Complete 10 tasks",                     icon: "✅", conditionType: "tasks_completed", conditionValue: 10 },
  { key: "tasks_50",         title: "Task Machine",        description: "Complete 50 tasks",                     icon: "⚡", conditionType: "tasks_completed", conditionValue: 50 },
  { key: "tasks_100",        title: "Centurion",           description: "Complete 100 tasks",                    icon: "🏆", conditionType: "tasks_completed", conditionValue: 100 },
  // Projects
  { key: "projects_1",       title: "First Ship",          description: "Complete your first project",           icon: "🚀", conditionType: "projects_done",   conditionValue: 1 },
  { key: "projects_5",       title: "Serial Builder",      description: "Complete 5 projects",                   icon: "🏗️", conditionType: "projects_done",   conditionValue: 5 },
  { key: "projects_10",      title: "Prolific Creator",    description: "Complete 10 projects",                  icon: "🎯", conditionType: "projects_done",   conditionValue: 10 },
  // Learning
  { key: "learning_5",       title: "Curious Mind",        description: "Complete 5 learning items",             icon: "📚", conditionType: "learning_done",   conditionValue: 5 },
  { key: "learning_20",      title: "Knowledge Seeker",    description: "Complete 20 learning items",            icon: "🧠", conditionType: "learning_done",   conditionValue: 20 },
  // Journal
  { key: "journal_7",        title: "Week of Reflection",  description: "Write journal entries 7 days in a row", icon: "📖", conditionType: "journal_streak",  conditionValue: 7 },
  { key: "journal_30",       title: "Month of Clarity",    description: "Write journal entries 30 days in a row",icon: "✍️", conditionType: "journal_streak",  conditionValue: 30 },
  // Knowledge
  { key: "knowledge_10",     title: "Second Brain",        description: "Add 10 knowledge entries",              icon: "💡", conditionType: "knowledge_count", conditionValue: 10 },
  // Budget
  { key: "budget_first",     title: "Money Aware",         description: "Log your first budget entry",           icon: "💰", conditionType: "budget_count",    conditionValue: 1 },
];

const achievementSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key:            { type: String, required: true }, // matches ACHIEVEMENT_DEFINITIONS key
    title:          { type: String, required: true },
    description:    { type: String, required: true },
    icon:           { type: String, default: "🏅" },
    conditionType:  { type: String, required: true },
    conditionValue: { type: Number, required: true },
    unlocked:       { type: Boolean, default: false },
    unlockedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });
achievementSchema.index({ userId: 1, unlocked: 1 });

module.exports = mongoose.model("Achievement", achievementSchema);
module.exports.ACHIEVEMENT_DEFINITIONS = ACHIEVEMENT_DEFINITIONS;