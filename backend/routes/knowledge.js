const express = require("express");
const router = express.Router();
const { getEntries, getEntry, createEntry, updateEntry, deleteEntry } = require("../controllers/knowledgeController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.route("/").get(getEntries).post(createEntry);
router.route("/:id").get(getEntry).put(updateEntry).delete(deleteEntry);
module.exports = router;
