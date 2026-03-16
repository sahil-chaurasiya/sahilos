const asyncHandler = require("../middleware/asyncHandler");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");
const { evaluateAchievements } = require("../utils/achievementEngine");
const {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateWeeklySuccessRate,
  normaliseDate,
} = require("../utils/streakCalculator");

// Helper: midnight UTC Date from a date string or today
const toMidnightUTC = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * @desc    Get all habits
 * @route   GET /api/habits
 * @access  Private
 */
const getHabits = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const filter = { userId: req.user._id, isDeleted: false };

  const [habits, total] = await Promise.all([
    Habit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Habit.countDocuments(filter),
  ]);

  // Attach "completedToday" flag to each habit
  const todayStr = normaliseDate(new Date());
  const todayLogs = await HabitLog.find({
    userId: req.user._id,
    completedDate: toMidnightUTC(),
  })
    .select("habitId")
    .lean();

  const completedTodaySet = new Set(
    todayLogs.map((l) => l.habitId.toString())
  );

  const habitsWithFlags = habits.map((h) => ({
    ...h,
    completedToday: completedTodaySet.has(h._id.toString()),
  }));

  res.json({
    success: true,
    pagination: getPaginationMeta(total),
    data: habitsWithFlags,
  });
});

/**
 * @desc    Create habit
 * @route   POST /api/habits
 * @access  Private
 */
const createHabit = asyncHandler(async (req, res) => {
  const { title, description, frequency, color, icon } = req.body;

  if (!title) {
    res.statusCode = 400;
    throw new Error("Habit title is required");
  }

  const habit = await Habit.create({
    userId: req.user._id,
    title,
    description,
    frequency,
    color,
    icon,
  });

  res.status(201).json({ success: true, data: habit });
});

/**
 * @desc    Update habit
 * @route   PUT /api/habits/:id
 * @access  Private
 */
const updateHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!habit) {
    res.statusCode = 404;
    throw new Error("Habit not found");
  }

  const allowedFields = ["title", "description", "frequency", "color", "icon"];
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) habit[f] = req.body[f];
  });

  await habit.save();
  res.json({ success: true, data: habit });
});

/**
 * @desc    Soft delete habit
 * @route   DELETE /api/habits/:id
 * @access  Private
 */
const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!habit) {
    res.statusCode = 404;
    throw new Error("Habit not found");
  }

  res.json({ success: true, message: "Habit deleted" });
});

/**
 * @desc    Log habit completion for today (idempotent)
 * @route   POST /api/habits/:id/log
 * @access  Private
 */
const logToday = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!habit) {
    res.statusCode = 404;
    throw new Error("Habit not found");
  }

  const completedDate = toMidnightUTC();

  // Upsert — safe to call multiple times on same day
  const log = await HabitLog.findOneAndUpdate(
    { habitId: habit._id, completedDate },
    { userId: req.user._id, habitId: habit._id, completedDate, note: req.body.note || "" },
    { upsert: true, new: true }
  );

  // Recalculate and persist streaks
  const allLogs = await HabitLog.find({ habitId: habit._id })
    .select("completedDate")
    .lean();
  const dates = allLogs.map((l) => l.completedDate);

  habit.currentStreak = calculateCurrentStreak(dates);
  habit.longestStreak = Math.max(
    habit.longestStreak,
    calculateLongestStreak(dates)
  );
  await habit.save();

  logActivity(req.user._id, "habit_completed", habit._id, habit.title, {
    streak: habit.currentStreak,
  });
  invalidateDashboardCache(req.user._id);
  evaluateAchievements(req.user._id);
  res.json({
    success: true,
    data: { log, currentStreak: habit.currentStreak },
  });
});

/**
 * @desc    Remove today's log (un-complete)
 * @route   DELETE /api/habits/:id/log
 * @access  Private
 */
const unlogToday = asyncHandler(async (req, res) => {
  const completedDate = toMidnightUTC();

  await HabitLog.findOneAndDelete({
    habitId: req.params.id,
    userId: req.user._id,
    completedDate,
  });

  // Recalculate streaks after removal
  const habit = await Habit.findById(req.params.id);
  if (habit) {
    const allLogs = await HabitLog.find({ habitId: habit._id })
      .select("completedDate")
      .lean();
    const dates = allLogs.map((l) => l.completedDate);
    habit.currentStreak = calculateCurrentStreak(dates);
    await habit.save();
  }

  res.json({ success: true, message: "Log removed" });
});

/**
 * @desc    Get habit stats + heatmap data (last 90 days)
 * @route   GET /api/habits/:id/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  }).lean();

  if (!habit) {
    res.statusCode = 404;
    throw new Error("Habit not found");
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const logs = await HabitLog.find({
    habitId: habit._id,
    completedDate: { $gte: ninetyDaysAgo },
  })
    .select("completedDate")
    .lean();

  const allLogs = await HabitLog.find({ habitId: habit._id })
    .select("completedDate")
    .lean();

  const dates = allLogs.map((l) => l.completedDate);

  // Heatmap: array of { date: 'YYYY-MM-DD', count: 1 }
  const heatmap = logs.map((l) => ({
    date: normaliseDate(l.completedDate),
    count: 1,
  }));

  res.json({
    success: true,
    data: {
      habit,
      currentStreak: calculateCurrentStreak(dates),
      longestStreak: calculateLongestStreak(dates),
      weeklySuccessRate: calculateWeeklySuccessRate(dates),
      totalCompletions: allLogs.length,
      heatmap,
    },
  });
});

module.exports = {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  logToday,
  unlogToday,
  getStats,
};
