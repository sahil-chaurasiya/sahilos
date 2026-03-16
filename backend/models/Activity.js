const mongoose = require("mongoose");

// ── Allowed activity types (enforced enum) ─────────────────────────────────────
const ACTIVITY_TYPES = [
  "task_created",
  "task_completed",
  "habit_completed",
  "project_created",
  "project_updated",
  "job_added",
  "job_stage_changed",
  "idea_saved",
  "journal_written",
  "learning_updated",
  "knowledge_added",
  "vision_updated",
  "achievement_unlocked",
  "daily_stat_logged",
];

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ACTIVITY_TYPES,
        message: `Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`,
      },
      required: [true, "Activity type is required"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    // Flexible bag for extra context (stage transitions, mood, etc.)
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Only createdAt matters — no updates to activity records
    updatedAt: false,
  }
);

// Compound index for fast per-user feed queries (newest first)
activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
