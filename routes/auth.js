// const express = require("express");
// const router = express.Router();
// const authController = require("../controllers/authController");
// const authMiddleware = require("../middleware/auth");

// router.post("/login", authController.login);
// router.post("/request-reset", authController.requestResetPassword);
// router.post("/reset-password", authController.resetPassword);
// router.post("/logout", authController.logout);
// router.get("/me", authController.getMe);
// // router.put("/:userId", authMiddleware, authController.updateUser);
// router.get("/", authMiddleware, authController.getAuditLogs);

// module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/login", authController.login);
router.post("/request-reset", authController.requestResetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);
// router.put("/:userId", authMiddleware, authController.updateUser);
router.get("/", authMiddleware, authController.getAuditLogs);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post(
  "/admin-reset-password",
  authMiddleware,
  authController.adminResetPassword
);

module.exports = router;
