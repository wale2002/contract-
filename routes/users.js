const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // Assumes this is the same as the `protect` middleware
const checkPermission = require("../middleware/checkPermission");
const userController = require("../controllers/userController");

// Role Management Routes (moved before parameterized user routes to avoid conflicts)
router.post(
  "/roles",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.createRole
);

router.get(
  "/roles",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.getAllRoles
);

router.put(
  "/roles/:id",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.updateRole
);

router.delete(
  "/roles/:id",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.deleteRole
);

// User Management Routes
router.post(
  "/",
  authMiddleware,
  checkPermission("UserManagement.createUsers"),
  userController.createUser
);

router.get(
  "/",
  authMiddleware,
  checkPermission("UserManagement.viewUsers"),
  userController.getAllUsers
);

router.get(
  "/metrics",
  authMiddleware,
  checkPermission("UserManagement.viewUsers"),
  userController.getUserMetrics
);

router.get(
  "/:id",
  authMiddleware,
  checkPermission("UserManagement.viewUsers"),
  userController.getUserById
);

// Admin update (uncommented and fixed)
router.put(
  "/:id",
  authMiddleware,
  checkPermission("UserManagement.editUsers"),
  userController.updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission("UserManagement.deleteUsers"),
  userController.deleteUser
);

router.post(
  "/:id/reset-password",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.resetUserPassword
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  checkPermission("UserManagement.manageUserRoles"),
  userController.deactivateUser
);
router.put("/profile", authMiddleware, userController.updateUser); // No permission needed for self
module.exports = router;
