const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.get("/progress", ctrl.progress);
router.post("/complete/:step", ctrl.complete);
router.post("/skip/:step", ctrl.skip);
router.post("/reset", ctrl.reset);

module.exports = router;
