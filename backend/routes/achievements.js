const express = require("express");
const router = express.Router();
const { getAchievements, triggerEvaluation } = require("../controllers/achievementController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.get("/", getAchievements);
router.post("/evaluate", triggerEvaluation);
module.exports = router;
