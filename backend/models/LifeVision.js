const mongoose = require("mongoose");

const lifeVisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one per user
      index: true,
    },
    mission:         { type: String, default: "", maxlength: [2000, "Too long"] },
    threeYearVision: { type: String, default: "", maxlength: [3000, "Too long"] },
    oneYearGoals:    { type: String, default: "", maxlength: [3000, "Too long"] },
    currentFocus:    { type: String, default: "", maxlength: [1000, "Too long"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LifeVision", lifeVisionSchema);
