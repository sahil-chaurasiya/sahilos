const asyncHandler = require("../middleware/asyncHandler");
const LifeVision = require("../models/LifeVision");
const { logActivity } = require("../utils/activityLogger");

/**
 * @desc  Get current user's life vision (returns empty defaults if none)
 * @route GET /api/vision
 */
const getVision = asyncHandler(async (req, res) => {
  let vision = await LifeVision.findOne({ userId: req.user._id }).lean();

  if (!vision) {
    vision = {
      userId:          req.user._id,
      mission:         "",
      threeYearVision: "",
      oneYearGoals:    "",
      currentFocus:    "",
    };
  }

  res.json({ success: true, data: vision });
});

/**
 * @desc  Upsert life vision
 * @route PUT /api/vision
 */
const saveVision = asyncHandler(async (req, res) => {
  const { mission, threeYearVision, oneYearGoals, currentFocus } = req.body;

  const vision = await LifeVision.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { mission, threeYearVision, oneYearGoals, currentFocus } },
    { new: true, upsert: true, runValidators: true }
  );

  logActivity(req.user._id, "vision_updated", vision._id, "Life Vision updated");
  res.json({ success: true, data: vision });
});

module.exports = { getVision, saveVision };
