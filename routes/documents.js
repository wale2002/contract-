const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const { validateDocumentUpload } = require("../middleware/validate");
const { upload } = require("../config/cloudinaryStorage");
const documentController = require("../controllers/documentController");

router.get(
  "/:orgId/documents",
  authMiddleware,
  checkPermission("DocumentManagement.viewDocuments"),
  documentController.getDocuments
);
router.get(
  "/enhanced-alerts/:orgId",
  authMiddleware,
  documentController.getEnhancedContractExpiryAlerts
);
router.get(
  "/global-alerts",
  authMiddleware,
  checkPermission("DocumentManagement.viewDocuments"),
  documentController.getGlobalExpiryAlerts
);
router.post(
  "/:orgId/upload",
  authMiddleware,
  checkPermission("DocumentManagement.uploadDocuments"),
  upload.single("file"), // Only handle the file field here
  validateDocumentUpload,
  documentController.uploadDocument
);
router.get(
  "/download/:id",
  authMiddleware,
  checkPermission("DocumentManagement.viewDocuments"), // Assuming download requires view permission
  documentController.downloadDocument
);
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("DocumentManagement.deleteDocuments"),
  documentController.deleteDocument
);
router.patch(
  "/:id",
  authMiddleware,
  checkPermission("DocumentManagement.editDocuments"),
  documentController.updateDocument
);
router.get(
  "/user/:userId",
  authMiddleware,
  checkPermission("DocumentManagement.viewDocuments"),
  documentController.getDocumentsByUser
);
router.get(
  "/metrics/:orgId",
  authMiddleware,
  checkPermission("DocumentManagement.viewDocuments"), // Assuming metrics requires view permission
  documentController.getDocumentMetrics
);

router.post(
  "/:id/approve",
  authMiddleware,
  checkPermission("DocumentManagement.approveDocuments"),
  documentController.approveDocument // Added for document approval
);

router.get(
  "/alerts/:orgId",
  authMiddleware,
  documentController.getContractExpiryAlerts
);

router.get(
  "/notifications/:orgId",
  authMiddleware,
  documentController.getNotifications
);

module.exports = router;
