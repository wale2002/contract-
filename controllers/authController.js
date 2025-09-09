const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("login: Request received", { email });

  try {
    // Input validation
    if (!email || !password) {
      console.log("login: Missing credentials", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email and password are required",
        data: { user: null, token: null },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("login: User not found", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid credentials",
        data: { user: null, token: null },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("login: Password mismatch", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid credentials",
        data: { user: null, token: null },
      });
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
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User logged in successfully",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          organization: user.organization || null,
        },
      },
    });
  } catch (error) {
    console.error("login: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during login",
      data: { user: null, token: null },
    });
  }
};

const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("auth/me: No token provided");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "No token provided",
        data: { user: null, token: null },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("auth/me: Token decoded", { userId: decoded.id });

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      console.log("auth/me: User not found", { userId: decoded.id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null, token: null },
      });
    }

    if (!user.organization && user.role !== "admin") {
      console.log("auth/me: User missing organization", { userId: user._id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User has no organization assigned. Please contact support.",
        data: { user: null, token: null },
      });
    }

    console.log("auth/me: User fetched", {
      userId: user._id,
      organization: user.organization,
    });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User details retrieved successfully",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email || null,
          role: user.role,
          organization: user.organization || null,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("auth/me: Error", { message: error.message });
    return res.status(401).json({
      status: "error",
      statusCode: 401,
      message: "Invalid or expired token",
      data: { user: null, token: null },
    });
  }
};

const requestResetPassword = async (req, res) => {
  const { email } = req.body;
  console.log("requestResetPassword: Request received", { email });

  try {
    // Input validation
    if (!email) {
      console.log("requestResetPassword: Missing email");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email is required",
        data: { user: null, token: null },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("requestResetPassword: User not found", { email });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null, token: null },
      });
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

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password reset token generated successfully",
      data: {
        token: resetToken,
        user: {
          id: user._id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("requestResetPassword: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during password reset request",
      data: { user: null, token: null },
    });
  }
};

const logout = async (req, res) => {
  console.log("logout: Request received", { userId: req.user?.id });

  try {
    // Clear JWT cookie
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
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User logged out successfully",
      data: { user: null, token: null },
    });
  } catch (error) {
    console.error("logout: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during logout",
      data: { user: null, token: null },
    });
  }
};

const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  console.log("resetPassword: Request received", {
    resetToken: resetToken?.substring(0, 10) + "...",
  });

  try {
    // Input validation
    if (!resetToken || !newPassword) {
      console.log("resetPassword: Missing resetToken or newPassword");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Reset token and new password are required",
        data: { user: null, token: null },
      });
    }

    // Find user with valid token and non-expired
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      console.log("resetPassword: Invalid or expired token", {
        resetToken: resetToken?.substring(0, 10) + "...",
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid or expired reset token",
        data: { user: null, token: null },
      });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("resetPassword: Weak password", { userId: user._id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number",
        data: { user: null, token: null },
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
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password reset successfully",
      data: {
        token: null,
        user: {
          id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    console.error("resetPassword: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during password reset",
      data: { user: null, token: null },
    });
  }
};

module.exports = { login, logout, requestResetPassword, resetPassword, getMe };
