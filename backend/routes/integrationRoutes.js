const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/integrationController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.listProviders);
router.post("/import", permit("OWNER", "ADMIN", "MEMBER"), ctrl.importFromIntegration);

module.exports = router;
