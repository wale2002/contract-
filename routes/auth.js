const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/request-reset", authController.requestResetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);

module.exports = router;
