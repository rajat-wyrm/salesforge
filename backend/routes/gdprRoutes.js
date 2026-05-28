const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/gdprController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");

router.use(protect, tenantScope);

router.get("/export", ctrl.exportOrgData);

module.exports = router;
