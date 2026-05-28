const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/changelogController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

router.get("/", optionalAuth, ctrl.list);

module.exports = router;
