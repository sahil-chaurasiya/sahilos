const asyncHandler = require("../middleware/asyncHandler");
const DailyStat = require("../models/DailyStat");
const { logActivity } = require("../utils/activityLogger");

/**
 * @desc  Get stats for a date range (for heatmap)
 * @route GET /api/daily-stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getStats = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const filter = { userId: req.user._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to)   filter.date.$lte = to;
  }

  const stats = await DailyStat.find(filter)
    .sort({ date: 1 })
    .lean();

  res.json({ success: true, data: stats });
});

/**
 * @desc  Get today's stat
 * @route GET /api/daily-stats/today
 */
const getToday = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stat = await DailyStat.findOne({ userId: req.user._id, date: today }).lean();

  res.json({
    success: true,
    data: stat || {
      date: today,
      codingMinutes: 0,
      readingMinutes: 0,
      habitsCompleted: 0,
      focusMinutes: 0,
    },
  });
});

/**
 * @desc  Upsert today's stat
 * @route POST /api/daily-stats
 */
const logStat = asyncHandler(async (req, res) => {
  const { date, codingMinutes, readingMinutes, habitsCompleted, focusMinutes } = req.body;

  const statDate = date || new Date().toISOString().slice(0, 10);

  const stat = await DailyStat.findOneAndUpdate(
    { userId: req.user._id, date: statDate },
    {
      $set: {
        userId: req.user._id,
        date: statDate,
        codingMinutes:   codingMinutes   ?? 0,
        readingMinutes:  readingMinutes  ?? 0,
        habitsCompleted: habitsCompleted ?? 0,
        focusMinutes:    focusMinutes    ?? 0,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  logActivity(req.user._id, "daily_stat_logged", stat._id, `Stats logged for ${statDate}`);
  res.json({ success: true, data: stat });
});

module.exports = { getStats, getToday, logStat };
