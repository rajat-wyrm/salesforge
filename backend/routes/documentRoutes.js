const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const ctrl = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");
const { cacheMiddleware } = require("../utils/cache");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

router.use(protect, tenantScope);

router.get("/metrics", ctrl.metrics);
router.get("/", cacheMiddleware(60), ctrl.list);
router.get("/:id", ctrl.get);
router.post("/upload", permit("OWNER", "ADMIN", "MEMBER"), ctrl.upload);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

// Public download route (no auth - file is accessed by hash)
router.get("/:hash/download", (req, res) => {
  const filepath = path.join(UPLOAD_DIR, req.params.hash);
  if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, message: "File not found." });
  res.download(filepath);
});

module.exports = router;
