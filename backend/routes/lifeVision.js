const express = require("express");
const router = express.Router();
const { getVision, saveVision } = require("../controllers/lifeVisionController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.route("/").get(getVision).put(saveVision);
module.exports = router;
