const Achievement = require("../models/Achievement");
const { ACHIEVEMENT_DEFINITIONS } = require("../models/Achievement");
const Task = require("../models/Task");
const Project = require("../models/Project");
const LearningItem = require("../models/LearningItem");
const JournalEntry = require("../models/JournalEntry");
const Habit = require("../models/Habit");
const Budget = require("../models/Budget");
const Knowledge = require("../models/Knowledge");
const { logActivity } = require("./activityLogger");

/**
 * Ensure all achievement documents exist for a user (seed on first run).
 */
const seedAchievements = async (userId) => {
  const existing = await Achievement.find({ userId }).select("key").lean();
  const existingKeys = new Set(existing.map((a) => a.key));

  const missing = ACHIEVEMENT_DEFINITIONS.filter((def) => !existingKeys.has(def.key));
  if (missing.length === 0) return;

  await Achievement.insertMany(
    missing.map((def) => ({ userId, ...def })),
    { ordered: false }
  );
};

/**
 * Compute current values for each condition type.
 */
const computeMetrics = async (userId) => {
  const [
    tasksCompleted,
    projectsDone,
    learningDone,
    habits,
    journalEntries,
    budgetCount,
    knowledgeCount,
  ] = await Promise.all([
    Task.countDocuments({ userId, isDeleted: false, status: "done" }),
    Project.countDocuments({ userId, isDeleted: false, status: "completed" }),
    LearningItem.countDocuments({ userId, isDeleted: false, status: "completed" }),
    Habit.find({ userId, isDeleted: false }).select("currentStreak longestStreak").lean(),
    JournalEntry.find({ userId, isDeleted: false, content: { $ne: "" } }).select("date").sort({ date: -1 }).lean(),
    Budget.countDocuments({ userId, isDeleted: false }),
    Knowledge.countDocuments({ userId, isDeleted: false }),
  ]);

  // Best current habit streak
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  // Journal streak (consecutive days ending today)
  let journalStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const journalDates = journalEntries.map((e) => e.date);
  let check = today;
  for (let i = 0; i < 365; i++) {
    if (journalDates.includes(check)) {
      journalStreak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else if (i === 0) {
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  return {
    habit_streak:    bestStreak,
    tasks_completed: tasksCompleted,
    projects_done:   projectsDone,
    learning_done:   learningDone,
    journal_streak:  journalStreak,
    budget_count:    budgetCount,
    knowledge_count: knowledgeCount,
  };
};

/**
 * evaluateAchievements
 * Called after any mutation that might unlock achievements.
 * Fire-and-forget — never blocks response.
 */
const evaluateAchievements = (userId) => {
  (async () => {
    try {
      await seedAchievements(userId);
      const metrics = await computeMetrics(userId);

      // Find all locked achievements for this user
      const locked = await Achievement.find({ userId, unlocked: false });

      for (const ach of locked) {
        const currentValue = metrics[ach.conditionType] ?? 0;
        if (currentValue >= ach.conditionValue) {
          ach.unlocked = true;
          ach.unlockedAt = new Date();
          await ach.save();

          // Log activity for the unlock
          logActivity(userId, "achievement_unlocked", ach._id, ach.title, {
            icon: ach.icon,
          });
        }
      }
    } catch (err) {
      console.error("⚠️  Achievement evaluation failed:", err.message);
    }
  })();
};

module.exports = { evaluateAchievements, seedAchievements };
