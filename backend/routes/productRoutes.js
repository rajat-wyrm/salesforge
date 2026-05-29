const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", ctrl.list);
router.get("/categories", ctrl.categories);
router.post("/", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.get("/:id", ctrl.get);
router.patch("/:id", permit("OWNER", "ADMIN", "MEMBER"), ctrl.update);
router.delete("/:id", permit("OWNER", "ADMIN"), ctrl.remove);

module.exports = router;
