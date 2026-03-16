const mongoose = require("mongoose");

const dailyStatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Stored as YYYY-MM-DD string — unique per user per day
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    codingMinutes:   { type: Number, default: 0, min: 0 },
    readingMinutes:  { type: Number, default: 0, min: 0 },
    habitsCompleted: { type: Number, default: 0, min: 0 },
    focusMinutes:    { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

dailyStatSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyStatSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("DailyStat", dailyStatSchema);
