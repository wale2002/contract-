// const mongoose = require("mongoose");
// const User = require("../models/User");
// const Role = require("../models/Role");
// const Email = require("../utils/email");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");

// const createUser = async (req, res) => {
//   const { fullName, Department, email, password, role, phoneNumber, status } =
//     req.body;
//   console.log("createUser: Request received", {
//     fullName,
//     email,
//     role,
//     admin: req.user,
//   });

//   try {
//     // Check authentication (middleware handles UserManagement.createUsers permission)
//     if (!req.user || !req.user.id) {
//       console.log("createUser: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate inputs
//     if (
//       !fullName?.trim() ||
//       !Department?.trim() ||
//       !email?.trim() ||
//       !password?.trim() ||
//       !phoneNumber?.trim()
//     ) {
//       console.log("createUser: Missing or empty required fields", {
//         fullName,
//         Department,
//         email,
//         password,
//         phoneNumber,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message:
//           "Full name, department, email, password, and phone number are required",
//         data: { token: null, user: null },
//       });
//     }

//     // Normalize email to lowercase
//     const normalizedEmail = email.toLowerCase();

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(normalizedEmail)) {
//       console.log("createUser: Invalid email format", { email });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid email format",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate email domain
//     const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
//       ? process.env.ALLOWED_EMAIL_DOMAINS.split(",").map((domain) =>
//           domain.replace(/^@/, "").toLowerCase()
//         )
//       : [];
//     if (!allowedDomains.length) {
//       console.log("createUser: No allowed email domains configured");
//       return res.status(500).json({
//         status: "error",
//         statusCode: 500,
//         message: "Email domain validation not configured",
//         data: { token: null, user: null },
//       });
//     }
//     const emailDomain = normalizedEmail.split("@")[1].toLowerCase();
//     if (!allowedDomains.includes(emailDomain)) {
//       console.log("createUser: Invalid email domain", {
//         email,
//         emailDomain,
//         allowedDomains,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: `Email domain must be one of: ${allowedDomains.join(", ")}`,
//         data: { token: null, user: null },
//       });
//     }

//     // Validate role
//     if (!role) {
//       console.log("createUser: Role not provided");
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Role is required",
//         data: { token: null, user: null },
//       });
//     }

//     const roleDoc = await Role.findById(role);
//     if (!roleDoc) {
//       console.log("createUser: Role not found", { role });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Role not found",
//         data: { token: null, user: null },
//       });
//     }

//     // Prevent non-superAdmins from assigning superAdmin role
//     const requestingUser = await User.findById(req.user.id).populate("role");
//     if (
//       roleDoc.name === "superAdmin" &&
//       requestingUser.role.name !== "superAdmin"
//     ) {
//       console.log("createUser: Unauthorized to assign superAdmin role", {
//         userId: req.user.id,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Only superAdmins can assign superAdmin role",
//         data: { token: null, user: null },
//       });
//     }

//     // Check for existing user
//     const existingUser = await User.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       console.log("createUser: User already exists", { email });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Email already exists",
//         data: { token: null, user: null },
//       });
//     }

//     // Create user with plain password (pre-save hook will hash it)
//     const user = new User({
//       fullName,
//       Department,
//       email: normalizedEmail,
//       password,
//       role: roleDoc._id,
//       phoneNumber,
//       status: status || "Active",
//       firstName: fullName.split(" ")[0],
//     });

//     // Save user and verify it was saved
//     await user.save();
//     const savedUser = await User.findOne({ email: normalizedEmail }).select(
//       "+password"
//     );
//     if (!savedUser) {
//       console.error("createUser: User save failed", { email: normalizedEmail });
//       return res.status(500).json({
//         status: "error",
//         statusCode: 500,
//         message: "Failed to save user to database",
//         data: { token: null, user: null },
//       });
//     }

//     console.log("createUser: User created", {
//       userId: savedUser._id,
//       fullName,
//       email: normalizedEmail,
//     });

//     // Generate JWT token for the new user
//     const token = jwt.sign(
//       { id: savedUser._id, role: savedUser.role },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: process.env.JWT_EXPIRES_IN || "90d",
//       }
//     );

//     // Set JWT cookie
//     res.cookie("jwt", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000,
//     });

//     // Send welcome email
//     try {
//       await new Email(savedUser, null, null).sendWelcome();
//       console.log("createUser: Welcome email sent", { email: normalizedEmail });
//     } catch (emailError) {
//       console.error("createUser: Failed to send welcome email", emailError);
//     }

//     return res.status(201).json({
//       status: "success",
//       statusCode: 201,
//       message: "User created and logged in successfully",
//       data: {
//         token,
//         user: {
//           _id: savedUser._id,
//           fullName: savedUser.fullName,
//           Department: savedUser.Department,
//           email: savedUser.email,
//           role: roleDoc,
//           phoneNumber: savedUser.phoneNumber,
//           status: savedUser.status,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("createUser: Error", {
//       message: error.message,
//       stack: error.stack,
//     });
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user creation",
//       data: { token: null, user: null },
//     });
//   }
// };

// // getAllUsers remains unchanged as it is already correct
// const getAllUsers = async (req, res) => {
//   console.log("getAllUsers: Request received", { user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id) {
//       console.log("getAllUsers: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: {
//           token: null,
//           user: null,
//           users: null,
//         },
//       });
//     }

//     // Fetch users (middleware already checked UserManagement.viewUsers permission)
//     const users = await User.find()
//       .populate("role")
//       .select("-password -resetPasswordToken -resetPasswordExpires");

//     console.log("getAllUsers: Users retrieved", { count: users.length });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: users.length ? "Users retrieved successfully" : "No users found",
//       data: {
//         token: null,
//         user: null,
//         users,
//       },
//     });
//   } catch (error) {
//     console.error("getAllUsers: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user retrieval",
//       data: {
//         token: null,
//         user: null,
//         users: null,
//       },
//     });
//   }
// };

// const getUserById = async (req, res) => {
//   const { id } = req.params;
//   console.log("getUserById: Request received", { userId: id, user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id) {
//       console.log("getUserById: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("getUserById: Invalid user ID", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid user ID",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     // Allow users with UserManagement.viewUsers or themselves (middleware handles permission)
//     const user = await User.findById(id)
//       .populate("role")
//       .select("-password -resetPasswordToken -resetPasswordExpires");

//     if (!user) {
//       console.log("getUserById: User not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     console.log("getUserById: User retrieved", { userId: id });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User retrieved successfully",
//       data: {
//         token: null,
//         user,
//       },
//     });
//   } catch (error) {
//     console.error("getUserById: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user retrieval",
//       data: {
//         token: null,
//         user: null,
//       },
//     });
//   }
// };

// const deleteUser = async (req, res) => {
//   const { id } = req.params;
//   console.log("deleteUser: Request received", { userId: id, user: req.user });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id) {
//       console.log("deleteUser: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("deleteUser: Invalid user ID", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid user ID",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     // Prevent deleting self
//     if (req.user.id === id) {
//       console.log("deleteUser: Cannot delete self", { userId: id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Cannot delete your own account",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     const user = await User.findByIdAndDelete(id);
//     if (!user) {
//       console.log("deleteUser: User not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: {
//           token: null,
//           user: null,
//         },
//       });
//     }

//     console.log("deleteUser: User deleted", { userId: id });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User deleted successfully",
//       data: {
//         token: null,
//         user: null,
//       },
//     });
//   } catch (error) {
//     console.error("deleteUser: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user deletion",
//       data: {
//         token: null,
//         user: null,
//       },
//     });
//   }
// };

// const getUserMetrics = async (req, res) => {
//   console.log("getUserMetrics: Request received", { user: req.user });

//   try {
//     if (!req.user || !req.user.id) {
//       console.log("getUserMetrics: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: {
//           token: null,
//           user: null,
//           metrics: null,
//         },
//       });
//     }

//     const totalUsers = await User.countDocuments();

//     console.log("getUserMetrics: Metrics retrieved", { totalUsers });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User metrics retrieved successfully",
//       data: {
//         token: null,
//         user: null,
//         metrics: { totalUsers },
//       },
//     });
//   } catch (error) {
//     console.error("getUserMetrics: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user metrics retrieval",
//       data: {
//         token: null,
//         user: null,
//         metrics: null,
//       },
//     });
//   }
// };

// const createRole = async (req, res) => {
//   if (!req.body) {
//     console.log("createRole: No request body provided");
//     return res.status(400).json({
//       status: "error",
//       statusCode: 400,
//       message: "Request body is required",
//       data: { token: null, role: null },
//     });
//   }

//   const { name, description, permissions } = req.body;
//   console.log("createRole: Request received", {
//     name,
//     description,
//     permissions,
//     user: req.user,
//   });

//   try {
//     // Check authentication (middleware handles UserManagement.manageUserRoles permission)
//     if (!req.user || !req.user.id) {
//       console.log("createRole: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, role: null },
//       });
//     }

//     // Validate inputs
//     if (!name?.trim() || !description?.trim()) {
//       console.log("createRole: Missing required fields", { name, description });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Role name and description are required",
//         data: { token: null, role: null },
//       });
//     }

//     // Check for existing role
//     const existingRole = await Role.findOne({ name });
//     if (existingRole) {
//       console.log("createRole: Role already exists", { name });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Role name already exists",
//         data: { token: null, role: null },
//       });
//     }

//     // Prevent non-superAdmins from creating superAdmin role or roles with manageUserRoles
//     const requestingUser = await User.findById(req.user.id).populate("role");
//     if (
//       (name === "superAdmin" || permissions?.UserManagement?.manageUserRoles) &&
//       requestingUser.role.name !== "superAdmin"
//     ) {
//       console.log(
//         "createRole: Unauthorized to create superAdmin or manageUserRoles role",
//         { userId: req.user.id }
//       );
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message:
//           "Only superAdmins can create superAdmin or manageUserRoles roles",
//         data: { token: null, role: null },
//       });
//     }

//     // Create new role
//     const role = new Role({
//       name,
//       description,
//       permissions: {
//         UserManagement: {
//           viewUsers: permissions?.UserManagement?.viewUsers || false,
//           createUsers: permissions?.UserManagement?.createUsers || false,
//           editUsers: permissions?.UserManagement?.editUsers || false,
//           deleteUsers: permissions?.UserManagement?.deleteUsers || false,
//           manageUserRoles:
//             permissions?.UserManagement?.manageUserRoles || false,
//         },
//         DocumentManagement: {
//           viewDocuments:
//             permissions?.DocumentManagement?.viewDocuments || false,
//           uploadDocuments:
//             permissions?.DocumentManagement?.uploadDocuments || false,
//           editDocuments:
//             permissions?.DocumentManagement?.editDocuments || false,
//           deleteDocuments:
//             permissions?.DocumentManagement?.deleteDocuments || false,
//           approveDocuments:
//             permissions?.DocumentManagement?.approveDocuments || false,
//         },
//         OrganizationManagement: {
//           viewOrganizations:
//             permissions?.OrganizationManagement?.viewOrganizations || false,
//           createOrganizations:
//             permissions?.OrganizationManagement?.createOrganizations || false,
//           editOrganizations:
//             permissions?.OrganizationManagement?.editOrganizations || false,
//           deleteOrganizations:
//             permissions?.OrganizationManagement?.deleteOrganizations || false,
//         },
//       },
//       createdBy: req.user.id,
//     });

//     await role.save();
//     console.log("createRole: Role created", { roleId: role._id, name });

//     return res.status(201).json({
//       status: "success",
//       statusCode: 201,
//       message: "Role created successfully",
//       data: { token: null, role },
//     });
//   } catch (error) {
//     console.error("createRole: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during role creation",
//       data: { token: null, role: null },
//     });
//   }
// };

// const getAllRoles = async (req, res) => {
//   console.log("getAllRoles: Request received", { user: req.user });

//   try {
//     // Check authentication (middleware handles UserManagement.viewUsers or manageUserRoles permission)
//     if (!req.user || !req.user.id) {
//       console.log("getAllRoles: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, roles: null },
//       });
//     }

//     const roles = await Role.find();
//     console.log("getAllRoles: Roles retrieved", { count: roles.length });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: roles.length ? "Roles retrieved successfully" : "No roles found",
//       data: { token: null, roles },
//     });
//   } catch (error) {
//     console.error("getAllRoles: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during role retrieval",
//       data: { token: null, roles: null },
//     });
//   }
// };

// const updateRole = async (req, res) => {
//   const { id } = req.params;
//   const { name, description, permissions } = req.body;
//   console.log("updateRole: Request received", {
//     roleId: id,
//     name,
//     description,
//     permissions,
//     user: req.user,
//   });

//   try {
//     // Check authentication (middleware handles UserManagement.manageUserRoles permission)
//     if (!req.user || !req.user.id) {
//       console.log("updateRole: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, role: null },
//       });
//     }

//     const role = await Role.findById(id);
//     if (!role) {
//       console.log("updateRole: Role not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Role not found",
//         data: { token: null, role: null },
//       });
//     }

//     // Prevent non-superAdmins from updating superAdmin role or manageUserRoles permissions
//     const requestingUser = await User.findById(req.user.id).populate("role");
//     if (
//       (name === "superAdmin" ||
//         role.name === "superAdmin" ||
//         permissions?.UserManagement?.manageUserRoles) &&
//       requestingUser.role.name !== "superAdmin"
//     ) {
//       console.log(
//         "updateRole: Unauthorized to update superAdmin or manageUserRoles",
//         { userId: req.user.id }
//       );
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message:
//           "Only superAdmins can update superAdmin roles or manageUserRoles permissions",
//         data: { token: null, role: null },
//       });
//     }

//     if (name?.trim()) {
//       const existingRole = await Role.findOne({ name });
//       if (existingRole && existingRole._id.toString() !== id) {
//         console.log("updateRole: Role name already exists", { name });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Role name already exists",
//           data: { token: null, role: null },
//         });
//       }
//       role.name = name.trim();
//     }

//     if (description?.trim()) role.description = description.trim();

//     if (permissions) {
//       role.permissions = {
//         UserManagement: {
//           viewUsers:
//             permissions.UserManagement?.viewUsers ??
//             role.permissions.UserManagement.viewUsers,
//           createUsers:
//             permissions.UserManagement?.createUsers ??
//             role.permissions.UserManagement.createUsers,
//           editUsers:
//             permissions.UserManagement?.editUsers ??
//             role.permissions.UserManagement.editUsers,
//           deleteUsers:
//             permissions.UserManagement?.deleteUsers ??
//             role.permissions.UserManagement.deleteUsers,
//           manageUserRoles:
//             permissions.UserManagement?.manageUserRoles ??
//             role.permissions.UserManagement.manageUserRoles,
//         },
//         DocumentManagement: {
//           viewDocuments:
//             permissions.DocumentManagement?.viewDocuments ??
//             role.permissions.DocumentManagement.viewDocuments,
//           uploadDocuments:
//             permissions.DocumentManagement?.uploadDocuments ??
//             role.permissions.DocumentManagement.uploadDocuments,
//           editDocuments:
//             permissions.DocumentManagement?.editDocuments ??
//             role.permissions.DocumentManagement.editDocuments,
//           deleteDocuments:
//             permissions.DocumentManagement?.deleteDocuments ??
//             role.permissions.DocumentManagement.deleteDocuments,
//           approveDocuments:
//             permissions.DocumentManagement?.approveDocuments ??
//             role.permissions.DocumentManagement.approveDocuments,
//         },
//         OrganizationManagement: {
//           viewOrganizations:
//             permissions.OrganizationManagement?.viewOrganizations ??
//             role.permissions.OrganizationManagement.viewOrganizations,
//           createOrganizations:
//             permissions.OrganizationManagement?.createOrganizations ??
//             role.permissions.OrganizationManagement.createOrganizations,
//           editOrganizations:
//             permissions.OrganizationManagement?.editOrganizations ??
//             role.permissions.OrganizationManagement.editOrganizations,
//           deleteOrganizations:
//             permissions.OrganizationManagement?.deleteOrganizations ??
//             role.permissions.OrganizationManagement.deleteOrganizations,
//         },
//       };
//     }

//     await role.save();
//     console.log("updateRole: Role updated", { roleId: id });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Role updated successfully",
//       data: { token: null, role },
//     });
//   } catch (error) {
//     console.error("updateRole: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during role update",
//       data: { token: null, role: null },
//     });
//   }
// };

// const deleteRole = async (req, res) => {
//   const { id } = req.params;
//   console.log("deleteRole: Request received", { roleId: id, user: req.user });

//   try {
//     // Check authentication (middleware handles UserManagement.manageUserRoles permission)
//     if (!req.user || !req.user.id) {
//       console.log("deleteRole: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, role: null },
//       });
//     }

//     const role = await Role.findById(id);
//     if (!role) {
//       console.log("deleteRole: Role not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Role not found",
//         data: { token: null, role: null },
//       });
//     }

//     // Prevent non-superAdmins from deleting superAdmin role
//     const requestingUser = await User.findById(req.user.id).populate("role");
//     if (
//       role.name === "superAdmin" &&
//       requestingUser.role.name !== "superAdmin"
//     ) {
//       console.log("deleteRole: Unauthorized to delete superAdmin role", {
//         userId: req.user.id,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Only superAdmins can delete superAdmin role",
//         data: { token: null, role: null },
//       });
//     }

//     // Check if role is assigned to any users
//     const userCount = await User.countDocuments({ role: id });
//     if (userCount > 0) {
//       console.log("deleteRole: Role is assigned to users", {
//         roleId: id,
//         userCount,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Cannot delete role assigned to users",
//         data: { token: null, role: null },
//       });
//     }

//     await Role.findByIdAndDelete(id);
//     console.log("deleteRole: Role deleted", { roleId: id });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Role deleted successfully",
//       data: { token: null, role: null },
//     });
//   } catch (error) {
//     console.error("deleteRole: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during role deletion",
//       data: { token: null, role: null },
//     });
//   }
// };

// const resetUserPassword = async (req, res) => {
//   const { email } = req.body;
//   console.log("resetUserPassword: Request received", {
//     email,
//     user: req.user,
//   });

//   try {
//     // Check authentication (middleware handles UserManagement.manageUserRoles permission)
//     if (!req.user || !req.user.id) {
//       console.log("resetUserPassword: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate inputs
//     if (!email?.trim()) {
//       console.log("resetUserPassword: Missing required fields", {
//         email,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Email is required",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       console.log("resetUserPassword: Invalid email format", { email });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid email format",
//         data: { token: null, user: null },
//       });
//     }

//     // Find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log("resetUserPassword: User not found", { email });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { token: null, user: null },
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = resetExpires;
//     await user.save();

//     console.log("resetUserPassword: Reset token generated", {
//       userId: user._id,
//       email,
//     });

//     // Send reset email with link
//     try {
//       const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
//       await new Email(user, resetUrl).sendPasswordReset();
//       console.log("resetUserPassword: Reset email sent", { email });
//     } catch (emailError) {
//       console.error(
//         "resetUserPassword: Failed to send reset email",
//         emailError
//       );
//     }

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Password reset link sent to user",
//       data: { token: null, user: null },
//     });
//   } catch (error) {
//     console.error("resetUserPassword: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during password reset",
//       data: { token: null, user: null },
//     });
//   }
// };

// const updateUser = async (req, res) => {
//   const { id } = req.params;
//   const { fullName, Department, email, role, status, phoneNumber } = req.body;
//   console.log("updateUser: Request received", {
//     userId: id,
//     fullName,
//     Department,
//     email,
//     role,
//     status,
//     phoneNumber,
//     user: req.user,
//   });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id) {
//       console.log("updateUser: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("updateUser: Invalid user ID", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid user ID",
//         data: { token: null, user: null },
//       });
//     }

//     // Find user
//     const user = await User.findById(id);
//     if (!user) {
//       console.log("updateUser: User not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate at least one field is provided
//     if (
//       !fullName?.trim() &&
//       !Department?.trim() &&
//       !email?.trim() &&
//       !role &&
//       !status &&
//       !phoneNumber?.trim()
//     ) {
//       console.log("updateUser: No fields provided", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "At least one field must be provided for update",
//         data: { token: null, user: null },
//       });
//     }

//     // Update fields
//     if (fullName?.trim()) user.fullName = fullName.trim();
//     if (Department?.trim()) user.Department = Department.trim();
//     if (phoneNumber?.trim()) user.phoneNumber = phoneNumber.trim();

//     if (email?.trim()) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(email)) {
//         console.log("updateUser: Invalid email format", { email });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Invalid email format",
//           data: { token: null, user: null },
//         });
//       }
//       if (email !== user.email) {
//         const existingUser = await User.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== id) {
//           console.log("updateUser: Email already exists", { email });
//           return res.status(400).json({
//             status: "error",
//             statusCode: 400,
//             message: "Email already exists",
//             data: { token: null, user: null },
//           });
//         }
//         user.email = email.trim();
//       }
//     }

//     if (role) {
//       const roleDoc = await Role.findById(role);
//       if (!roleDoc) {
//         console.log("updateUser: Role not found", { role });
//         return res.status(404).json({
//           status: "error",
//           statusCode: 404,
//           message: "Role not found",
//           data: { token: null, user: null },
//         });
//       }
//       // Prevent non-superAdmins from assigning superAdmin role
//       const requestingUser = await User.findById(req.user.id).populate("role");
//       if (
//         roleDoc.name === "superAdmin" &&
//         requestingUser.role.name !== "superAdmin"
//       ) {
//         console.log("updateUser: Unauthorized to assign superAdmin role", {
//           userId: req.user.id,
//         });
//         return res.status(403).json({
//           status: "error",
//           statusCode: 403,
//           message: "Only superAdmins can assign superAdmin role",
//           data: { token: null, user: null },
//         });
//       }
//       // Prevent self-escalation
//       if (req.user.id === id && roleDoc.name === "superAdmin") {
//         console.log("updateUser: Cannot escalate own role to superAdmin", {
//           userId: req.user.id,
//         });
//         return res.status(403).json({
//           status: "error",
//           statusCode: 403,
//           message: "Cannot escalate your own role to superAdmin",
//           data: { token: null, user: null },
//         });
//       }
//       user.role = roleDoc._id;
//     }

//     if (status) {
//       if (!["Active", "InActive"].includes(status)) {
//         console.log("updateUser: Invalid status", { status });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Status must be Active or InActive",
//           data: { token: null, user: null },
//         });
//       }
//       user.status = status;
//     }

//     await user.save();
//     console.log("updateUser: User updated", { userId: id });

//     const updatedUser = await User.findById(id)
//       .populate("role")
//       .select("-password -resetPasswordToken -resetPasswordExpires");

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User updated successfully",
//       data: { token: null, user: updatedUser },
//     });
//   } catch (error) {
//     console.error("updateUser: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user update",
//       data: { token: null, user: null },
//     });
//   }
// };

// const deactivateUser = async (req, res) => {
//   const { id } = req.params;
//   console.log("deactivateUser: Request received", {
//     userId: id,
//     user: req.user,
//   });

//   try {
//     // Check authentication
//     if (!req.user || !req.user.id) {
//       console.log("deactivateUser: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("deactivateUser: Invalid user ID", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid user ID",
//         data: { token: null, user: null },
//       });
//     }

//     // Prevent deactivating self
//     if (req.user.id === id) {
//       console.log("deactivateUser: Cannot deactivate self", { userId: id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Cannot deactivate your own account",
//         data: { token: null, user: null },
//       });
//     }

//     // Find user
//     const user = await User.findById(id);
//     if (!user) {
//       console.log("deactivateUser: User not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { token: null, user: null },
//       });
//     }

//     // Check if user is already inactive
//     if (user.status === "InActive") {
//       console.log("deactivateUser: User already inactive", { userId: id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "User is already inactive",
//         data: { token: null, user: null },
//       });
//     }

//     // Deactivate user
//     user.status = "InActive";
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     // Optionally clear JWT cookie to force logout
//     res.clearCookie("jwt", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//     });

//     console.log("deactivateUser: User deactivated", { userId: id });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "User deactivated successfully",
//       data: { token: null, user: null },
//     });
//   } catch (error) {
//     console.error("deactivateUser: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user deactivation",
//       data: { token: null, user: null },
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
//   resetUserPassword,
//   deactivateUser,
//   createRole,
//   getAllRoles,
//   updateRole,
//   deleteRole,
// };

const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const Email = require("../utils/email");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const createUser = async (req, res) => {
  const { fullName, Department, email, password, role, phoneNumber, status } =
    req.body;
  console.log("createUser: Request received", {
    fullName,
    email,
    role,
    admin: req.user,
  });

  try {
    // Check authentication (middleware handles UserManagement.createUsers permission)
    if (!req.user || !req.user.id) {
      console.log("createUser: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Validate inputs
    if (
      !fullName?.trim() ||
      !Department?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !phoneNumber?.trim()
    ) {
      console.log("createUser: Missing or empty required fields", {
        fullName,
        Department,
        email,
        password,
        phoneNumber,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "Full name, department, email, password, and phone number are required",
        data: { user: null },
      });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.log("createUser: Invalid email format", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid email format",
        data: { user: null },
      });
    }

    // Validate email domain
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
      ? process.env.ALLOWED_EMAIL_DOMAINS.split(",").map((domain) =>
          domain.replace(/^@/, "").toLowerCase()
        )
      : [];
    if (!allowedDomains.length) {
      console.log("createUser: No allowed email domains configured");
      return res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Email domain validation not configured",
        data: { user: null },
      });
    }
    const emailDomain = normalizedEmail.split("@")[1].toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      console.log("createUser: Invalid email domain", {
        email,
        emailDomain,
        allowedDomains,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: `Email domain must be one of: ${allowedDomains.join(", ")}`,
        data: { user: null },
      });
    }

    // Validate role
    if (!role) {
      console.log("createUser: Role not provided");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Role is required",
        data: { user: null },
      });
    }

    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      console.log("createUser: Role not found", { role });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Role not found",
        data: { user: null },
      });
    }

    // Prevent non-superAdmins from assigning superAdmin role
    const requestingUser = await User.findById(req.user.id).populate("role");
    if (
      roleDoc.name === "superAdmin" &&
      requestingUser.role.name !== "superAdmin"
    ) {
      console.log("createUser: Unauthorized to assign superAdmin role", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Only superAdmins can assign superAdmin role",
        data: { user: null },
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log("createUser: User already exists", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email already exists",
        data: { user: null },
      });
    }

    // Create user with plain password (pre-save hook will hash it)
    const user = new User({
      fullName,
      Department,
      email: normalizedEmail,
      password,
      role: roleDoc._id,
      phoneNumber,
      status: status || "Active",
      firstName: fullName.split(" ")[0],
    });

    // Save user and verify it was saved
    await user.save();
    const savedUser = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!savedUser) {
      console.error("createUser: User save failed", { email: normalizedEmail });
      return res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Failed to save user to database",
        data: { user: null },
      });
    }

    console.log("createUser: User created", {
      userId: savedUser._id,
      fullName,
      email: normalizedEmail,
    });

    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
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

    // Send welcome email
    try {
      await new Email(savedUser, null, null).sendWelcome();
      console.log("createUser: Welcome email sent", { email: normalizedEmail });
    } catch (emailError) {
      console.error("createUser: Failed to send welcome email", emailError);
    }

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User created and logged in successfully",
      data: {
        token,
        user: {
          _id: savedUser._id,
          fullName: savedUser.fullName,
          Department: savedUser.Department,
          email: savedUser.email,
          role: roleDoc,
          phoneNumber: savedUser.phoneNumber,
          status: savedUser.status,
        },
      },
    });
  } catch (error) {
    console.error("createUser: Error", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user creation",
      data: { user: null },
    });
  }
};

// getAllUsers remains unchanged as it is already correct
const getAllUsers = async (req, res) => {
  console.log("getAllUsers: Request received", { user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("getAllUsers: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: {
          user: null,
          users: null,
        },
      });
    }

    // Fetch users (middleware already checked UserManagement.viewUsers permission)
    const users = await User.find()
      .populate("role")
      .select("-password -resetPasswordToken -resetPasswordExpires");

    console.log("getAllUsers: Users retrieved", { count: users.length });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: users.length ? "Users retrieved successfully" : "No users found",
      data: {
        user: null,
        users,
      },
    });
  } catch (error) {
    console.error("getAllUsers: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user retrieval",
      data: {
        user: null,
        users: null,
      },
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log("getUserById: Request received", { userId: id, user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("getUserById: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: {
          user: null,
        },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("getUserById: Invalid user ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid user ID",
        data: {
          user: null,
        },
      });
    }

    // Allow users with UserManagement.viewUsers or themselves (middleware handles permission)
    const user = await User.findById(id)
      .populate("role")
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      console.log("getUserById: User not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: {
          user: null,
        },
      });
    }

    console.log("getUserById: User retrieved", { userId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User retrieved successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("getUserById: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user retrieval",
      data: {
        user: null,
      },
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log("deleteUser: Request received", { userId: id, user: req.user });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("deleteUser: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: {
          user: null,
        },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("deleteUser: Invalid user ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid user ID",
        data: {
          user: null,
        },
      });
    }

    // Prevent deleting self
    if (req.user.id === id) {
      console.log("deleteUser: Cannot delete self", { userId: id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Cannot delete your own account",
        data: {
          user: null,
        },
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      console.log("deleteUser: User not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: {
          user: null,
        },
      });
    }

    console.log("deleteUser: User deleted", { userId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User deleted successfully",
      data: {
        user: null,
      },
    });
  } catch (error) {
    console.error("deleteUser: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user deletion",
      data: {
        user: null,
      },
    });
  }
};

const getUserMetrics = async (req, res) => {
  console.log("getUserMetrics: Request received", { user: req.user });

  try {
    if (!req.user || !req.user.id) {
      console.log("getUserMetrics: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: {
          user: null,
          metrics: null,
        },
      });
    }

    const totalUsers = await User.countDocuments();

    console.log("getUserMetrics: Metrics retrieved", { totalUsers });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User metrics retrieved successfully",
      data: {
        user: null,
        metrics: { totalUsers },
      },
    });
  } catch (error) {
    console.error("getUserMetrics: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user metrics retrieval",
      data: {
        user: null,
        metrics: null,
      },
    });
  }
};

const createRole = async (req, res) => {
  if (!req.body) {
    console.log("createRole: No request body provided");
    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "Request body is required",
      data: { role: null },
    });
  }

  const { name, description, permissions } = req.body;
  console.log("createRole: Request received", {
    name,
    description,
    permissions,
    user: req.user,
  });

  try {
    // Check authentication (middleware handles UserManagement.manageUserRoles permission)
    if (!req.user || !req.user.id) {
      console.log("createRole: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { role: null },
      });
    }

    // Validate inputs
    if (!name?.trim() || !description?.trim()) {
      console.log("createRole: Missing required fields", { name, description });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Role name and description are required",
        data: { role: null },
      });
    }

    // Check for existing role
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      console.log("createRole: Role already exists", { name });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Role name already exists",
        data: { role: null },
      });
    }

    // Prevent non-superAdmins from creating superAdmin role or roles with manageUserRoles
    const requestingUser = await User.findById(req.user.id).populate("role");
    if (
      (name === "superAdmin" || permissions?.UserManagement?.manageUserRoles) &&
      requestingUser.role.name !== "superAdmin"
    ) {
      console.log(
        "createRole: Unauthorized to create superAdmin or manageUserRoles role",
        { userId: req.user.id }
      );
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message:
          "Only superAdmins can create superAdmin or manageUserRoles roles",
        data: { role: null },
      });
    }

    // Create new role
    const role = new Role({
      name,
      description,
      permissions: {
        UserManagement: {
          viewUsers: permissions?.UserManagement?.viewUsers || false,
          createUsers: permissions?.UserManagement?.createUsers || false,
          editUsers: permissions?.UserManagement?.editUsers || false,
          deleteUsers: permissions?.UserManagement?.deleteUsers || false,
          manageUserRoles:
            permissions?.UserManagement?.manageUserRoles || false,
        },
        DocumentManagement: {
          viewDocuments:
            permissions?.DocumentManagement?.viewDocuments || false,
          uploadDocuments:
            permissions?.DocumentManagement?.uploadDocuments || false,
          editDocuments:
            permissions?.DocumentManagement?.editDocuments || false,
          deleteDocuments:
            permissions?.DocumentManagement?.deleteDocuments || false,
          approveDocuments:
            permissions?.DocumentManagement?.approveDocuments || false,
        },
        OrganizationManagement: {
          viewOrganizations:
            permissions?.OrganizationManagement?.viewOrganizations || false,
          createOrganizations:
            permissions?.OrganizationManagement?.createOrganizations || false,
          editOrganizations:
            permissions?.OrganizationManagement?.editOrganizations || false,
          deleteOrganizations:
            permissions?.OrganizationManagement?.deleteOrganizations || false,
        },
      },
      createdBy: req.user.id,
    });

    await role.save();
    console.log("createRole: Role created", { roleId: role._id, name });

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Role created successfully",
      data: { role },
    });
  } catch (error) {
    console.error("createRole: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during role creation",
      data: { role: null },
    });
  }
};

const getAllRoles = async (req, res) => {
  console.log("getAllRoles: Request received", { user: req.user });

  try {
    // Check authentication (middleware handles UserManagement.viewUsers or manageUserRoles permission)
    if (!req.user || !req.user.id) {
      console.log("getAllRoles: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { roles: null },
      });
    }

    const roles = await Role.find();
    console.log("getAllRoles: Roles retrieved", { count: roles.length });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: roles.length ? "Roles retrieved successfully" : "No roles found",
      data: { roles },
    });
  } catch (error) {
    console.error("getAllRoles: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during role retrieval",
      data: { roles: null },
    });
  }
};

const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  console.log("updateRole: Request received", {
    roleId: id,
    name,
    description,
    permissions,
    user: req.user,
  });

  try {
    // Check authentication (middleware handles UserManagement.manageUserRoles permission)
    if (!req.user || !req.user.id) {
      console.log("updateRole: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { role: null },
      });
    }

    const role = await Role.findById(id);
    if (!role) {
      console.log("updateRole: Role not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Role not found",
        data: { role: null },
      });
    }

    // Prevent non-superAdmins from updating superAdmin role or manageUserRoles permissions
    const requestingUser = await User.findById(req.user.id).populate("role");
    if (
      (name === "superAdmin" ||
        role.name === "superAdmin" ||
        permissions?.UserManagement?.manageUserRoles) &&
      requestingUser.role.name !== "superAdmin"
    ) {
      console.log(
        "updateRole: Unauthorized to update superAdmin or manageUserRoles",
        { userId: req.user.id }
      );
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message:
          "Only superAdmins can update superAdmin roles or manageUserRoles permissions",
        data: { role: null },
      });
    }

    if (name?.trim()) {
      const existingRole = await Role.findOne({ name });
      if (existingRole && existingRole._id.toString() !== id) {
        console.log("updateRole: Role name already exists", { name });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Role name already exists",
          data: { role: null },
        });
      }
      role.name = name.trim();
    }

    if (description?.trim()) role.description = description.trim();

    if (permissions) {
      role.permissions = {
        UserManagement: {
          viewUsers:
            permissions.UserManagement?.viewUsers ??
            role.permissions.UserManagement.viewUsers,
          createUsers:
            permissions.UserManagement?.createUsers ??
            role.permissions.UserManagement.createUsers,
          editUsers:
            permissions.UserManagement?.editUsers ??
            role.permissions.UserManagement.editUsers,
          deleteUsers:
            permissions.UserManagement?.deleteUsers ??
            role.permissions.UserManagement.deleteUsers,
          manageUserRoles:
            permissions.UserManagement?.manageUserRoles ??
            role.permissions.UserManagement.manageUserRoles,
        },
        DocumentManagement: {
          viewDocuments:
            permissions.DocumentManagement?.viewDocuments ??
            role.permissions.DocumentManagement.viewDocuments,
          uploadDocuments:
            permissions.DocumentManagement?.uploadDocuments ??
            role.permissions.DocumentManagement.uploadDocuments,
          editDocuments:
            permissions.DocumentManagement?.editDocuments ??
            role.permissions.DocumentManagement.editDocuments,
          deleteDocuments:
            permissions.DocumentManagement?.deleteDocuments ??
            role.permissions.DocumentManagement.deleteDocuments,
          approveDocuments:
            permissions.DocumentManagement?.approveDocuments ??
            role.permissions.DocumentManagement.approveDocuments,
        },
        OrganizationManagement: {
          viewOrganizations:
            permissions.OrganizationManagement?.viewOrganizations ??
            role.permissions.OrganizationManagement.viewOrganizations,
          createOrganizations:
            permissions.OrganizationManagement?.createOrganizations ??
            role.permissions.OrganizationManagement.createOrganizations,
          editOrganizations:
            permissions.OrganizationManagement?.editOrganizations ??
            role.permissions.OrganizationManagement.editOrganizations,
          deleteOrganizations:
            permissions.OrganizationManagement?.deleteOrganizations ??
            role.permissions.OrganizationManagement.deleteOrganizations,
        },
      };
    }

    await role.save();
    console.log("updateRole: Role updated", { roleId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Role updated successfully",
      data: { role },
    });
  } catch (error) {
    console.error("updateRole: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during role update",
      data: { role: null },
    });
  }
};

const deleteRole = async (req, res) => {
  const { id } = req.params;
  console.log("deleteRole: Request received", { roleId: id, user: req.user });

  try {
    // Check authentication (middleware handles UserManagement.manageUserRoles permission)
    if (!req.user || !req.user.id) {
      console.log("deleteRole: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { role: null },
      });
    }

    const role = await Role.findById(id);
    if (!role) {
      console.log("deleteRole: Role not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Role not found",
        data: { role: null },
      });
    }

    // Prevent non-superAdmins from deleting superAdmin role
    const requestingUser = await User.findById(req.user.id).populate("role");
    if (
      role.name === "superAdmin" &&
      requestingUser.role.name !== "superAdmin"
    ) {
      console.log("deleteRole: Unauthorized to delete superAdmin role", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Only superAdmins can delete superAdmin role",
        data: { role: null },
      });
    }

    // Check if role is assigned to any users
    const userCount = await User.countDocuments({ role: id });
    if (userCount > 0) {
      console.log("deleteRole: Role is assigned to users", {
        roleId: id,
        userCount,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Cannot delete role assigned to users",
        data: { role: null },
      });
    }

    await Role.findByIdAndDelete(id);
    console.log("deleteRole: Role deleted", { roleId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Role deleted successfully",
      data: { role: null },
    });
  } catch (error) {
    console.error("deleteRole: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during role deletion",
      data: { role: null },
    });
  }
};

const resetUserPassword = async (req, res) => {
  const { email } = req.body;
  console.log("resetUserPassword: Request received", {
    email,
    user: req.user,
  });

  try {
    // Check authentication (middleware handles UserManagement.manageUserRoles permission)
    if (!req.user || !req.user.id) {
      console.log("resetUserPassword: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Validate inputs
    if (!email?.trim()) {
      console.log("resetUserPassword: Missing required fields", {
        email,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email is required",
        data: { user: null },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("resetUserPassword: Invalid email format", { email });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid email format",
        data: { user: null },
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("resetUserPassword: User not found", { email });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    console.log("resetUserPassword: Reset token generated", {
      userId: user._id,
      email,
    });

    // Send reset email with link
    try {
      const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
      await new Email(user, resetUrl).sendPasswordReset();
      console.log("resetUserPassword: Reset email sent", { email });
    } catch (emailError) {
      console.error(
        "resetUserPassword: Failed to send reset email",
        emailError
      );
    }

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password reset link sent to user",
      data: { user: null },
    });
  } catch (error) {
    console.error("resetUserPassword: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during password reset",
      data: { user: null },
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, Department, email, role, status, phoneNumber } = req.body;
  console.log("updateUser: Request received", {
    userId: id,
    fullName,
    Department,
    email,
    role,
    status,
    phoneNumber,
    user: req.user,
  });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("updateUser: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("updateUser: Invalid user ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid user ID",
        data: { user: null },
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.log("updateUser: User not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
      });
    }

    // Validate at least one field is provided
    if (
      !fullName?.trim() &&
      !Department?.trim() &&
      !email?.trim() &&
      !role &&
      !status &&
      !phoneNumber?.trim()
    ) {
      console.log("updateUser: No fields provided", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "At least one field must be provided for update",
        data: { user: null },
      });
    }

    // Update fields
    if (fullName?.trim()) user.fullName = fullName.trim();
    if (Department?.trim()) user.Department = Department.trim();
    if (phoneNumber?.trim()) user.phoneNumber = phoneNumber.trim();

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("updateUser: Invalid email format", { email });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid email format",
          data: { user: null },
        });
      }
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== id) {
          console.log("updateUser: Email already exists", { email });
          return res.status(400).json({
            status: "error",
            statusCode: 400,
            message: "Email already exists",
            data: { user: null },
          });
        }
        user.email = email.trim();
      }
    }

    if (role) {
      const roleDoc = await Role.findById(role);
      if (!roleDoc) {
        console.log("updateUser: Role not found", { role });
        return res.status(404).json({
          status: "error",
          statusCode: 404,
          message: "Role not found",
          data: { user: null },
        });
      }
      // Prevent non-superAdmins from assigning superAdmin role
      const requestingUser = await User.findById(req.user.id).populate("role");
      if (
        roleDoc.name === "superAdmin" &&
        requestingUser.role.name !== "superAdmin"
      ) {
        console.log("updateUser: Unauthorized to assign superAdmin role", {
          userId: req.user.id,
        });
        return res.status(403).json({
          status: "error",
          statusCode: 403,
          message: "Only superAdmins can assign superAdmin role",
          data: { user: null },
        });
      }
      // Prevent self-escalation
      if (req.user.id === id && roleDoc.name === "superAdmin") {
        console.log("updateUser: Cannot escalate own role to superAdmin", {
          userId: req.user.id,
        });
        return res.status(403).json({
          status: "error",
          statusCode: 403,
          message: "Cannot escalate your own role to superAdmin",
          data: { user: null },
        });
      }
      user.role = roleDoc._id;
    }

    if (status) {
      if (!["Active", "InActive"].includes(status)) {
        console.log("updateUser: Invalid status", { status });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Status must be Active or InActive",
          data: { user: null },
        });
      }
      user.status = status;
    }

    await user.save();
    console.log("updateUser: User updated", { userId: id });

    const updatedUser = await User.findById(id)
      .populate("role")
      .select("-password -resetPasswordToken -resetPasswordExpires");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("updateUser: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user update",
      data: { user: null },
    });
  }
};

const deactivateUser = async (req, res) => {
  const { id } = req.params;
  console.log("deactivateUser: Request received", {
    userId: id,
    user: req.user,
  });

  try {
    // Check authentication
    if (!req.user || !req.user.id) {
      console.log("deactivateUser: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("deactivateUser: Invalid user ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid user ID",
        data: { user: null },
      });
    }

    // Prevent deactivating self
    if (req.user.id === id) {
      console.log("deactivateUser: Cannot deactivate self", { userId: id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Cannot deactivate your own account",
        data: { user: null },
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.log("deactivateUser: User not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null },
      });
    }

    // Check if user is already inactive
    if (user.status === "InActive") {
      console.log("deactivateUser: User already inactive", { userId: id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User is already inactive",
        data: { user: null },
      });
    }

    // Deactivate user
    user.status = "InActive";
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Optionally clear JWT cookie to force logout
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    console.log("deactivateUser: User deactivated", { userId: id });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User deactivated successfully",
      data: { user: null },
    });
  } catch (error) {
    console.error("deactivateUser: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user deactivation",
      data: { user: null },
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
  resetUserPassword,
  deactivateUser,
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
};
