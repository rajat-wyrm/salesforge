const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { cacheMiddleware } = require("../utils/cache");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect, tenantScope);

router.get("/metrics", ctrl.metrics);
router.get("/", cacheMiddleware(60), ctrl.list);
router.get("/:id", ctrl.get);
// Frontend sends POST /documents with multipart/form-data
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), upload.single("file"), ctrl.upload);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);
// Frontend calls GET /documents/:id/download
router.get("/:id/download", ctrl.download);

module.exports = router;
