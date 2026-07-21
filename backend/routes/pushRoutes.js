const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { subscribe, notify } = require("../controllers/pushController");

// Protected routes to ensure req.user is set
router.post("/subscribe", protect, subscribe);
router.post("/notify", protect, notify);

module.exports = router;
