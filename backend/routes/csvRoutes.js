const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/csvController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.post("/leads/import", permit("OWNER", "ADMIN", "MEMBER"), ctrl.importLeads);
router.get("/leads/export", ctrl.exportLeads);

module.exports = router;
