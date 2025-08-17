const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const userController = require("../controllers/userController");

router.post("/", authMiddleware, userController.createUser);
router.get("/", authMiddleware, userController.getAllUsers);
router.get("/metrics", authMiddleware, userController.getUserMetrics); // Moved before /:id
router.get("/:id", authMiddleware, userController.getUserById);
router.put("/:id", authMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
