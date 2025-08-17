const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const organizationController = require("../controllers/organizationController");

router.get("/", authMiddleware, organizationController.getOrganizations);
router.post("/", authMiddleware, organizationController.addOrganization);
router.delete(
  "/:id",
  authMiddleware,
  organizationController.deleteOrganization
);
router.patch("/:id", authMiddleware, organizationController.updateOrganization);
router.get(
  "/metrics",
  authMiddleware,
  organizationController.getOrganizationMetrics
);
module.exports = router;
