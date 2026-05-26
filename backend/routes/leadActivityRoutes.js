const express = require("express");
const router = express.Router({ mergeParams: true });
const ctrl = require("../controllers/leadActivityController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.get("/:leadId/activity", ctrl.list);

module.exports = router;
