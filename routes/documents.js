const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { validateDocumentUpload } = require("../middleware/validate");
const { upload } = require("../config/megaStorage");
const documentController = require("../controllers/documentController");

router.get("/:orgId", authMiddleware, documentController.getDocuments);
router.post(
  "/:orgId/upload",
  authMiddleware,
  upload.single("file"),
  validateDocumentUpload,
  documentController.uploadDocument
);
router.get(
  "/download/:id",
  authMiddleware,
  documentController.downloadDocument
);
router.delete("/:id", authMiddleware, documentController.deleteDocument);
router.patch("/:id", authMiddleware, documentController.updateDocument);
router.get(
  "/user/:userId",
  authMiddleware,
  documentController.getDocumentsByUser
);
router.get(
  "/metrics/:orgId",
  authMiddleware,
  documentController.getDocumentMetrics
);
module.exports = router;
