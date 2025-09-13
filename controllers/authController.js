const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const validTimezones = require("moment-timezone").tz.names();

const getAuditLogs = async (req, res) => {
  console.log("getAuditLogs: Request received", { user: req.user });

  try {
    // Allow all authenticated users to view audit logs
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("getAuditLogs: User not found", { userId: req.user.id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { token: null, user: null, auditLogs: null },
      });
    }

    const auditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .populate("user", "fullName email")
      .populate("resourceId"); // Populate resourceId if needed

    console.log("getAuditLogs: Audit logs retrieved", {
      count: auditLogs.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: auditLogs.length
        ? "Audit logs retrieved successfully"
        : "No audit logs found",
      data: {
        token: null,
        user: null,
        auditLogs,
      },
    });
  } catch (error) {
    console.error("getAuditLogs: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during audit log retrieval",
      data: { token: null, user: null, auditLogs: null },
    });
  }
};
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

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Find user by email and populate role
    const user = await User.findOne({ email: normalizedEmail })
      .select("+password")
      .populate("role");
    if (!user) {
      console.log("login: User not found", { email: normalizedEmail });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User with this email does not exist",
        data: { user: null, token: null },
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("login: Password mismatch", { email: normalizedEmail });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Incorrect password",
        data: { user: null, token: null },
      });
    }

    // Generate JWT token
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
      maxAge: (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000,
    });

    console.log("login: Success", { userId: user._id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User logged in successfully",
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName || "", // Include if exists, default to empty string
          Department: user.Department || "", // Include if exists
          email: user.email,
          role: user.role, // Populated role object
          phoneNumber: user.phoneNumber || "", // Include if exists
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
    console.error("login: Error", {
      message: error.message,
      stack: error.stack,
    });
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
          _id: user._id,
          fullName: user.fullName || "", // Include if exists, default to empty string
          Department: user.Department || "", // Include if exists
          email: user.email,
          role: user.role, // Populated role object
          phoneNumber: user.phoneNumber || "", // Include if exists
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
        data: { token: null, user: null },
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
        data: { token: null, user: null },
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
        data: { token: null, user: null },
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
        data: { token: null, user: null },
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
        data: { token: null, user: null },
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("changePassword: Weak password", { userId: req.user.id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "New password must be at least 8 characters long and contain at least one letter and one number",
        data: { token: null, user: null },
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
      data: { token: null, user: null },
    });
  } catch (error) {
    console.error("changePassword: Error", { message: error.message });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during password change",
      data: { token: null, user: null },
    });
  }
};

// Update own user profile (accessible to all authenticated users)
// Assuming User model is imported

const updateUser = async (req, res) => {
  const userIdParam = req.params.userId; // From route, e.g., /users/:userId or /profile
  let targetUserId = userIdParam;

  const {
    fullName,
    firstName,
    lastName,
    Department,
    email,
    phoneNumber,
    profilePicture,
    jobTitle,
    location,
    timezone,
    language,
    dateFormat,
    organization,
    role,
    status,
  } = req.body;

  console.log("updateUser: Request received", {
    userId: userIdParam,
    requestedUpdates: {
      fullName,
      firstName,
      lastName,
      Department,
      email,
      phoneNumber,
      profilePicture,
      jobTitle,
      location,
      timezone,
      language,
      dateFormat,
      organization,
      role,
      status,
    },
    requesterId: req.user?.id,
  });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("updateUser: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { token: null, user: null },
      });
    }

    // Handle self-update for /profile
    if (userIdParam === "profile") {
      targetUserId = req.user.id;
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      console.log("updateUser: Invalid user ID", { id: targetUserId });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid user ID",
        data: { token: null, user: null },
      });
    }

    // Find target user
    const user = await User.findById(targetUserId);
    if (!user) {
      console.log("updateUser: User not found", { id: targetUserId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { token: null, user: null },
      });
    }

    // Permission check
    const isSelfUpdate = targetUserId === req.user.id;
    const hasUpdatePermission =
      req.user.role?.permissions?.UserManagement?.editUsers || false;

    if (!isSelfUpdate && !hasUpdatePermission) {
      console.log("updateUser: Insufficient permissions", {
        id: targetUserId,
        requesterId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Insufficient permissions to update this user",
        data: { token: null, user: null },
      });
    }

    // Restrict role/status for self-update
    if (isSelfUpdate && (role !== undefined || status !== undefined)) {
      console.log("updateUser: Cannot update role or status in self-update", {
        id: targetUserId,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Cannot update role or status in profile update",
        data: { token: null, user: null },
      });
    }

    // Validate at least one field is provided
    const updates = {
      fullName,
      firstName,
      lastName,
      Department,
      email,
      phoneNumber,
      profilePicture,
      jobTitle,
      location,
      timezone,
      language,
      dateFormat,
      organization,
      role,
      status,
    };
    const hasValidField = Object.values(updates).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
    if (!hasValidField) {
      console.log("updateUser: No valid fields provided", { id: targetUserId });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "At least one valid field must be provided for update",
        data: { token: null, user: null },
      });
    }

    // Track changes for audit logging
    const changes = {};

    // Update fields with validation
    if (fullName?.trim()) {
      changes.fullName = { old: user.fullName, new: fullName.trim() };
      user.fullName = fullName.trim();
    }
    if (firstName?.trim()) {
      changes.firstName = { old: user.firstName, new: firstName.trim() };
      user.firstName = firstName.trim();
    }
    if (lastName?.trim()) {
      changes.lastName = { old: user.lastName, new: lastName.trim() };
      user.lastName = lastName.trim();
    }
    if (Department?.trim()) {
      changes.Department = { old: user.Department, new: Department.trim() };
      user.Department = Department.trim();
    }
    if (phoneNumber?.trim()) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        console.log("updateUser: Invalid phone number", { phoneNumber });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid phone number format",
          data: { token: null, user: null },
        });
      }
      changes.phoneNumber = { old: user.phoneNumber, new: phoneNumber.trim() };
      user.phoneNumber = phoneNumber.trim();
    }
    if (profilePicture?.trim()) {
      // Basic URL validation for profile picture
      const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
      if (!urlRegex.test(profilePicture.trim())) {
        console.log("updateUser: Invalid profile picture URL", {
          profilePicture,
        });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid profile picture URL",
          data: { token: null, user: null },
        });
      }
      changes.profilePicture = {
        old: user.profilePicture,
        new: profilePicture.trim(),
      };
      user.profilePicture = profilePicture.trim();
    }
    if (jobTitle?.trim()) {
      changes.jobTitle = { old: user.jobTitle, new: jobTitle.trim() };
      user.jobTitle = jobTitle.trim();
    }
    if (location?.trim()) {
      changes.location = { old: user.location, new: location.trim() };
      user.location = location.trim();
    }
    if (timezone?.trim()) {
      if (!validTimezones.includes(timezone.trim())) {
        console.log("updateUser: Invalid timezone", { timezone });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid timezone",
          data: { token: null, user: null },
        });
      }
      changes.timezone = { old: user.timezone, new: timezone.trim() };
      user.timezone = timezone.trim();
    }
    if (language?.trim()) {
      const validLanguages = ["en", "es", "fr", "de", "it"];
      if (!validLanguages.includes(language.trim())) {
        console.log("updateUser: Invalid language", { language });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid language code",
          data: { token: null, user: null },
        });
      }
      changes.language = { old: user.language, new: language.trim() };
      user.language = language.trim();
    }
    if (dateFormat?.trim()) {
      const validDateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
      if (!validDateFormats.includes(dateFormat.trim())) {
        console.log("updateUser: Invalid date format", { dateFormat });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid date format",
          data: { token: null, user: null },
        });
      }
      changes.dateFormat = { old: user.dateFormat, new: dateFormat.trim() };
      user.dateFormat = dateFormat.trim();
    }
    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        console.log("updateUser: Invalid email format", { email });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid email format",
          data: { token: null, user: null },
        });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          console.log("updateUser: Email already exists", { email });
          return res.status(400).json({
            status: "error",
            statusCode: 400,
            message: "Email already exists",
            data: { token: null, user: null },
          });
        }
        changes.email = { old: user.email, new: normalizedEmail };
        user.email = normalizedEmail;
      }
    }
    if (organization && organization !== user.organization?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(organization)) {
        console.log("updateUser: Invalid organization ID", { organization });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid organization ID",
          data: { token: null, user: null },
        });
      }
      changes.organization = { old: user.organization, new: organization };
      user.organization = organization;
    }

    // Admin-only fields
    if (!isSelfUpdate && hasUpdatePermission) {
      if (role && role !== user.role?.toString()) {
        if (!mongoose.Types.ObjectId.isValid(role)) {
          console.log("updateUser: Invalid role ID", { role });
          return res.status(400).json({
            status: "error",
            statusCode: 400,
            message: "Invalid role ID",
            data: { token: null, user: null },
          });
        }
        changes.role = { old: user.role, new: role };
        user.role = role;
      }
      if (status && status !== user.status) {
        if (!["Active", "InActive"].includes(status)) {
          console.log("updateUser: Invalid status", { status });
          return res.status(400).json({
            status: "error",
            statusCode: 400,
            message: "Invalid status",
            data: { token: null, user: null },
          });
        }
        changes.status = { old: user.status, new: status };
        user.status = status;
      }
    }

    // Save user and create audit log if changes were made
    if (Object.keys(changes).length > 0) {
      await user.save();

      // Create audit log
      await AuditLog.create({
        user: req.user.id,
        action: "UPDATE_USER",
        resource: "User",
        resourceId: user._id,
        details: {
          changes,
          updatedBy: req.user.id,
          isSelfUpdate,
        },
        timestamp: new Date(),
      });

      console.log("updateUser: User updated and audit logged", {
        userId: targetUserId,
        changes: Object.keys(changes),
      });
    } else {
      console.log("updateUser: No changes to save", { userId: targetUserId });
    }

    // Fetch updated user with populated role
    const updatedUser = await User.findById(targetUserId)
      .populate("role")
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: Object.keys(changes).length
        ? "User updated successfully"
        : "No changes applied",
      data: { token: null, user: updatedUser },
    });
  } catch (error) {
    console.error("updateUser: Error", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user update",
      data: { token: null, user: null },
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
  updateUser,
  changePassword,
};
