const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Added for reset token generation
const User = require("../models/User");

const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("login: Request received", { username });

  try {
    // Input validation
    if (!username || !password) {
      console.log("login: Missing credentials", { username });
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log("login: User not found", { username });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("login: Password mismatch", { username });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "90d",
      }
    );

    // Set JWT cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000, // Days to ms
    });

    console.log("login: Success", { userId: user._id });
    res.json({
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          organization: user.organization,
        },
      },
    });
  } catch (error) {
    console.error("login: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getMe = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("auth/me: No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("auth/me: Token decoded", { userId: decoded.id });

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      console.log("auth/me: User not found", { userId: decoded.id });
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.organization && user.role !== "admin") {
      console.log("auth/me: User missing organization", { userId: user._id });
      return res.status(400).json({
        message: "User has no organization assigned. Please contact support.",
      });
    }

    console.log("auth/me: User fetched", {
      userId: user._id,
      organization: user.organization,
    });
    res.status(200).json({
      message: "User fetched successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: user.organization || null, // Allow null for admins
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("auth/me: Error", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
const requestResetPassword = async (req, res) => {
  const { email } = req.body;
  console.log("requestResetPassword: Request received", { email });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("requestResetPassword: User not found", { email });
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    console.log("requestResetPassword: Reset token generated", {
      userId: user._id,
      email,
    });

    // TODO: Integrate Nodemailer to send reset token via email
    /*
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Use this token to reset your password: ${resetToken}\n\nThis link expires in 1 hour.`,
    };
    await transporter.sendMail(mailOptions);
    console.log("requestResetPassword: Email sent", { email });
    */

    res.json({
      message: "Password reset token generated",
      data: { resetToken },
    });
  } catch (error) {
    console.error("requestResetPassword: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const logout = async (req, res) => {
  console.log("logout: Request received", { userId: req.user?.id });

  try {
    // Instruct client to clear token (e.g., from local storage)
    // If using cookies, clear the JWT cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Optional: Server-side token blacklist (requires TokenBlacklist model)
    /*
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      await TokenBlacklist.create({
        token,
        expiresAt: jwt.decode(token).exp * 1000, // Convert to milliseconds
      });
      console.log("logout: Token blacklisted", { userId: req.user.id });
    }
    */

    console.log("logout: Success", { userId: req.user?.id });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  console.log("resetPassword: Request received", {
    resetToken: resetToken?.substring(0, 10) + "...",
  });

  try {
    // Find user with valid token and non-expired
    const user = await User.findOne({
      resetPasswordToken: resetToken, // Use resetToken here
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      console.log("resetPassword: Invalid or expired token", {
        resetToken: resetToken?.substring(0, 10) + "...",
      });
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("resetPassword: Weak password", { userId: user._id });
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number",
      });
    }

    // Update password and clear reset fields
    user.password = newPassword; // Will be hashed by User model's pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("resetPassword: Password reset successful", {
      userId: user._id,
    });
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { login, logout, requestResetPassword, resetPassword, getMe };
