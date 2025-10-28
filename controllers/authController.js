const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const validTimezones = require("moment-timezone").tz.names();

// const getAuditLogs = async (req, res) => {
//   // console.log("getAuditLogs: Request received", { user: req.user });

//   try {
//     // Allow all authenticated users to view audit logs
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       // console.log("getAuditLogs: User not found", { userId: req.user.id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { user: null, auditLogs: null },
//       });
//     }

//     const auditLogs = await AuditLog.find()
//       .sort({ createdAt: -1 })
//       .populate("user", "fullName email")
//       .populate("resourceId"); // Populate resourceId if needed

//     console.log("getAuditLogs: Audit logs retrieved", {
//       count: auditLogs.length,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: auditLogs.length
//         ? "Audit logs retrieved successfully"
//         : "No audit logs found",
//       data: {
//         user: null,
//         auditLogs,
//       },
//     });
//   } catch (error) {
//     console.error("getAuditLogs: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during audit log retrieval",
//       data: { user: null, auditLogs: null },
//     });
//   }
// };
const getAuditLogs = async (req, res) => {
  try {
    // Allow all authenticated users to view audit logs
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null, auditLogs: null },
      });
    }

    // Pagination params with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default to 20 logs per page
    const skip = (page - 1) * limit;

    // Optional filters (e.g., date range)
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Fetch paginated audit logs
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email")
      .populate("resourceId"); // Populate resourceId if needed

    console.log("getAuditLogs: Audit logs retrieved", {
      page,
      limit,
      total,
      count: auditLogs.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: auditLogs.length
        ? "Audit logs retrieved successfully"
        : "No audit logs found",
      data: {
        user: null,
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("getAuditLogs: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during audit log retrieval",
      data: { user: null, auditLogs: null },
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  // console.log("login: Request received", { email });

  try {
    // Input validation
    if (!email || !password) {
      // console.log("login: Missing credentials", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email and password are required",
        data: { user: null },
      });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Find user by email and populate role
    const user = await User.findOne({ email: normalizedEmail })
      .select("+password")
      .populate("role");

    // Debug logging to check user and role status
    // console.log("login: User found", {
    //   userId: user?._id,
    //   email: user?.email,
    //   roleId: user?.role?._id || user?.role,
    //   roleName: user?.role?.name,
    //   roleIsNull: user?.role === null,
    //   roleIsUndefined: typeof user?.role === "undefined",
    // });

    if (!user) {
      // console.log("login: User not found", { email: normalizedEmail });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User with this email does not exist",
        data: { user: null },
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // console.log("login: Password mismatch", { email: normalizedEmail });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Incorrect password",
        data: { user: null },
      });
    }

    // Generate JWT token - handle null role gracefully
    const roleForToken = user.role ? user.role._id : null;
    const token = jwt.sign(
      { id: user._id, role: roleForToken },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "90d",
      }
    );

    // Set JWT cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000,
    });

    // Prepare user response object with role information
    const responseUser = {
      _id: user._id,
      fullName: user.fullName || "",
      Department: user.Department || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      status: user.status || "Active",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      profilePicture: user.profilePicture || "",
      organization: user.organization || null,
      jobTitle: user.jobTitle || "",
      location: user.location || "",
      timezone: user.timezone || "",
      language: user.language || "",
      dateFormat: user.dateFormat || "",
      createdAt: user.createdAt,
    };

    // Handle role in response - provide more detailed information
    if (user.role) {
      // Role is populated - include full role object
      responseUser.role = {
        _id: user.role._id,
        name: user.role.name,
        description: user.role.description,
        permissions: user.role.permissions,
        createdAt: user.role.createdAt,
      };
    } else {
      // Role is null or not found - provide debugging info
      console.warn("login: User has no role assigned", {
        userId: user._id,
        email: user.email,
        roleFieldValue: user.role,
      });

      responseUser.role = null;
      // Optionally add a warning message (remove in production)
      responseUser.roleWarning =
        "User has no role assigned. Please assign a role to enable permissions.";
    }

    // console.log("login: Success", {
    //   userId: user._id,
    //   roleName: user.role?.name || "No Role",
    //   hasPermissions: !!user.role,
    // });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User logged in successfully",
      data: {
        token, // Keep token only in login response
        user: responseUser,
      },
    });
  } catch (error) {
    console.error("login: Error", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during login",
      data: { user: null },
    });
  }
};
const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "No token provided",
        data: { user: null },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: Add .populate('role') to fetch full role object
    const user = await User.findById(decoded.id).populate("role").lean();
    if (!user) {
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
      });
    }

    if (
      !user.organization &&
      user.role?.name !== "admin" &&
      user.role?.name !== "superAdmin"
    ) {
      // Use populated name
      console.log("auth/me: User missing organization", { userId: user._id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User has no organization assigned. Please contact support.",
        data: { user: null },
      });
    }

    console.log("auth/me: User fetched", {
      userId: user._id,
      organization: user.organization,
      roleName: user.role?.name, // Debug: Log populated name
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User details retrieved successfully",
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName || "",
          Department: user.Department || "",
          email: user.email,
          role: user.role, // Now populated object { _id, name, ... }
          phoneNumber: user.phoneNumber || "",
          status: user.status || "Active",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profilePicture: user.profilePicture || "",
          organization: user.organization || null,
          jobTitle: user.jobTitle || "",
          location: user.location || "",
          timezone: user.timezone || "",
          language: user.language || "",
          dateFormat: user.dateFormat || "",
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
      data: { user: null },
    });
  }
};

// const getMe = async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       // console.log("auth/me: No token provided");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "No token provided",
//         data: { user: null },
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // console.log("auth/me: Token decoded", { userId: decoded.id });

//     const user = await User.findById(decoded.id).lean();
//     if (!user) {
//       // console.log("auth/me: User not found", { userId: decoded.id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { user: null },
//       });
//     }

//     if (!user.organization && user.role !== "admin") {
//       console.log("auth/me: User missing organization", { userId: user._id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "User has no organization assigned. Please contact support.",
//         data: { user: null },
//       });
//     }

//     console.log("auth/me: User fetched", {
//       userId: user._id,
//       organization: user.organization,
//     });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User details retrieved successfully",
//       data: {
//         user: {
//           _id: user._id,
//           fullName: user.fullName || "", // Include if exists, default to empty string
//           Department: user.Department || "", // Include if exists
//           email: user.email,
//           role: user.role, // Populated role object
//           phoneNumber: user.phoneNumber || "", // Include if exists
//           status: user.status || "Active",
//           firstName: user.firstName || "",
//           lastName: user.lastName || "",
//           profilePicture: user.profilePicture || "",
//           organization: user.organization || null,
//           jobTitle: user.jobTitle || "",
//           location: user.location || "",
//           timezone: user.timezone || "",
//           language: user.language || "",
//           dateFormat: user.dateFormat || "",
//           createdAt: user.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("auth/me: Error", { message: error.message });
//     return res.status(401).json({
//       status: "error",
//       statusCode: 401,
//       message: "Invalid or expired token",
//       data: { user: null },
//     });
//   }
// };

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
        data: { user: null },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("requestResetPassword: User not found", { email });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
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
    const transporter = nodemailer.createTransporter({
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
      data: { user: null },
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
      data: { user: null },
    });
  } catch (error) {
    console.error("logout: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during logout",
      data: { user: null },
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
        data: { user: null },
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
        data: { user: null },
      });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("resetPassword: Weak password", { userId: user._id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
        data: { user: null },
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
      data: { user: null },
    });
  }
};

// Change password (accessible to all authenticated users)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  console.log("changePassword: Request received", { userId: req.user?.id });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("changePassword: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Input validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      console.log("changePassword: Missing required fields", {
        userId: req.user.id,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "Current password, new password, and confirm new password are required",
      });
    }

    // Verify newPassword matches confirmNewPassword
    if (newPassword !== confirmNewPassword) {
      console.log("changePassword: Passwords do not match", {
        userId: req.user.id,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "New password and confirm new password do not match",
      });
    }

    // Find user and select password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      console.log("changePassword: User not found", { userId: req.user.id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log("changePassword: Incorrect current password", {
        userId: req.user.id,
      });
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Incorrect current password",
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("changePassword: Weak password", { userId: req.user.id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Update password
    user.password = newPassword; // Will be hashed by User model's pre-save hook
    user.resetPasswordToken = undefined; // Clear any existing reset tokens
    user.resetPasswordExpires = undefined;
    await user.save();

    // Clear JWT cookie to force re-authentication
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    console.log("changePassword: Password changed successfully", {
      userId: user._id,
    });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("changePassword: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during password change",
      data: { user: null },
    });
  }
};

// Admin reset password (accessible to superadmin only)
const adminResetPassword = async (req, res) => {
  const { emailAddress, newPassword } = req.body;
  console.log("adminResetPassword: Request received", { emailAddress });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("adminResetPassword: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Check if requester is superadmin
    const admin = await User.findById(req.user.id).populate("role");
    if (!admin || admin.role.name.toLowerCase() !== "superadmin") {
      console.log("adminResetPassword: Not authorized", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Only superadmin can reset user passwords",
        data: { user: null },
      });
    }

    // Input validation
    if (!emailAddress || !newPassword) {
      console.log("adminResetPassword: Missing required fields");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email address and new password are required",
        data: { user: null },
      });
    }

    // Find user by email
    const normalizedEmail = emailAddress.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("adminResetPassword: User not found", {
        email: normalizedEmail,
      });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("adminResetPassword: Weak password", { userId: user._id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
        data: { user: null },
      });
    }

    // Update password and clear reset fields
    user.password = newPassword; // Will be hashed by User model's pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.id,
      action: "ADMIN_RESET_PASSWORD",
      resource: "User",
      resourceId: user._id,
      details: {
        email: user.email,
        resetBy: req.user.id,
      },
      timestamp: new Date(),
    });

    console.log("adminResetPassword: Password reset successful", {
      userId: user._id,
      adminId: req.user.id,
    });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User password reset successfully by admin",
      data: {
        user: {
          id: user._id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("adminResetPassword: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during admin password reset",
      data: { user: null },
    });
  }
};
module.exports = {
  getAuditLogs,
  login,
  logout,
  requestResetPassword,
  resetPassword,
  getMe,
  // updateUser,
  changePassword,
  adminResetPassword,
};
