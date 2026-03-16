const express = require("express");
const router = express.Router();
const { getStats, getToday, logStat } = require("../controllers/dailyStatController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.get("/today", getToday);
router.route("/").get(getStats).post(logStat);
module.exports = router;
