const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const organizationController = require("../controllers/organizationController");

router.get(
  "/",
  authMiddleware,
  checkPermission("OrganizationManagement.viewOrganizations"),
  organizationController.getOrganizations
);
router.post(
  "/",
  authMiddleware,
  checkPermission("OrganizationManagement.createOrganizations"),
  organizationController.addOrganization
);
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("OrganizationManagement.deleteOrganizations"),
  organizationController.deleteOrganization
);
router.patch(
  "/:id",
  authMiddleware,
  checkPermission("OrganizationManagement.editOrganizations"),
  organizationController.updateOrganization
);
router.get(
  "/metrics",
  authMiddleware,
  checkPermission("OrganizationManagement.viewOrganizations"), // Assuming metrics requires view permission
  organizationController.getOrganizationMetrics
);
router.get(
  "/:id",
  authMiddleware,
  checkPermission("OrganizationManagement.viewOrganizations"),
  organizationController.getOrganization
);

module.exports = router;
