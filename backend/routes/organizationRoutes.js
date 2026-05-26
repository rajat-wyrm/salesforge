const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/organizationController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const validate = require("../middleware/validate");
const { organizationQuerySchema, updateOrganizationSchema } = require("../validations/organizationValidation");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/", validate(organizationQuerySchema, "query"), ctrl.getAllOrganizations);
router.get("/:id", ctrl.getOrganizationById);
router.post("/", permit("OWNER", "ADMIN"), ctrl.createOrganization);
router.patch("/:id", permit("OWNER", "ADMIN"), validate(updateOrganizationSchema), ctrl.updateOrganization);
router.delete("/:id", permit("OWNER"), ctrl.deleteOrganization);

module.exports = router;
