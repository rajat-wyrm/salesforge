const express = require("express");
const router = express.Router({ mergeParams: true });
const ctrl = require("../controllers/leadNoteController");
const { protect } = require("../middleware/authMiddleware");
const tenantScope = require("../middleware/tenant");
const { permit } = require("../middleware/rbac");

router.use(protect, tenantScope);

router.get("/:leadId/notes", ctrl.list);
router.post("/:leadId/notes", permit("OWNER", "ADMIN", "MEMBER"), ctrl.create);
router.patch("/:leadId/notes/:id", ctrl.update);
router.delete("/:leadId/notes/:id", ctrl.remove);

module.exports = router;
