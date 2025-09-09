// const mongoose = require("mongoose"); // Add mongoose import
// const User = require("../models/User");
// const Organization = require("../models/Organization");
// const bcrypt = require("bcryptjs");
// const Email = require("../utils/email");
// const crypto = require("crypto");

// // const createUser = async (req, res) => {
// //   const { username, email, password, role, organization } = req.body;
// //   console.log("createUser: Request received", {
// //     username,
// //     email,
// //     role,
// //     organization,
// //     admin: req.user,
// //   });

// //   try {
// //     // Restrict to admins
// //     if (!req.user || req.user.role !== "admin") {
// //       console.log("createUser: Unauthorized", { userId: req.user?.id });
// //       return res.status(403).json({ message: "Only admins can create users" });
// //     }

// //     // Validate inputs
// //     if (!username?.trim() || !email?.trim() || !password?.trim()) {
// //       console.log("createUser: Missing or empty required fields", {
// //         username,
// //         email,
// //         password,
// //       });
// //       return res
// //         .status(400)
// //         .json({ message: "Username, email, and password are required" });
// //     }

// //     // Validate email format
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     if (!emailRegex.test(email)) {
// //       console.log("createUser: Invalid email format", { email });
// //       return res.status(400).json({ message: "Invalid email format" });
// //     }

// //     // Validate password strength
// //     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
// //     if (!passwordRegex.test(password)) {
// //       console.log("createUser: Weak password", { username });
// //       return res.status(400).json({
// //         message:
// //           "Password must be at least 8 characters long and contain at least one letter and one number",
// //       });
// //     }

// //     // Validate email domain
// //     const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
// //       ? process.env.ALLOWED_EMAIL_DOMAINS.split(",")
// //       : [];
// //     if (!allowedDomains.length) {
// //       console.log("createUser: No allowed email domains configured");
// //       return res
// //         .status(500)
// //         .json({ message: "Email domain validation not configured" });
// //     }
// //     const emailDomain = email.split("@")[1];
// //     if (!allowedDomains.includes(`@${emailDomain}`)) {
// //       console.log("createUser: Invalid email domain", {
// //         email,
// //         allowedDomains,
// //       });
// //       return res.status(400).json({
// //         message: `Email domain must be one of: ${allowedDomains.join(", ")}`,
// //       });
// //     }

// //     // Validate organization
// //     if (!organization) {
// //       console.log("createUser: Organization not provided");
// //       return res.status(400).json({ message: "Organization is required" });
// //     }

// //     // Resolve organization by name or ID
// //     let orgId;
// //     if (mongoose.Types.ObjectId.isValid(organization)) {
// //       orgId = organization;
// //       const orgExists = await Organization.findById(orgId);
// //       if (!orgExists) {
// //         console.log("createUser: Organization not found", { orgId });
// //         return res.status(404).json({ message: "Organization not found" });
// //       }
// //     } else {
// //       const org = await Organization.findOne({
// //         name: { $regex: `^${organization}$`, $options: "i" },
// //       });
// //       if (!org) {
// //         console.log("createUser: Organization not found", { organization });
// //         return res.status(404).json({ message: "Organization not found" });
// //       }
// //       orgId = org._id;
// //     }

// //     // Validate role
// //     const validRoles = ["admin", "user"];
// //     if (role && !validRoles.includes(role)) {
// //       console.log("createUser: Invalid role", { role });
// //       return res
// //         .status(400)
// //         .json({ message: `Role must be one of: ${validRoles.join(", ")}` });
// //     }

// //     // Check for existing user
// //     const existingUser = await User.findOne({ $or: [{ username }, { email }] });
// //     if (existingUser) {
// //       console.log("createUser: User already exists", { username, email });
// //       return res
// //         .status(400)
// //         .json({ message: "Username or email already exists" });
// //     }

// //     const user = new User({
// //       username,
// //       email,
// //       password,
// //       role: role || "user",
// //       organization: orgId,
// //     });

// //     await user.save();
// //     console.log("createUser: User created", {
// //       userId: user._id,
// //       username,
// //       email,
// //     });

// //     res.status(201).json({
// //       message: "User created successfully",
// //       data: {
// //         _id: user._id,
// //         username,
// //         email,
// //         role: user.role,
// //         organization: orgId,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("createUser: Error", error);
// //     const isProduction = process.env.NODE_ENV === "production";
// //     res.status(500).json({
// //       message: "Server error",
// //       error: isProduction ? undefined : error.message,
// //     });
// //   }
// // };
// const createUser = async (req, res) => {
//   const { username, email, password, role, organization, firstName } = req.body;
//   console.log("createUser: Request received", {
//     username,
//     email,
//     role,
//     organization,
//     admin: req.user,
//   });

//   try {
//     // Restrict to admins
//     if (!req.user || req.user.role !== "admin") {
//       console.log("createUser: Unauthorized", { userId: req.user?.id });
//       return res.status(403).json({ message: "Only admins can create users" });
//     }

//     // Validate inputs
//     if (
//       !username?.trim() ||
//       !email?.trim() ||
//       !password?.trim() ||
//       !firstName?.trim()
//     ) {
//       console.log("createUser: Missing or empty required fields", {
//         username,
//         email,
//         password,
//         firstName,
//       });
//       return res.status(400).json({
//         message: "Username, email, password, and first name are required",
//       });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       console.log("createUser: Invalid email format", { email });
//       return res.status(400).json({ message: "Invalid email format" });
//     }

//     // Validate password strength
//     const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
//     if (!passwordRegex.test(password)) {
//       console.log("createUser: Weak password", { username });
//       return res.status(400).json({
//         message:
//           "Password must be at least 8 characters long and contain at least one letter and one number",
//       });
//     }

//     // Validate email domain
//     const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
//       ? process.env.ALLOWED_EMAIL_DOMAINS.split(",")
//       : [];
//     if (!allowedDomains.length) {
//       console.log("createUser: No allowed email domains configured");
//       return res
//         .status(500)
//         .json({ message: "Email domain validation not configured" });
//     }
//     const emailDomain = email.split("@")[1];
//     if (!allowedDomains.includes(`@${emailDomain}`)) {
//       console.log("createUser: Invalid email domain", {
//         email,
//         allowedDomains,
//       });
//       return res.status(400).json({
//         message: `Email domain must be one of: ${allowedDomains.join(", ")}`,
//       });
//     }

//     // Validate organization
//     if (!organization) {
//       console.log("createUser: Organization not provided");
//       return res.status(400).json({ message: "Organization is required" });
//     }

//     // Resolve organization by name or ID
//     let orgId;
//     if (mongoose.Types.ObjectId.isValid(organization)) {
//       orgId = organization;
//       const orgExists = await Organization.findById(orgId);
//       if (!orgExists) {
//         console.log("createUser: Organization not found", { orgId });
//         return res.status(404).json({ message: "Organization not found" });
//       }
//     } else {
//       const org = await Organization.findOne({
//         name: { $regex: `^${organization}$`, $options: "i" },
//       });
//       if (!org) {
//         console.log("createUser: Organization not found", { organization });
//         return res.status(404).json({ message: "Organization not found" });
//       }
//       orgId = org._id;
//     }

//     // Validate role
//     const validRoles = ["admin", "user"];
//     if (role && !validRoles.includes(role)) {
//       console.log("createUser: Invalid role", { role });
//       return res
//         .status(400)
//         .json({ message: `Role must be one of: ${validRoles.join(", ")}` });
//     }

//     // Check for existing user
//     const existingUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existingUser) {
//       console.log("createUser: User already exists", { username, email });
//       return res
//         .status(400)
//         .json({ message: "Username or email already exists" });
//     }

//     // Generate setup token for password reset link
//     const setupToken = crypto.randomBytes(20).toString("hex");
//     const setupTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

//     // Create user
//     const user = new User({
//       username,
//       email,
//       password, // Will be hashed by pre-save hook
//       firstName,
//       role: role || "user",
//       organization: orgId,
//       resetPasswordToken: setupToken,
//       resetPasswordExpires: setupTokenExpires,
//     });

//     await user.save();
//     console.log("createUser: User created", {
//       userId: user._id,
//       username,
//       email,
//     });

//     // Send welcome email with login details and setup link
//     const loginUrl = "https://your-app-url.com/login"; // Adjust URL
//     const setupUrl = `https://your-app-url.com/setup-account/${setupToken}`;
//     try {
//       await new Email(user, setupUrl, password).sendWelcome();
//       console.log("createUser: Welcome email sent", { email });
//     } catch (emailError) {
//       console.error("createUser: Failed to send welcome email", emailError);
//       // Note: User is still created; log error but don't fail the request
//     }

//     res.status(201).json({
//       message: "User created successfully",
//       data: {
//         _id: user._id,
//         username,
//         email,
//         role: user.role,
//         organization: orgId,
//       },
//     });
//   } catch (error) {
//     console.error("createUser: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

// // Get all users
// const getAllUsers = async (req, res) => {
//   console.log("getAllUsers: Request received", { user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("getAllUsers: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     // Restrict to admins
//     if (req.user.role !== "admin") {
//       console.log("getAllUsers: Unauthorized", { userId: req.user.id });
//       return res
//         .status(403)
//         .json({ message: "Only admins can view all users" });
//     }

//     const users = await User.find().select(
//       "-password -resetPasswordToken -resetPasswordExpires"
//     );

//     console.log("getAllUsers: Users retrieved", { count: users.length });

//     res.status(200).json({
//       message: "Users retrieved successfully",
//       data: users,
//     });
//   } catch (error) {
//     console.error("getAllUsers: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

// // Get user by ID
// const getUserById = async (req, res) => {
//   const { id } = req.params;
//   console.log("getUserById: Request received", { userId: id, user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("getUserById: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("getUserById: Invalid user ID", { id });
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     // Restrict to admins or the user themselves
//     if (req.user.role !== "admin" && req.user.id !== id) {
//       console.log("getUserById: Unauthorized", {
//         userId: req.user.id,
//         requestedId: id,
//       });
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to view this user" });
//     }

//     const user = await User.findById(id).select(
//       "-password -resetPasswordToken -resetPasswordExpires"
//     );

//     if (!user) {
//       console.log("getUserById: User not found", { id });
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log("getUserById: User retrieved", { userId: id });

//     res.status(200).json({
//       message: "User retrieved successfully",
//       data: user,
//     });
//   } catch (error) {
//     console.error("getUserById: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

// const updateUser = async (req, res) => {
//   const { id } = req.params;
//   const { username, email, password, role } = req.body;
//   console.log("updateUser: Request received", {
//     userId: id,
//     username,
//     email,
//     role,
//     user: req.user,
//   });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("updateUser: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("updateUser: Invalid user ID", { id });
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     // Restrict to admins or the user themselves
//     if (req.user.role !== "admin" && req.user.id !== id) {
//       console.log("updateUser: Unauthorized", {
//         userId: req.user.id,
//         requestedId: id,
//       });
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to update this user" });
//     }

//     // Find user
//     const user = await User.findById(id);
//     if (!user) {
//       console.log("updateUser: User not found", { id });
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Validate at least one field is provided
//     if (!username?.trim() && !email?.trim() && !password?.trim() && !role) {
//       console.log("updateUser: No fields provided", { id });
//       return res
//         .status(400)
//         .json({ message: "At least one field must be provided for update" });
//     }

//     // Update fields
//     if (username?.trim()) {
//       if (username !== user.username) {
//         const existingUser = await User.findOne({ username });
//         if (existingUser && existingUser._id.toString() !== id) {
//           console.log("updateUser: Username already exists", { username });
//           return res.status(400).json({ message: "Username already exists" });
//         }
//         user.username = username.trim();
//       }
//     }

//     if (email?.trim()) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(email)) {
//         console.log("updateUser: Invalid email format", { email });
//         return res.status(400).json({ message: "Invalid email format" });
//       }
//       if (email !== user.email) {
//         const existingUser = await User.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== id) {
//           console.log("updateUser: Email already exists", { email });
//           return res.status(400).json({ message: "Email already exists" });
//         }
//         user.email = email.trim();
//       }
//     }

//     if (password?.trim()) {
//       const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
//       if (!passwordRegex.test(password)) {
//         console.log("updateUser: Weak password", { id });
//         return res.status(400).json({
//           message:
//             "Password must be at least 8 characters long and contain at least one letter and one number",
//         });
//       }
//       user.password = await bcrypt.hash(password.trim(), 10);
//     }

//     if (role) {
//       const validRoles = ["admin", "user"];
//       if (!validRoles.includes(role)) {
//         console.log("updateUser: Invalid role", { role });
//         return res
//           .status(400)
//           .json({ message: `Role must be one of: ${validRoles.join(", ")}` });
//       }
//       // Only admins can change roles
//       if (req.user.role !== "admin") {
//         console.log("updateUser: Unauthorized to change role", {
//           userId: req.user.id,
//         });
//         return res
//           .status(403)
//           .json({ message: "Only admins can change roles" });
//       }
//       user.role = role;
//     }

//     await user.save();
//     console.log("updateUser: User updated", { userId: id });

//     const updatedUser = await User.findById(id).select(
//       "-password -resetPasswordToken -resetPasswordExpires"
//     );

//     res.status(200).json({
//       message: "User updated successfully",
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error("updateUser: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

// const deleteUser = async (req, res) => {
//   const { id } = req.params;
//   console.log("deleteUser: Request received", { userId: id, user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("deleteUser: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("deleteUser: Invalid user ID", { id });
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     // Restrict to admins
//     if (req.user.role !== "admin") {
//       console.log("deleteUser: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({ message: "Only admins can delete users" });
//     }

//     // Prevent deleting self
//     if (req.user.id === id) {
//       console.log("deleteUser: Cannot delete self", { userId: id });
//       return res
//         .status(400)
//         .json({ message: "Cannot delete your own account" });
//     }

//     const user = await User.findByIdAndDelete(id);
//     if (!user) {
//       console.log("deleteUser: User not found", { id });
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log("deleteUser: User deleted", { userId: id });

//     res.status(200).json({
//       message: "User deleted successfully",
//     });
//   } catch (error) {
//     console.error("deleteUser: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };
// const getUserMetrics = async (req, res) => {
//   console.log("getUserMetrics: Request received", { user: req.user });

//   try {
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("getUserMetrics: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     if (req.user.role !== "admin") {
//       console.log("getUserMetrics: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({ message: "Only admins can view metrics" });
//     }

//     const totalUsers = await User.countDocuments();

//     console.log("getUserMetrics: Metrics retrieved", { totalUsers });

//     res.status(200).json({
//       message: "User metrics retrieved successfully",
//       data: { totalUsers },
//     });
//   } catch (error) {
//     console.error("getUserMetrics: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

// module.exports = {
//   createUser,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
//   getUserMetrics,
// };

const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const bcrypt = require("bcryptjs");
const Email = require("../utils/email");
const crypto = require("crypto");

const createUser = async (req, res) => {
  const { username, email, password, role, organization, firstName } = req.body;
  console.log("createUser: Request received", {
    username,
    email,
    role,
    organization,
    admin: req.user,
  });

  try {
    // Restrict to admins
    if (!req.user || req.user.role !== "admin") {
      console.log("createUser: Unauthorized", { userId: req.user?.id });
      return res.status(403).json({
        success: false,
        message: "Only admins can create users",
      });
    }

    // Validate inputs
    if (
      !username?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !firstName?.trim()
    ) {
      console.log("createUser: Missing or empty required fields", {
        username,
        email,
        password,
        firstName,
      });
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and first name are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("createUser: Invalid email format", { email });
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log("createUser: Weak password", { username });
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number",
      });
    }

    // Validate email domain
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
      ? process.env.ALLOWED_EMAIL_DOMAINS.split(",")
      : [];
    if (!allowedDomains.length) {
      console.log("createUser: No allowed email domains configured");
      return res.status(500).json({
        success: false,
        message: "Email domain validation not configured",
      });
    }
    const emailDomain = email.split("@")[1];
    if (!allowedDomains.includes(`@${emailDomain}`)) {
      console.log("createUser: Invalid email domain", {
        email,
        allowedDomains,
      });
      return res.status(400).json({
        success: false,
        message: `Email domain must be one of: ${allowedDomains.join(", ")}`,
      });
    }

    // Validate organization
    if (!organization) {
      console.log("createUser: Organization not provided");
      return res.status(400).json({
        success: false,
        message: "Organization is required",
      });
    }

    // Resolve organization by name or ID
    let orgId;
    if (mongoose.Types.ObjectId.isValid(organization)) {
      orgId = organization;
      const orgExists = await Organization.findById(orgId);
      if (!orgExists) {
        console.log("createUser: Organization not found", { orgId });
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
    } else {
      const org = await Organization.findOne({
        name: { $regex: `^${organization}$`, $options: "i" },
      });
      if (!org) {
        console.log("createUser: Organization not found", { organization });
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
      orgId = org._id;
    }

    // Validate role
    const validRoles = ["admin", "user"];
    if (role && !validRoles.includes(role)) {
      console.log("createUser: Invalid role", { role });
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log("createUser: User already exists", { username, email });
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Generate setup token for password reset link
    const setupToken = crypto.randomBytes(20).toString("hex");
    const setupTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = new User({
      username,
      email,
      password, // Will be hashed by pre-save hook
      firstName,
      role: role || "user",
      organization: orgId,
      resetPasswordToken: setupToken,
      resetPasswordExpires: setupTokenExpires,
    });

    await user.save();
    console.log("createUser: User created", {
      userId: user._id,
      username,
      email,
    });

    // Send welcome email with login details and setup link
    const loginUrl = "https://your-app-url.com/login";
    const setupUrl = `https://your-app-url.com/setup-account/${setupToken}`;
    try {
      await new Email(user, setupUrl, password).sendWelcome();
      console.log("createUser: Welcome email sent", { email });
    } catch (emailError) {
      console.error("createUser: Failed to send welcome email", emailError);
    }

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User created successfully",
      token: null,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
          organization: user.organization,
        },
      },
    });
  } catch (error) {
    console.error("createUser: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user creation",
      error: isProduction ? undefined : error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  console.log("getAllUsers: Request received", { user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("getAllUsers: Invalid authentication data");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Restrict to admins
    if (req.user.role !== "admin") {
      console.log("getAllUsers: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: "Only admins can view all users",
      });
    }

    const users = await User.find().select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    console.log("getAllUsers: Users retrieved", { count: users.length });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: users.length ? "Users retrieved successfully" : "No users found",
      token: null,
      data: {
        user: null,
        users, // Include users array to maintain compatibility
      },
    });
  } catch (error) {
    console.error("getAllUsers: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user retrieval",
      error: isProduction ? undefined : error.message,
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log("getUserById: Request received", { userId: id, user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("getUserById: Invalid authentication data");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("getUserById: Invalid user ID", { id });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Restrict to admins or the user themselves
    if (req.user.role !== "admin" && req.user.id !== id) {
      console.log("getUserById: Unauthorized", {
        userId: req.user.id,
        requestedId: id,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this user",
      });
    }

    const user = await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      console.log("getUserById: User not found", { id });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("getUserById: User retrieved", { userId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User retrieved successfully",
      token: null,
      data: { user },
    });
  } catch (error) {
    console.error("getUserById: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user retrieval",
      error: isProduction ? undefined : error.message,
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;
  console.log("updateUser: Request received", {
    userId: id,
    username,
    email,
    role,
    user: req.user,
  });

  try {
    // Check authentication
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("updateUser: Invalid authentication data");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("updateUser: Invalid user ID", { id });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Restrict to admins or the user themselves
    if (req.user.role !== "admin" && req.user.id !== id) {
      console.log("updateUser: Unauthorized", {
        userId: req.user.id,
        requestedId: id,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this user",
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.log("updateUser: User not found", { id });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate at least one field is provided
    if (!username?.trim() && !email?.trim() && !password?.trim() && !role) {
      console.log("updateUser: No fields provided", { id });
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    // Update fields
    if (username?.trim()) {
      if (username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== id) {
          console.log("updateUser: Username already exists", { username });
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }
        user.username = username.trim();
      }
    }

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("updateUser: Invalid email format", { email });
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== id) {
          console.log("updateUser: Email already exists", { email });
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
        user.email = email.trim();
      }
    }

    if (password?.trim()) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(password)) {
        console.log("updateUser: Weak password", { id });
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long and contain at least one letter and one number",
        });
      }
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    if (role) {
      const validRoles = ["admin", "user"];
      if (!validRoles.includes(role)) {
        console.log("updateUser: Invalid role", { role });
        return res.status(400).json({
          success: false,
          message: `Role must be one of: ${validRoles.join(", ")}`,
        });
      }
      // Only admins can change roles
      if (req.user.role !== "admin") {
        console.log("updateUser: Unauthorized to change role", {
          userId: req.user.id,
        });
        return res.status(403).json({
          success: false,
          message: "Only admins can change roles",
        });
      }
      user.role = role;
    }

    await user.save();
    console.log("updateUser: User updated", { userId: id });

    const updatedUser = await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User updated successfully",
      token: null,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("updateUser: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user update",
      error: isProduction ? undefined : error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log("deleteUser: Request received", { userId: id, user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("deleteUser: Invalid authentication data");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("deleteUser: Invalid user ID", { id });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Restrict to admins
    if (req.user.role !== "admin") {
      console.log("deleteUser: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: "Only admins can delete users",
      });
    }

    // Prevent deleting self
    if (req.user.id === id) {
      console.log("deleteUser: Cannot delete self", { userId: id });
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      console.log("deleteUser: User not found", { id });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("deleteUser: User deleted", { userId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User deleted successfully",
      token: null,
      data: { user: null },
    });
  } catch (error) {
    console.error("deleteUser: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user deletion",
      error: isProduction ? undefined : error.message,
    });
  }
};

const getUserMetrics = async (req, res) => {
  console.log("getUserMetrics: Request received", { user: req.user });

  try {
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("getUserMetrics: Invalid authentication data");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      console.log("getUserMetrics: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: "Only admins can view metrics",
      });
    }

    const totalUsers = await User.countDocuments();

    console.log("getUserMetrics: Metrics retrieved", { totalUsers });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User metrics retrieved successfully",
      token: null,
      data: {
        user: null,
        metrics: { totalUsers },
      },
    });
  } catch (error) {
    console.error("getUserMetrics: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(500).json({
      success: false,
      message: "Server error during user metrics retrieval",
      error: isProduction ? undefined : error.message,
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserMetrics,
};
