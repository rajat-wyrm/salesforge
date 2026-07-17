const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/integrationMarketplaceController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

// Public route for OAuth mock provider
router.get("/oauth/:provider", ctrl.oauthProvider);
router.get("/oauth/callback/:provider", ctrl.oauthCallback);

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/catalog", ctrl.config);
router.post("/install", permit("OWNER", "ADMIN"), ctrl.install);
router.patch("/:id", permit("OWNER", "ADMIN"), ctrl.update);
router.post("/:id/validate", permit("OWNER", "ADMIN"), ctrl.validate);
router.post("/:id/sync", permit("OWNER", "ADMIN"), ctrl.sync);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.uninstall);

module.exports = router;
