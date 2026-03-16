const asyncHandler = require("../middleware/asyncHandler");
const Achievement = require("../models/Achievement");
const { seedAchievements, evaluateAchievements } = require("../utils/achievementEngine");

/**
 * @desc  Get all achievements for user (seeds if first time)
 * @route GET /api/achievements
 */
const getAchievements = asyncHandler(async (req, res) => {
  await seedAchievements(req.user._id);

  const achievements = await Achievement.find({ userId: req.user._id })
    .sort({ unlocked: -1, conditionValue: 1 })
    .lean();

  const unlocked = achievements.filter((a) => a.unlocked).length;

  res.json({
    success: true,
    data: achievements,
    summary: { total: achievements.length, unlocked },
  });
});

/**
 * @desc  Manually trigger achievement evaluation (for testing / on-demand)
 * @route POST /api/achievements/evaluate
 */
const triggerEvaluation = asyncHandler(async (req, res) => {
  evaluateAchievements(req.user._id);
  res.json({ success: true, message: "Achievement evaluation triggered" });
});

module.exports = { getAchievements, triggerEvaluation };
