// // const Organization = require("../models/Organization");
// // const User = require("../models/User");
// // const Document = require("../models/Document");

// // const getOrganizations = async (req, res) => {
// //   console.log("getOrganizations: Request received", { user: req.user });

// //   try {
// //     // No need for re-fetching user—use req.user (populated by authMiddleware or middleware)
// //     // If you need fresh data, fetch here, but skip permission check
// //     const user = await User.findById(req.user.id).populate("role");
// //     if (!user) {
// //       console.log("getOrganizations: User not found", { userId: req.user.id });
// //       return res.status(404).json({
// //         status: "error",
// //         statusCode: 404,
// //         message: "User not found",
// //         data: { token: null, user: null, organizations: null },
// //       });
// //     }

// //     const organizations = await Organization.find().select(
// //       "name organizationType createdAt"
// //     );
// //     console.log("getOrganizations: Found organizations", {
// //       count: organizations.length,
// //     });

// //     return res.status(200).json({
// //       status: "success",
// //       statusCode: 200,
// //       message: organizations.length
// //         ? "Organizations retrieved successfully"
// //         : "No organizations found",
// //       data: { token: null, user: null, organizations },
// //     });
// //   } catch (error) {
// //     console.error("getOrganizations: Error", error);
// //     return res.status(500).json({
// //       status: "error",
// //       statusCode: 500,
// //       message: "Server error during organization retrieval",
// //       data: { token: null, user: null, organizations: null },
// //     });
// //   }
// // };

// // const addOrganization = async (req, res) => {
// //   const { name, organizationType } = req.body;
// //   console.log("addOrganization: Request received", {
// //     name,
// //     organizationType,
// //     user: req.user,
// //   });

// //   try {
// //     const user = await User.findById(req.user.id).populate("role");
// //     if (
// //       !user ||
// //       !user.role.permissions.OrganizationManagement.createOrganizations
// //     ) {
// //       console.log("addOrganization: Unauthorized", { userId: req.user.id });
// //       return res.status(403).json({
// //         status: "error",
// //         statusCode: 403,
// //         message: "Unauthorized to create organizations",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     if (!name?.trim() || !organizationType?.trim()) {
// //       console.log("addOrganization: Missing required fields");
// //       return res.status(400).json({
// //         status: "error",
// //         statusCode: 400,
// //         message: "Organization name and type are required",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     const organization = new Organization({ name, organizationType });
// //     await organization.save();
// //     console.log("addOrganization: Organization saved", {
// //       organizationId: organization._id,
// //     });

// //     return res.status(201).json({
// //       status: "success",
// //       statusCode: 201,
// //       message: "Organization created successfully",
// //       data: {
// //         token: null,
// //         user: null,
// //         organization: {
// //           _id: organization._id,
// //           name: organization.name,
// //           organizationType: organization.organizationType,
// //           createdAt: organization.createdAt,
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("addOrganization: Error", error);
// //     if (error.code === 11000) {
// //       return res.status(400).json({
// //         status: "error",
// //         statusCode: 400,
// //         message: "Organization name already exists",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }
// //     return res.status(500).json({
// //       status: "error",
// //       statusCode: 500,
// //       message: "Server error during organization creation",
// //       data: { token: null, user: null, organization: null },
// //     });
// //   }
// // };

// // const deleteOrganization = async (req, res) => {
// //   const { id } = req.params;
// //   console.log("deleteOrganization: Request received", {
// //     orgId: id,
// //     userId: req.user.id,
// //     userRoleName: req.user.role?.name, // Add for debugging
// //   });

// //   try {
// //     // Ensure req.user exists
// //     if (!req.user) {
// //       return res.status(401).json({ success: false, message: "Unauthorized" });
// //     }

// //     // Check role by name (handles object structure)
// //     if (req.user.role?.name !== "superAdmin") {
// //       console.log("deleteOrganization: Unauthorized", {
// //         userId: req.user.id,
// //         userRoleName: req.user.role?.name || "undefined",
// //       });
// //       return res.status(403).json({
// //         success: false,
// //         message: "Super Admin access required",
// //       });
// //     }

// //     // Check if organization exists
// //     const organization = await Organization.findById(id);
// //     if (!organization) {
// //       console.log("deleteOrganization: Organization not found", { orgId: id });
// //       return res.status(404).json({
// //         success: false,
// //         message: "Organization not found",
// //       });
// //     }

// //     // Check for associated users or documents
// //     const userCount = await User.countDocuments({ organization: id });
// //     const documentCount = await Document.countDocuments({ organization: id });
// //     if (userCount > 0 || documentCount > 0) {
// //       console.log("deleteOrganization: Cannot delete, has associated data", {
// //         orgId: id,
// //         userCount,
// //         documentCount,
// //       });
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Cannot delete organization with associated users or documents",
// //       });
// //     }

// //     // Delete organization
// //     await Organization.findByIdAndDelete(id);

// //     console.log("deleteOrganization: Success", { orgId: id });
// //     return res.status(200).json({
// //       status: "success",
// //       statusCode: 200,
// //       message: "Organization deleted successfully",
// //       token: null,
// //       data: { user: null },
// //     });
// //   } catch (error) {
// //     console.error("deleteOrganization: Error", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during organization deletion",
// //       error: error.message,
// //     });
// //   }
// // };

// // const updateOrganization = async (req, res) => {
// //   const { id } = req.params;
// //   const { name, organizationType } = req.body;
// //   console.log("updateOrganization: Request received", {
// //     orgId: id,
// //     name,
// //     organizationType,
// //     userId: req.user.id,
// //   });

// //   try {
// //     // Check role
// //     if (req.user.role?.name !== "superAdmin") {
// //       console.log("updateOrganization: Unauthorized", { userId: req.user.id });
// //       return res.status(403).json({
// //         success: false,
// //         message: "Admin access required",
// //       });
// //     }

// //     // Check if organization exists
// //     const organization = await Organization.findById(id);
// //     if (!organization) {
// //       console.log("updateOrganization: Organization not found", { orgId: id });
// //       return res.status(404).json({
// //         success: false,
// //         message: "Organization not found",
// //       });
// //     }

// //     let updated = false;

// //     // Update name if provided
// //     if (name && name.trim()) {
// //       // Check for duplicate name
// //       const existingOrg = await Organization.findOne({
// //         name,
// //         _id: { $ne: id },
// //       });
// //       if (existingOrg) {
// //         console.log("updateOrganization: Organization name exists", { name });
// //         return res.status(400).json({
// //           success: false,
// //           message: "Organization name already exists",
// //         });
// //       }
// //       organization.name = name.trim();
// //       updated = true;
// //     }

// //     // Update organizationType if provided
// //     if (organizationType && organizationType.trim()) {
// //       organization.organizationType = organizationType.trim();
// //       updated = true;
// //     }

// //     // Validate input: at least one field must be provided
// //     if (!updated) {
// //       console.log("updateOrganization: No fields provided", {
// //         userId: req.user.id,
// //       });
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "At least one field (name or organizationType) is required for update",
// //       });
// //     }

// //     await organization.save();

// //     console.log("updateOrganization: Success", { orgId: id });
// //     return res.status(200).json({
// //       status: "success",
// //       statusCode: 200,
// //       message: "Organization updated successfully",
// //       token: null,
// //       data: {
// //         user: null,
// //         organization: {
// //           _id: organization._id,
// //           name: organization.name,
// //           organizationType: organization.organizationType,
// //           createdAt: organization.createdAt,
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("updateOrganization: Error", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during organization update",
// //       error: error.message,
// //     });
// //   }
// // };

// // const getOrganizationMetrics = async (req, res) => {
// //   console.log("getOrganizationMetrics: Request received", { user: req.user });

// //   try {
// //     if (!req.user || !req.user.id || !req.user.role) {
// //       console.log("getOrganizationMetrics: Invalid authentication data");
// //       return res.status(401).json({
// //         success: false,
// //         message: "Authentication required",
// //       });
// //     }

// //     if (req.user.role?.name !== "superAdmin") {
// //       console.log("getOrganizationMetrics: Unauthorized", {
// //         userId: req.user.id,
// //       });
// //       return res.status(403).json({
// //         success: false,
// //         message: "Only admins can view metrics",
// //       });
// //     }

// //     const totalOrganizations = await Organization.countDocuments();

// //     console.log("getOrganizationMetrics: Metrics retrieved", {
// //       totalOrganizations,
// //     });

// //     return res.status(200).json({
// //       status: "success",
// //       statusCode: 200,
// //       message: "Organization metrics retrieved successfully",
// //       token: null,
// //       data: {
// //         user: null,
// //         metrics: { totalOrganizations },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("getOrganizationMetrics: Error", error);
// //     const isProduction = process.env.NODE_ENV === "production";
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during metrics retrieval",
// //       error: isProduction ? undefined : error.message,
// //     });
// //   }
// // };

// // module.exports = {
// //   getOrganizations,
// //   addOrganization,
// //   deleteOrganization,
// //   updateOrganization,
// //   getOrganizationMetrics,
// // };

// const Organization = require("../models/Organization");
// const User = require("../models/User");
// const Document = require("../models/Document");
// const mongoose = require("mongoose");

// const getOrganizations = async (req, res) => {
//   console.log("getOrganizations: Request received", { user: req.user });

//   try {
//     // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("getOrganizations: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null, organizations: null },
//       });
//     }

//     const organizations = await Organization.find().select(
//       "name organizationType createdAt"
//     );
//     console.log("getOrganizations: Found organizations", {
//       count: organizations.length,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: organizations.length
//         ? "Organizations retrieved successfully"
//         : "No organizations found",
//       data: { token: null, user: null, organizations },
//     });
//   } catch (error) {
//     console.error("getOrganizations: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during organization retrieval",
//       data: { token: null, user: null, organizations: null },
//     });
//   }
// };

// const addOrganization = async (req, res) => {
//   const { name, organizationType } = req.body;
//   console.log("addOrganization: Request received", {
//     name,
//     organizationType,
//     user: req.user,
//   });

//   try {
//     // Check authentication (middleware handles OrganizationManagement.createOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("addOrganization: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     if (!name?.trim() || !organizationType?.trim()) {
//       console.log("addOrganization: Missing required fields");
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Organization name and type are required",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     const organization = new Organization({ name, organizationType });
//     await organization.save();
//     console.log("addOrganization: Organization saved", {
//       organizationId: organization._id,
//     });

//     return res.status(201).json({
//       status: "success",
//       statusCode: 201,
//       message: "Organization created successfully",
//       data: {
//         token: null,
//         user: null,
//         organization: {
//           _id: organization._id,
//           name: organization.name,
//           organizationType: organization.organizationType,
//           createdAt: organization.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("addOrganization: Error", error);
//     if (error.code === 11000) {
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Organization name already exists",
//         data: { token: null, user: null, organization: null },
//       });
//     }
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during organization creation",
//       data: { token: null, user: null, organization: null },
//     });
//   }
// };

// // const deleteOrganization = async (req, res) => {
// //   const { id } = req.params;
// //   console.log("deleteOrganization: Request received", {
// //     orgId: id,
// //     userId: req.user.id,
// //   });

// //   try {
// //     // Check authentication (middleware handles OrganizationManagement.deleteOrganizations permission)
// //     if (!req.user || !req.user.id) {
// //       console.log("deleteOrganization: Invalid authentication data");
// //       return res.status(401).json({
// //         status: "error",
// //         statusCode: 401,
// //         message: "Authentication required",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     // Validate ID
// //     if (!mongoose.Types.ObjectId.isValid(id)) {
// //       console.log("deleteOrganization: Invalid organization ID", { id });
// //       return res.status(400).json({
// //         status: "error",
// //         statusCode: 400,
// //         message: "Invalid organization ID",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     // Check if organization exists
// //     const organization = await Organization.findById(id);
// //     if (!organization) {
// //       console.log("deleteOrganization: Organization not found", { orgId: id });
// //       return res.status(404).json({
// //         status: "error",
// //         statusCode: 404,
// //         message: "Organization not found",
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     // Check for associated users or documents
// //     const userCount = await User.countDocuments({ organization: id });
// //     const documentCount = await Document.countDocuments({ organization: id });
// //     if (userCount > 0 || documentCount > 0) {
// //       console.log("deleteOrganization: Cannot delete, has associated data", {
// //         orgId: id,
// //         userCount,
// //         documentCount,
// //         associatedUsers:
// //           userCount > 0
// //             ? await User.find({ organization: id }).select("_id email")
// //             : [],
// //         associatedDocuments:
// //           documentCount > 0
// //             ? await Document.find({ organization: id }).select("_id title")
// //             : [],
// //       });
// //       return res.status(400).json({
// //         status: "error",
// //         statusCode: 400,
// //         message: `Cannot delete organization with ${userCount} associated user(s) and ${documentCount} associated document(s)`,
// //         data: { token: null, user: null, organization: null },
// //       });
// //     }

// //     // Delete organization
// //     await Organization.findByIdAndDelete(id);

// //     console.log("deleteOrganization: Success", { orgId: id });
// //     return res.status(200).json({
// //       status: "success",
// //       statusCode: 200,
// //       message: "Organization deleted successfully",
// //       data: { token: null, user: null, organization: null },
// //     });
// //   } catch (error) {
// //     console.error("deleteOrganization: Error", {
// //       message: error.message,
// //       stack: error.stack,
// //     });
// //     return res.status(500).json({
// //       status: "error",
// //       statusCode: 500,
// //       message: "Server error during organization deletion",
// //       data: { token: null, user: null, organization: null },
// //     });
// //   }
// // };
// const deleteOrganization = async (req, res) => {
//   const { id } = req.params;
//   console.log("deleteOrganization: Request received", {
//     orgId: id,
//     userId: req.user.id,
//   });

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Check authentication (middleware handles OrganizationManagement.deleteOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("deleteOrganization: Invalid authentication data");
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("deleteOrganization: Invalid organization ID", { id });
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid organization ID",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     // Check if organization exists
//     const organization = await Organization.findById(id).session(session);
//     if (!organization) {
//       console.log("deleteOrganization: Organization not found", { orgId: id });
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     // Get associated users and documents for logging
//     const associatedUsers = await User.find({ organization: id })
//       .select("_id email")
//       .session(session);
//     const associatedDocuments = await Document.find({ organization: id })
//       .select("_id title")
//       .session(session);

//     // Delete associated users
//     const userDeleteResult = await User.deleteMany(
//       { organization: id },
//       { session }
//     );
//     const userCount = userDeleteResult.deletedCount;

//     // Delete associated documents
//     const documentDeleteResult = await Document.deleteMany(
//       { organization: id },
//       { session }
//     );
//     const documentCount = documentDeleteResult.deletedCount;

//     // Delete the organization
//     await Organization.findByIdAndDelete(id, { session });

//     // Log the deletion details
//     console.log("deleteOrganization: Success", {
//       orgId: id,
//       deletedUsers: userCount,
//       deletedDocuments: documentCount,
//       associatedUsers: associatedUsers.map((user) => ({
//         _id: user._id,
//         email: user.email,
//       })),
//       associatedDocuments: associatedDocuments.map((doc) => ({
//         _id: doc._id,
//         title: doc.title,
//       })),
//     });

//     // Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: `Organization deleted successfully along with ${userCount} user(s) and ${documentCount} document(s)`,
//       data: { token: null, user: null, organization: null },
//     });
//   } catch (error) {
//     console.error("deleteOrganization: Error", {
//       message: error.message,
//       stack: error.stack,
//     });
//     await session.abortTransaction();
//     session.endSession();
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during organization deletion",
//       data: { token: null, user: null, organization: null },
//     });
//   }
// };

// const updateOrganization = async (req, res) => {
//   const { id } = req.params;
//   const { name, organizationType } = req.body;
//   console.log("updateOrganization: Request received", {
//     orgId: id,
//     name,
//     organizationType,
//     userId: req.user.id,
//   });

//   try {
//     // Check authentication (middleware handles OrganizationManagement.editOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("updateOrganization: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     // Validate ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("updateOrganization: Invalid organization ID", { id });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid organization ID",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     // Check if organization exists
//     const organization = await Organization.findById(id);
//     if (!organization) {
//       console.log("updateOrganization: Organization not found", { orgId: id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     let updated = false;

//     // Update name if provided
//     if (name && name.trim()) {
//       // Check for duplicate name
//       const existingOrg = await Organization.findOne({
//         name,
//         _id: { $ne: id },
//       });
//       if (existingOrg) {
//         console.log("updateOrganization: Organization name exists", { name });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Organization name already exists",
//           data: { token: null, user: null, organization: null },
//         });
//       }
//       organization.name = name.trim();
//       updated = true;
//     }

//     // Update organizationType if provided
//     if (organizationType && organizationType.trim()) {
//       organization.organizationType = organizationType.trim();
//       updated = true;
//     }

//     // Validate input: at least one field must be provided
//     if (!updated) {
//       console.log("updateOrganization: No fields provided", {
//         userId: req.user.id,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message:
//           "At least one field (name or organizationType) is required for update",
//         data: { token: null, user: null, organization: null },
//       });
//     }

//     await organization.save();

//     console.log("updateOrganization: Success", { orgId: id });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Organization updated successfully",
//       data: {
//         token: null,
//         user: null,
//         organization: {
//           _id: organization._id,
//           name: organization.name,
//           organizationType: organization.organizationType,
//           createdAt: organization.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("updateOrganization: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during organization update",
//       data: { token: null, user: null, organization: null },
//     });
//   }
// };

// const getOrganizationMetrics = async (req, res) => {
//   console.log("getOrganizationMetrics: Request received", { user: req.user });

//   try {
//     // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("getOrganizationMetrics: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { token: null, user: null, metrics: null },
//       });
//     }

//     const totalOrganizations = await Organization.countDocuments();

//     console.log("getOrganizationMetrics: Metrics retrieved", {
//       totalOrganizations,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Organization metrics retrieved successfully",
//       data: {
//         token: null,
//         user: null,
//         metrics: { totalOrganizations },
//       },
//     });
//   } catch (error) {
//     console.error("getOrganizationMetrics: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during metrics retrieval",
//       data: { token: null, user: null, metrics: null },
//     });
//   }
// };

// module.exports = {
//   getOrganizations,
//   addOrganization,
//   deleteOrganization,
//   updateOrganization,
//   getOrganizationMetrics,
// };

const Organization = require("../models/Organization");
const User = require("../models/User");
const Document = require("../models/Document");
const mongoose = require("mongoose");

const getOrganizations = async (req, res) => {
  console.log("getOrganizations: Request received", { user: req.user });

  try {
    // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("getOrganizations: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organizations: null },
      });
    }

    const organizations = await Organization.find().select(
      "name organizationType createdAt"
    );
    console.log("getOrganizations: Found organizations", {
      count: organizations.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: organizations.length
        ? "Organizations retrieved successfully"
        : "No organizations found",
      data: { user: null, organizations },
    });
  } catch (error) {
    console.error("getOrganizations: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization retrieval",
      data: { user: null, organizations: null },
    });
  }
};

const addOrganization = async (req, res) => {
  const { name, organizationType } = req.body;
  console.log("addOrganization: Request received", {
    name,
    organizationType,
    user: req.user,
  });

  try {
    // Check authentication (middleware handles OrganizationManagement.createOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("addOrganization: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    if (!name?.trim() || !organizationType?.trim()) {
      console.log("addOrganization: Missing required fields");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Organization name and type are required",
        data: { user: null, organization: null },
      });
    }

    const organization = new Organization({ name, organizationType });
    await organization.save();
    console.log("addOrganization: Organization saved", {
      organizationId: organization._id,
    });

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Organization created successfully",
      data: {
        user: null,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType,
          createdAt: organization.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("addOrganization: Error", error);
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Organization name already exists",
        data: { user: null, organization: null },
      });
    }
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization creation",
      data: { user: null, organization: null },
    });
  }
};

const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  console.log("deleteOrganization: Request received", {
    orgId: id,
    userId: req.user.id,
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check authentication (middleware handles OrganizationManagement.deleteOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("deleteOrganization: Invalid authentication data");
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("deleteOrganization: Invalid organization ID", { id });
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid organization ID",
        data: { user: null, organization: null },
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(id).session(session);
    if (!organization) {
      console.log("deleteOrganization: Organization not found", { orgId: id });
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, organization: null },
      });
    }

    // Get associated users and documents for logging
    const associatedUsers = await User.find({ organization: id })
      .select("_id email")
      .session(session);
    const associatedDocuments = await Document.find({ organization: id })
      .select("_id title")
      .session(session);

    // Delete associated users
    const userDeleteResult = await User.deleteMany(
      { organization: id },
      { session }
    );
    const userCount = userDeleteResult.deletedCount;

    // Delete associated documents
    const documentDeleteResult = await Document.deleteMany(
      { organization: id },
      { session }
    );
    const documentCount = documentDeleteResult.deletedCount;

    // Delete the organization
    await Organization.findByIdAndDelete(id, { session });

    // Log the deletion details
    console.log("deleteOrganization: Success", {
      orgId: id,
      deletedUsers: userCount,
      deletedDocuments: documentCount,
      associatedUsers: associatedUsers.map((user) => ({
        _id: user._id,
        email: user.email,
      })),
      associatedDocuments: associatedDocuments.map((doc) => ({
        _id: doc._id,
        title: doc.title,
      })),
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Organization deleted successfully along with ${userCount} user(s) and ${documentCount} document(s)`,
      data: { user: null, organization: null },
    });
  } catch (error) {
    console.error("deleteOrganization: Error", {
      message: error.message,
      stack: error.stack,
    });
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization deletion",
      data: { user: null, organization: null },
    });
  }
};

const updateOrganization = async (req, res) => {
  const { id } = req.params;
  const { name, organizationType } = req.body;
  console.log("updateOrganization: Request received", {
    orgId: id,
    name,
    organizationType,
    userId: req.user.id,
  });

  try {
    // Check authentication (middleware handles OrganizationManagement.editOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("updateOrganization: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("updateOrganization: Invalid organization ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid organization ID",
        data: { user: null, organization: null },
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      console.log("updateOrganization: Organization not found", { orgId: id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, organization: null },
      });
    }

    let updated = false;

    // Update name if provided
    if (name && name.trim()) {
      // Check for duplicate name
      const existingOrg = await Organization.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingOrg) {
        console.log("updateOrganization: Organization name exists", { name });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Organization name already exists",
          data: { user: null, organization: null },
        });
      }
      organization.name = name.trim();
      updated = true;
    }

    // Update organizationType if provided
    if (organizationType && organizationType.trim()) {
      organization.organizationType = organizationType.trim();
      updated = true;
    }

    // Validate input: at least one field must be provided
    if (!updated) {
      console.log("updateOrganization: No fields provided", {
        userId: req.user.id,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "At least one field (name or organizationType) is required for update",
        data: { user: null, organization: null },
      });
    }

    await organization.save();

    console.log("updateOrganization: Success", { orgId: id });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization updated successfully",
      data: {
        user: null,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType,
          createdAt: organization.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("updateOrganization: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization update",
      data: { user: null, organization: null },
    });
  }
};

const getOrganizationMetrics = async (req, res) => {
  console.log("getOrganizationMetrics: Request received", { user: req.user });

  try {
    // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("getOrganizationMetrics: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, metrics: null },
      });
    }

    const totalOrganizations = await Organization.countDocuments();

    console.log("getOrganizationMetrics: Metrics retrieved", {
      totalOrganizations,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization metrics retrieved successfully",
      data: {
        user: null,
        metrics: { totalOrganizations },
      },
    });
  } catch (error) {
    console.error("getOrganizationMetrics: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during metrics retrieval",
      data: { user: null, metrics: null },
    });
  }
};

module.exports = {
  getOrganizations,
  addOrganization,
  deleteOrganization,
  updateOrganization,
  getOrganizationMetrics,
};
