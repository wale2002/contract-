// // const express = require("express");
// // const router = express.Router();
// // const authMiddleware = require("../middleware/auth");
// // const userController = require("../controllers/userController");

// // router.post("/", authMiddleware, userController.createUser);
// // router.get("/", authMiddleware, userController.getAllUsers);
// // router.get("/metrics", authMiddleware, userController.getUserMetrics); // Moved before /:id
// // router.get("/:id", authMiddleware, userController.getUserById);
// // router.put("/:id", authMiddleware, userController.updateUser);
// // router.delete("/:id", authMiddleware, userController.deleteUser);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/auth");
// const checkPermission = require("../middleware/checkPermission");
// const userController = require("../controllers/userController");

// router.post(
//   "/",
//   authMiddleware,
//   checkPermission("UserManagement.createUsers"),
//   userController.createUser
// );
// router.get(
//   "/",
//   authMiddleware,
//   checkPermission("UserManagement.viewUsers"),
//   userController.getAllUsers
// );
// router.get(
//   "/metrics",
//   authMiddleware,
//   checkPermission("UserManagement.viewUsers"), // Assuming metrics requires view permission
//   userController.getUserMetrics
// );
// router.get(
//   "/:id",
//   authMiddleware,
//   checkPermission("UserManagement.viewUsers"),
//   userController.getUserById
// );
// router.put(
//   "/:id",
//   authMiddleware,
//   checkPermission("UserManagement.editUsers"),
//   userController.updateUser
// );
// router.delete(
//   "/:id",
//   authMiddleware,
//   checkPermission("UserManagement.deleteUsers"),
//   userController.deleteUser
// );
// // Role management routes
// router.post(
//   "/roles",
//   authMiddleware,
//   checkPermission("UserManagement.manageUserRoles"),
//   userController.createRole
// );
// router.get(
//   "/roles",
//   authMiddleware,
//   checkPermission("UserManagement.manageUserRoles"),
//   userController.getAllRoles
// );
// router.put(
//   "/roles/:id",
//   authMiddleware,
//   checkPermission("UserManagement.manageUserRoles"),
//   userController.updateRole
// );
// router.delete(
//   "/roles/:id",
//   authMiddleware,
//   checkPermission("UserManagement.manageUserRoles"),
//   userController.deleteRole
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // Assumes this is the same as the `protect` middleware
const checkPermission = require("../middleware/checkPermission");
const userController = require("../controllers/userController");

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

// router.put(
//   "/:id",
//   authMiddleware,
//   // checkPermission("UserManagement.editUsers"),
//   userController.updateUser
// );

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

// Role Management Routes
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

module.exports = router;
