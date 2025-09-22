// const Document = require("../models/Document");
// const Organization = require("../models/Organization");
// const User = require("../models/User");
// const { cloudinary } = require("../config/cloudinaryStorage");
// const fs = require("fs");
// const mongoose = require("mongoose");
// const Notification = require("../models/Notification");
// const Email = require("../utils/email");
// const AuditLog = require("../models/AuditLog");
// const https = require("https");

// const getNotifications = async (req, res) => {
//   const { orgId } = req.params;
//   console.log("getNotifications: Request received", { orgId, user: req.user });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user) {
//       console.log("getNotifications: User not found", { userId: req.user.id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { token: null, user: null, notifications: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("getNotifications: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, notifications: null },
//       });
//     }

//     const notifications = await Notification.find({
//       $or: [{ user: req.user.id }, { organization: orgId }],
//     })
//       .sort({ createdAt: -1 })
//       .populate("user", "fullName email")
//       .populate("organization", "name");

//     console.log("getNotifications: Notifications retrieved", {
//       count: notifications.length,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: notifications.length
//         ? "Notifications retrieved successfully"
//         : "No notifications found",
//       data: {
//         token: null,
//         user: null,
//         notifications,
//       },
//     });
//   } catch (error) {
//     console.error("getNotifications: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during notifications retrieval",
//       data: { token: null, user: null, notifications: null },
//     });
//   }
// };

// const getDocuments = async (req, res) => {
//   const { orgId } = req.params;
//   console.log("getDocuments: Request received", { orgId, user: req.user });

//   try {
//     // Skip re-fetch if middleware populates req.user fully; otherwise, fetch minimally
//     const user = await User.findById(req.user.id)
//       .select("organization")
//       .populate("role"); // Only select needed fields

//     if (!user) {
//       console.log("getDocuments: User not found", { userId: req.user.id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { token: null, user: null, documents: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("getDocuments: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, documents: null },
//       });
//     }

//     // Removed organization check to allow viewing documents in any organization
//     // if (user.role?.name !== "superAdmin" && user.organization?.toString() !== orgId) {
//     //   console.log(
//     //     "getDocuments: User not in organization",
//     //     {
//     //       userId: req.user.id,
//     //       orgId,
//     //       userOrg: user.organization ? user.organization.toString() : "null/missing",
//     //     }
//     //   );
//     //   return res.status(403).json({
//     //     status: "error",
//     //     statusCode: 403,
//     //     message: "Unauthorized to view documents in this organization",
//     //     data: { token: null, user: null, documents: null },
//     //   });
//     // }

//     const documents = await Document.find({ organization: orgId }).select(
//       "name documentType createdAt isApproved approvedBy startDate expiryDate"
//     );
//     console.log("getDocuments: Found documents", { count: documents.length });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: documents.length
//         ? "Documents retrieved successfully"
//         : "No documents found",
//       data: {
//         token: null,
//         user: null,
//         documents,
//       },
//     });
//   } catch (error) {
//     console.error("getDocuments: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document retrieval",
//       data: { token: null, user: null, documents: null },
//     });
//   }
// };
// const uploadDocument = async (req, res) => {
//   const { orgId } = req.params;
//   const { documentName, documentType, startDate, expiryDate } = req.body;
//   const file = req.file;

//   console.log("uploadDocument: Full req.body", req.body);
//   console.log("uploadDocument: Full req.file", req.file);
//   console.log("uploadDocument: Request received", {
//     orgId,
//     documentName,
//     documentType,
//     startDate,
//     expiryDate,
//     file: file?.originalname,
//     user: req.user,
//   });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.uploadDocuments) {
//       console.log("uploadDocument: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to upload documents",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (!file) {
//       console.log("uploadDocument: No file uploaded");
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "PDF file is required",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (!fs.existsSync(file.path)) {
//       console.log("uploadDocument: Temporary file not found", {
//         path: file.path,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Temporary file not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("uploadDocument: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (
//       user.role.name !== "superAdmin" &&
//       user.organization.toString() !== orgId
//     ) {
//       console.log("uploadDocument: User not in organization", {
//         userId: req.user.id,
//         orgId,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to upload documents to this organization",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (!documentName?.trim()) {
//       console.log("uploadDocument: Missing or empty document name", {
//         documentName,
//       });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Document name is required",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     let parsedStartDate, parsedExpiryDate;
//     if (startDate) {
//       parsedStartDate = new Date(startDate);
//       if (isNaN(parsedStartDate)) {
//         console.log("uploadDocument: Invalid start date", { startDate });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Invalid start date format",
//           data: { token: null, user: null, document: null },
//         });
//       }
//     }
//     if (expiryDate) {
//       parsedExpiryDate = new Date(expiryDate);
//       if (isNaN(parsedExpiryDate)) {
//         console.log("uploadDocument: Invalid expiry date", { expiryDate });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Invalid expiry date format",
//           data: { token: null, user: null, document: null },
//         });
//       }
//       if (startDate && parsedExpiryDate <= parsedStartDate) {
//         console.log("uploadDocument: Expiry date must be after start date", {
//           startDate,
//           expiryDate,
//         });
//         return res.status(400).json({
//           status: "error",
//           statusCode: 400,
//           message: "Expiry date must be after start date",
//           data: { token: null, user: null, document: null },
//         });
//       }
//     }

//     const uploadResult = await cloudinary.uploader.upload(file.path, {
//       folder: orgId,
//       public_id: documentName,
//       resource_type: "raw",
//       upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
//     });

//     const document = new Document({
//       name: documentName,
//       fileUrl: uploadResult.secure_url,
//       googleDriveFileId: uploadResult.public_id,
//       organization: orgId,
//       documentType: documentType || "Other",
//       uploadedBy: req.user.id,
//       isApproved: false,
//       approvedBy: null,
//       startDate: parsedStartDate || null,
//       expiryDate: parsedExpiryDate || null,
//     });

//     await document.save();

//     console.log("uploadDocument: Document saved", {
//       documentId: document._id,
//       organization: document.organization,
//       cloudinaryPublicId: uploadResult.public_id,
//     });

//     const auditLog = new AuditLog({
//       user: req.user.id,
//       action: "document_upload",
//       resource: "Document",
//       resourceId: document._id,
//       details: { documentName: document.name, organization: orgId },
//     });
//     await auditLog.save();
//     console.log("uploadDocument: Audit log created", {
//       auditLogId: auditLog._id,
//     });

//     const notification = new Notification({
//       user: req.user.id,
//       organization: orgId,
//       type: "document_upload",
//       message: `New document "${document.name}" uploaded by ${user.fullName}`,
//       metadata: { documentId: document._id },
//     });
//     await notification.save();
//     console.log("uploadDocument: Notification created", {
//       notificationId: notification._id,
//     });

//     try {
//       const email = new Email(
//         user,
//         `https://your-app-url.com/documents/${orgId}`,
//         null,
//         {
//           documentName: document.name,
//           uploaderName: user.fullName,
//           uploaderEmail: user.email,
//           organizationName: organization.name,
//           uploadTime: document.createdAt.toLocaleString(),
//           documentsUrl: `https://your-app-url.com/documents/${orgId}`,
//           startDate: document.startDate
//             ? document.startDate.toLocaleDateString()
//             : "N/A",
//           expiryDate: document.expiryDate
//             ? document.expiryDate.toLocaleDateString()
//             : "N/A",
//         }
//       );
//       await email.sendDocumentUpload();
//       console.log("uploadDocument: Notification email sent", {
//         to: user.email,
//       });
//     } catch (emailError) {
//       console.error(
//         "uploadDocument: Failed to send notification email",
//         emailError
//       );
//     }

//     try {
//       fs.unlinkSync(file.path);
//       console.log("uploadDocument: Temporary file deleted", {
//         path: file.path,
//       });
//     } catch (cleanupError) {
//       console.error(
//         "uploadDocument: Failed to delete temporary file",
//         cleanupError
//       );
//     }

//     return res.status(201).json({
//       status: "success",
//       statusCode: 201,
//       message: "Document uploaded successfully",
//       data: {
//         token: null,
//         user: null,
//         document: {
//           _id: document._id,
//           name: document.name,
//           documentType: document.documentType,
//           fileUrl: document.fileUrl,
//           organization: document.organization,
//           uploadedBy: document.uploadedBy,
//           isApproved: document.isApproved,
//           approvedBy: document.approvedBy,
//           startDate: document.startDate,
//           expiryDate: document.expiryDate,
//           createdAt: document.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("uploadDocument: Error", error);

//     if (file && file.path && fs.existsSync(file.path)) {
//       try {
//         fs.unlinkSync(file.path);
//         console.log("uploadDocument: Temporary file deleted on error", {
//           path: file.path,
//         });
//       } catch (cleanupError) {
//         console.error(
//           "uploadDocument: Failed to delete temporary file on error",
//           cleanupError
//         );
//       }
//     }

//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document upload",
//       data: { token: null, user: null, document: null },
//     });
//   }
// };

// const downloadDocument = async (req, res) => {
//   const { id } = req.params;
//   console.log("downloadDocument: Request received", { id, user: req.user });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
//       console.log("downloadDocument: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const document = await Document.findById(id);
//     if (!document) {
//       console.log("downloadDocument: Document not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Document not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const organization = await Organization.findById(document.organization);
//     if (!organization) {
//       console.log("downloadDocument: Organization not found", {
//         orgId: document.organization,
//       });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (
//       user.role.name !== "superAdmin" &&
//       user.organization.toString() !== document.organization.toString()
//     ) {
//       console.log("downloadDocument: User not in organization", {
//         userId: req.user.id,
//         orgId: document.organization,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents in this organization",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     document.accessCount++;
//     await document.save();

//     const fileUrl = document.fileUrl;
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${document.name}.pdf"`
//     );

//     https
//       .get(fileUrl, (stream) => {
//         stream.pipe(res);
//         console.log("downloadDocument: File streaming started", {
//           fileUrl: document.fileUrl,
//         });
//       })
//       .on("error", (err) => {
//         console.error("downloadDocument: Streaming error", err);
//         return res.status(500).json({
//           status: "error",
//           statusCode: 500,
//           message: "Error downloading file",
//           data: { token: null, user: null, document: null },
//         });
//       });
//   } catch (error) {
//     console.error("downloadDocument: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document download",
//       data: { token: null, user: null, document: null },
//     });
//   }
// };

// const deleteDocument = async (req, res) => {
//   const { id } = req.params;
//   console.log("deleteDocument: Request received", { id, user: req.user });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.deleteDocuments) {
//       console.log("deleteDocument: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to delete documents",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const document = await Document.findById(id);
//     if (!document) {
//       console.log("deleteDocument: Document not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Document not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (
//       user.role.name !== "admin" &&
//       user.role.name !== "superAdmin" &&
//       document.uploadedBy.toString() !== req.user.id
//     ) {
//       console.log("deleteDocument: Unauthorized", {
//         userId: req.user.id,
//         documentUploader: document.uploadedBy,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to delete this document",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (document.googleDriveFileId) {
//       await cloudinary.uploader.destroy(document.googleDriveFileId, {
//         resource_type: "raw",
//       });
//       console.log("deleteDocument: File deleted from Cloudinary", {
//         publicId: document.googleDriveFileId,
//       });
//     } else {
//       console.log("deleteDocument: No Cloudinary public_id found", {
//         documentId: id,
//       });
//     }

//     await Document.findByIdAndDelete(id);
//     console.log("deleteDocument: Document deleted from MongoDB", {
//       documentId: id,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Document deleted successfully",
//       data: { token: null, user: null, document: null },
//     });
//   } catch (error) {
//     console.error("deleteDocument: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document deletion",
//       data: { token: null, user: null, document: null },
//     });
//   }
// };

// const getDocumentsByUser = async (req, res) => {
//   const { userId } = req.params;
//   console.log("getDocumentsByUser: Request received", {
//     userId,
//     user: req.user,
//   });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
//       console.log("getDocumentsByUser: Unauthorized", {
//         userId: req.user.id,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents",
//         data: { token: null, user: null, documents: null },
//       });
//     }

//     if (
//       user.role.name !== "admin" &&
//       user.role.name !== "superAdmin" &&
//       req.user.id !== userId
//     ) {
//       console.log("getDocumentsByUser: Unauthorized", {
//         userId,
//         requester: req.user.id,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view these documents",
//         data: { token: null, user: null, documents: null },
//       });
//     }

//     const documents = await Document.find({ uploadedBy: userId }).select(
//       "name documentType organization createdAt"
//     );
//     console.log("getDocumentsByUser: Found documents", {
//       count: documents.length,
//     });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: documents.length
//         ? "Documents retrieved successfully"
//         : "No documents found for this user",
//       data: {
//         token: null,
//         user: null,
//         documents,
//       },
//     });
//   } catch (error) {
//     console.error("getDocumentsByUser: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during user document retrieval",
//       data: { token: null, user: null, documents: null },
//     });
//   }
// };

// const getDocumentMetrics = async (req, res) => {
//   const { orgId } = req.params;
//   const userId = req.user.id;
//   console.log("getDocumentMetrics: Request received", { orgId, userId });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
//       console.log("getDocumentMetrics: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents",
//         data: { token: null, user: null, metrics: null },
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(orgId)) {
//       console.log("getDocumentMetrics: Invalid orgId", { orgId });
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid organization ID",
//         data: { token: null, user: null, metrics: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("getDocumentMetrics: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, metrics: null },
//       });
//     }

//     if (
//       user.role.name !== "superAdmin" &&
//       user.organization.toString() !== orgId
//     ) {
//       console.log("getDocumentMetrics: User not in organization", {
//         userId: req.user.id,
//         orgId,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents in this organization",
//         data: { token: null, user: null, metrics: null },
//       });
//     }

//     const mostPopular = await Document.find({ organization: orgId })
//       .sort({ accessCount: -1 })
//       .limit(5)
//       .select("name documentType accessCount uploadedBy createdAt");

//     const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//     const newReports = await Document.find({
//       organization: orgId,
//       createdAt: { $gte: sevenDaysAgo },
//     }).select("name documentType uploadedBy createdAt");

//     const accessedReports = await Document.find({
//       organization: orgId,
//       accessCount: { $gt: 0 },
//     })
//       .sort({ accessCount: -1 })
//       .limit(5)
//       .select("name documentType accessCount uploadedBy createdAt");

//     const othersReports = await Document.find({
//       organization: orgId,
//       uploadedBy: { $ne: userId },
//     }).select("name documentType uploadedBy createdAt");

//     console.log("getDocumentMetrics: Success", { orgId });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Document metrics retrieved successfully",
//       data: {
//         token: null,
//         user: null,
//         metrics: {
//           mostPopular,
//           newReports,
//           accessedReports,
//           othersReports,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("getDocumentMetrics: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document metrics retrieval",
//       data: { token: null, user: null, metrics: null },
//     });
//   }
// };

// const updateDocument = async (req, res) => {
//   const { id } = req.params;
//   const { name, documentType } = req.body;
//   console.log("updateDocument: Request received", {
//     id,
//     name,
//     documentType,
//     user: req.user,
//   });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.editDocuments) {
//       console.log("updateDocument: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to update documents",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const document = await Document.findById(id);
//     if (!document) {
//       console.log("updateDocument: Document not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Document not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (
//       user.role.name !== "admin" &&
//       user.role.name !== "superAdmin" &&
//       document.uploadedBy.toString() !== req.user.id
//     ) {
//       console.log("updateDocument: Unauthorized", {
//         userId: req.user.id,
//         documentUploader: document.uploadedBy,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to update this document",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     if (name) document.name = name;
//     if (documentType) document.documentType = documentType;

//     await document.save();
//     console.log("updateDocument: Document updated", { documentId: id });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Document updated successfully",
//       data: {
//         token: null,
//         user: null,
//         document: {
//           _id: document._id,
//           name: document.name,
//           documentType: document.documentType,
//           fileUrl: document.fileUrl,
//           organization: document.organization,
//           uploadedBy: document.uploadedBy,
//           createdAt: document.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("updateDocument: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document update",
//       data: { token: null, user: null, document: null },
//     });
//   }
// };

// const approveDocument = async (req, res) => {
//   const { id } = req.params;
//   console.log("approveDocument: Request received", { id, user: req.user });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.approveDocuments) {
//       console.log("approveDocument: Unauthorized", { userId: req.user.id });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to approve documents",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     const document = await Document.findById(id);
//     if (!document) {
//       console.log("approveDocument: Document not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Document not found",
//         data: { token: null, user: null, document: null },
//       });
//     }

//     document.isApproved = true;
//     document.approvedBy = req.user.id;
//     await document.save();

//     console.log("approveDocument: Document approved", { documentId: id });
//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: "Document approved successfully",
//       data: {
//         token: null,
//         user: null,
//         document: {
//           _id: document._id,
//           name: document.name,
//           documentType: document.documentType,
//           fileUrl: document.fileUrl,
//           organization: document.organization,
//           uploadedBy: document.uploadedBy,
//           isApproved: document.isApproved,
//           approvedBy: document.approvedBy,
//           createdAt: document.createdAt,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("approveDocument: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document approval",
//       data: { token: null, user: null, document: null },
//     });
//   }
// };

// const getContractExpiryAlerts = async (req, res) => {
//   const { orgId } = req.params;
//   console.log("getContractExpiryAlerts: Request received", {
//     orgId,
//     user: req.user,
//   });

//   try {
//     const user = await User.findById(req.user.id).populate("role");
//     if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
//       console.log("getContractExpiryAlerts: Unauthorized", {
//         userId: req.user.id,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view documents",
//         data: { token: null, user: null, alerts: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("getContractExpiryAlerts: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { token: null, user: null, alerts: null },
//       });
//     }

//     if (
//       user.role.name !== "superAdmin" &&
//       user.organization.toString() !== orgId
//     ) {
//       console.log("getContractExpiryAlerts: User not in organization", {
//         userId: req.user.id,
//         orgId,
//       });
//       return res.status(403).json({
//         status: "error",
//         statusCode: 403,
//         message: "Unauthorized to view alerts in this organization",
//         data: { token: null, user: null, alerts: null },
//       });
//     }

//     const now = new Date();
//     const alerts = await Document.aggregate([
//       {
//         $match: {
//           organization: new mongoose.Types.ObjectId(orgId),
//           expiryDate: { $gte: now },
//         },
//       },
//       {
//         $addFields: {
//           daysToExpiry: {
//             $divide: [{ $subtract: ["$expiryDate", now] }, 1000 * 60 * 60 * 24],
//           },
//         },
//       },
//       {
//         $match: {
//           $expr: {
//             $lte: [
//               "$daysToExpiry",
//               "$notificationPreferences.contractExpiryDays",
//             ],
//           },
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           documentType: 1,
//           expiryDate: 1,
//           uploadedBy: 1,
//         },
//       },
//     ]);

//     console.log("getContractExpiryAlerts: Alerts retrieved", {
//       count: alerts.length,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: alerts.length
//         ? "Contract expiry alerts retrieved successfully"
//         : "No contracts expiring soon",
//       data: {
//         token: null,
//         user: null,
//         alerts,
//       },
//     });
//   } catch (error) {
//     console.error("getContractExpiryAlerts: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during contract expiry alerts retrieval",
//       data: { token: null, user: null, alerts: null },
//     });
//   }
// };

// module.exports = {
//   getNotifications,
//   getContractExpiryAlerts,
//   getDocuments,
//   uploadDocument,
//   downloadDocument,
//   deleteDocument,
//   updateDocument,
//   getDocumentsByUser,
//   getDocumentMetrics,
//   approveDocument,
// };

const Document = require("../models/Document");
const Organization = require("../models/Organization");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinaryStorage");
const fs = require("fs");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const Email = require("../utils/email");
const AuditLog = require("../models/AuditLog");
const https = require("https");

const getNotifications = async (req, res) => {
  const { orgId } = req.params;
  console.log("getNotifications: Request received", { orgId, user: req.user });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user) {
      console.log("getNotifications: User not found", { userId: req.user.id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null, notifications: null },
      });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getNotifications: Organization not found", { orgId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, notifications: null },
      });
    }

    const notifications = await Notification.find({
      $or: [{ user: req.user.id }, { organization: orgId }],
    })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email")
      .populate("organization", "name");

    console.log("getNotifications: Notifications retrieved", {
      count: notifications.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: notifications.length
        ? "Notifications retrieved successfully"
        : "No notifications found",
      data: {
        user: null,
        notifications,
      },
    });
  } catch (error) {
    console.error("getNotifications: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during notifications retrieval",
      data: { user: null, notifications: null },
    });
  }
};
const getDocuments = async (req, res) => {
  const { orgId } = req.params;
  console.log("getDocuments: Request received", { orgId, user: req.user });

  try {
    // Skip re-fetch if middleware populates req.user fully; otherwise, fetch minimally
    const user = await User.findById(req.user.id)
      .select("organization")
      .populate("role"); // Only select needed fields

    if (!user) {
      console.log("getDocuments: User not found", { userId: req.user.id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        data: { user: null, documents: null },
      });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getDocuments: Organization not found", { orgId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, documents: null },
      });
    }

    // Removed organization check to allow viewing documents in any organization
    // if (user.role?.name !== "superAdmin" && user.organization?.toString() !== orgId) {
    //   console.log(
    //     "getDocuments: User not in organization",
    //     {
    //       userId: req.user.id,
    //       orgId,
    //       userOrg: user.organization ? user.organization.toString() : "null/missing",
    //     }
    //   );
    //   return res.status(403).json({
    //     status: "error",
    //     statusCode: 403,
    //     message: "Unauthorized to view documents in this organization",
    //     data: { user: null, documents: null },
    //   });
    // }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid page or limit parameters",
        data: { user: null, documents: null },
      });
    }

    const query = { organization: orgId };

    const documents = await Document.find(query)
      .select("name documentType createdAt isApproved approvedBy startDate expiryDate")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Document.countDocuments(query);

    console.log("getDocuments: Found documents", {
      count: documents.length,
      total,
      page: pageNum,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: documents.length
        ? "Documents retrieved successfully"
        : "No documents found",
      data: {
        user: null,
        documents,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getDocuments: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document retrieval",
      data: { user: null, documents: null },
    });
  }
};
// const getDocuments = async (req, res) => {
//   const { orgId } = req.params;
//   console.log("getDocuments: Request received", { orgId, user: req.user });

//   try {
//     // Skip re-fetch if middleware populates req.user fully; otherwise, fetch minimally
//     const user = await User.findById(req.user.id)
//       .select("organization")
//       .populate("role"); // Only select needed fields

//     if (!user) {
//       console.log("getDocuments: User not found", { userId: req.user.id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "User not found",
//         data: { user: null, documents: null },
//       });
//     }

//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("getDocuments: Organization not found", { orgId });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Organization not found",
//         data: { user: null, documents: null },
//       });
//     }

//     // Removed organization check to allow viewing documents in any organization
//     // if (user.role?.name !== "superAdmin" && user.organization?.toString() !== orgId) {
//     //   console.log(
//     //     "getDocuments: User not in organization",
//     //     {
//     //       userId: req.user.id,
//     //       orgId,
//     //       userOrg: user.organization ? user.organization.toString() : "null/missing",
//     //     }
//     //   );
//     //   return res.status(403).json({
//     //     status: "error",
//     //     statusCode: 403,
//     //     message: "Unauthorized to view documents in this organization",
//     //     data: { user: null, documents: null },
//     //   });
//     // }

//     const documents = await Document.find({ organization: orgId }).select(
//       "name documentType createdAt isApproved approvedBy startDate expiryDate"
//     );
//     console.log("getDocuments: Found documents", { count: documents.length });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: documents.length
//         ? "Documents retrieved successfully"
//         : "No documents found",
//       data: {
//         user: null,
//         documents,
//       },
//     });
//   } catch (error) {
//     console.error("getDocuments: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document retrieval",
//       data: { user: null, documents: null },
//     });
//   }
// };

const uploadDocument = async (req, res) => {
  const { orgId } = req.params;
  const { documentName, documentType, startDate, expiryDate } = req.body;
  const file = req.file;

  console.log("uploadDocument: Full req.body", req.body);
  console.log("uploadDocument: Full req.file", req.file);
  console.log("uploadDocument: Request received", {
    orgId,
    documentName,
    documentType,
    startDate,
    expiryDate,
    file: file?.originalname,
    user: req.user,
  });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.uploadDocuments) {
      console.log("uploadDocument: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to upload documents",
        data: { user: null, document: null },
      });
    }

    if (!file) {
      console.log("uploadDocument: No file uploaded");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "PDF file is required",
        data: { user: null, document: null },
      });
    }

    if (!fs.existsSync(file.path)) {
      console.log("uploadDocument: Temporary file not found", {
        path: file.path,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Temporary file not found",
        data: { user: null, document: null },
      });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("uploadDocument: Organization not found", { orgId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, document: null },
      });
    }

    if (
      user.role.name !== "superAdmin" &&
      user.organization.toString() !== orgId
    ) {
      console.log("uploadDocument: User not in organization", {
        userId: req.user.id,
        orgId,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to upload documents to this organization",
        data: { user: null, document: null },
      });
    }

    if (!documentName?.trim()) {
      console.log("uploadDocument: Missing or empty document name", {
        documentName,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Document name is required",
        data: { user: null, document: null },
      });
    }

    let parsedStartDate, parsedExpiryDate;
    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate)) {
        console.log("uploadDocument: Invalid start date", { startDate });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid start date format",
          data: { user: null, document: null },
        });
      }
    }
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate)) {
        console.log("uploadDocument: Invalid expiry date", { expiryDate });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid expiry date format",
          data: { user: null, document: null },
        });
      }
      if (startDate && parsedExpiryDate <= parsedStartDate) {
        console.log("uploadDocument: Expiry date must be after start date", {
          startDate,
          expiryDate,
        });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Expiry date must be after start date",
          data: { user: null, document: null },
        });
      }
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: orgId,
      public_id: documentName,
      resource_type: "raw",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });

    const document = new Document({
      name: documentName,
      fileUrl: uploadResult.secure_url,
      googleDriveFileId: uploadResult.public_id,
      organization: orgId,
      documentType: documentType || "Other",
      uploadedBy: req.user.id,
      isApproved: false,
      approvedBy: null,
      startDate: parsedStartDate || null,
      expiryDate: parsedExpiryDate || null,
    });

    await document.save();

    console.log("uploadDocument: Document saved", {
      documentId: document._id,
      organization: document.organization,
      cloudinaryPublicId: uploadResult.public_id,
    });

    const auditLog = new AuditLog({
      user: req.user.id,
      action: "document_upload",
      resource: "Document",
      resourceId: document._id,
      details: { documentName: document.name, organization: orgId },
    });
    await auditLog.save();
    console.log("uploadDocument: Audit log created", {
      auditLogId: auditLog._id,
    });

    const notification = new Notification({
      user: req.user.id,
      organization: orgId,
      type: "document_upload",
      message: `New document "${document.name}" uploaded by ${user.fullName}`,
      metadata: { documentId: document._id },
    });
    await notification.save();
    console.log("uploadDocument: Notification created", {
      notificationId: notification._id,
    });

    try {
      const email = new Email(
        user,
        `https://your-app-url.com/documents/${orgId}`,
        null,
        {
          documentName: document.name,
          uploaderName: user.fullName,
          uploaderEmail: user.email,
          organizationName: organization.name,
          uploadTime: document.createdAt.toLocaleString(),
          documentsUrl: `https://your-app-url.com/documents/${orgId}`,
          startDate: document.startDate
            ? document.startDate.toLocaleDateString()
            : "N/A",
          expiryDate: document.expiryDate
            ? document.expiryDate.toLocaleDateString()
            : "N/A",
        }
      );
      await email.sendDocumentUpload();
      console.log("uploadDocument: Notification email sent", {
        to: user.email,
      });
    } catch (emailError) {
      console.error(
        "uploadDocument: Failed to send notification email",
        emailError
      );
    }

    try {
      fs.unlinkSync(file.path);
      console.log("uploadDocument: Temporary file deleted", {
        path: file.path,
      });
    } catch (cleanupError) {
      console.error(
        "uploadDocument: Failed to delete temporary file",
        cleanupError
      );
    }

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Document uploaded successfully",
      data: {
        user: null,
        document: {
          _id: document._id,
          name: document.name,
          documentType: document.documentType,
          fileUrl: document.fileUrl,
          organization: document.organization,
          uploadedBy: document.uploadedBy,
          isApproved: document.isApproved,
          approvedBy: document.approvedBy,
          startDate: document.startDate,
          expiryDate: document.expiryDate,
          createdAt: document.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("uploadDocument: Error", error);

    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log("uploadDocument: Temporary file deleted on error", {
          path: file.path,
        });
      } catch (cleanupError) {
        console.error(
          "uploadDocument: Failed to delete temporary file on error",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document upload",
      data: { user: null, document: null },
    });
  }
};

const downloadDocument = async (req, res) => {
  const { id } = req.params;
  console.log("downloadDocument: Request received", { id, user: req.user });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("downloadDocument: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents",
        data: { user: null, document: null },
      });
    }

    const document = await Document.findById(id);
    if (!document) {
      console.log("downloadDocument: Document not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Document not found",
        data: { user: null, document: null },
      });
    }

    const organization = await Organization.findById(document.organization);
    if (!organization) {
      console.log("downloadDocument: Organization not found", {
        orgId: document.organization,
      });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, document: null },
      });
    }

    if (
      user.role.name !== "superAdmin" &&
      user.organization.toString() !== document.organization.toString()
    ) {
      console.log("downloadDocument: User not in organization", {
        userId: req.user.id,
        orgId: document.organization,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents in this organization",
        data: { user: null, document: null },
      });
    }

    document.accessCount++;
    await document.save();

    const fileUrl = document.fileUrl;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.name}.pdf"`
    );

    https
      .get(fileUrl, (stream) => {
        stream.pipe(res);
        console.log("downloadDocument: File streaming started", {
          fileUrl: document.fileUrl,
        });
      })
      .on("error", (err) => {
        console.error("downloadDocument: Streaming error", err);
        return res.status(500).json({
          status: "error",
          statusCode: 500,
          message: "Error downloading file",
          data: { user: null, document: null },
        });
      });
  } catch (error) {
    console.error("downloadDocument: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document download",
      data: { user: null, document: null },
    });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;
  console.log("deleteDocument: Request received", { id, user: req.user });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.deleteDocuments) {
      console.log("deleteDocument: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to delete documents",
        data: { user: null, document: null },
      });
    }

    const document = await Document.findById(id);
    if (!document) {
      console.log("deleteDocument: Document not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Document not found",
        data: { user: null, document: null },
      });
    }

    if (
      user.role.name !== "admin" &&
      user.role.name !== "superAdmin" &&
      document.uploadedBy.toString() !== req.user.id
    ) {
      console.log("deleteDocument: Unauthorized", {
        userId: req.user.id,
        documentUploader: document.uploadedBy,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to delete this document",
        data: { user: null, document: null },
      });
    }

    if (document.googleDriveFileId) {
      await cloudinary.uploader.destroy(document.googleDriveFileId, {
        resource_type: "raw",
      });
      console.log("deleteDocument: File deleted from Cloudinary", {
        publicId: document.googleDriveFileId,
      });
    } else {
      console.log("deleteDocument: No Cloudinary public_id found", {
        documentId: id,
      });
    }

    await Document.findByIdAndDelete(id);
    console.log("deleteDocument: Document deleted from MongoDB", {
      documentId: id,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document deleted successfully",
      data: { user: null, document: null },
    });
  } catch (error) {
    console.error("deleteDocument: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document deletion",
      data: { user: null, document: null },
    });
  }
};

const getDocumentsByUser = async (req, res) => {
  const { userId } = req.params;
  console.log("getDocumentsByUser: Request received", {
    userId,
    user: req.user,
  });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("getDocumentsByUser: Unauthorized", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents",
        data: { user: null, documents: null },
      });
    }

    if (
      user.role.name !== "admin" &&
      user.role.name !== "superAdmin" &&
      req.user.id !== userId
    ) {
      console.log("getDocumentsByUser: Unauthorized", {
        userId,
        requester: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view these documents",
        data: { user: null, documents: null },
      });
    }

    const documents = await Document.find({ uploadedBy: userId }).select(
      "name documentType organization createdAt"
    );
    console.log("getDocumentsByUser: Found documents", {
      count: documents.length,
    });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: documents.length
        ? "Documents retrieved successfully"
        : "No documents found for this user",
      data: {
        user: null,
        documents,
      },
    });
  } catch (error) {
    console.error("getDocumentsByUser: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during user document retrieval",
      data: { user: null, documents: null },
    });
  }
};

const getDocumentMetrics = async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.id;
  console.log("getDocumentMetrics: Request received", { orgId, userId });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("getDocumentMetrics: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents",
        data: { user: null, metrics: null },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      console.log("getDocumentMetrics: Invalid orgId", { orgId });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid organization ID",
        data: { user: null, metrics: null },
      });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getDocumentMetrics: Organization not found", { orgId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, metrics: null },
      });
    }

    if (
      user.role.name !== "superAdmin" &&
      user.organization.toString() !== orgId
    ) {
      console.log("getDocumentMetrics: User not in organization", {
        userId: req.user.id,
        orgId,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents in this organization",
        data: { user: null, metrics: null },
      });
    }

    const mostPopular = await Document.find({ organization: orgId })
      .sort({ accessCount: -1 })
      .limit(5)
      .select("name documentType accessCount uploadedBy createdAt");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newReports = await Document.find({
      organization: orgId,
      createdAt: { $gte: sevenDaysAgo },
    }).select("name documentType uploadedBy createdAt");

    const accessedReports = await Document.find({
      organization: orgId,
      accessCount: { $gt: 0 },
    })
      .sort({ accessCount: -1 })
      .limit(5)
      .select("name documentType accessCount uploadedBy createdAt");

    const othersReports = await Document.find({
      organization: orgId,
      uploadedBy: { $ne: userId },
    }).select("name documentType uploadedBy createdAt");

    console.log("getDocumentMetrics: Success", { orgId });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document metrics retrieved successfully",
      data: {
        user: null,
        metrics: {
          mostPopular,
          newReports,
          accessedReports,
          othersReports,
        },
      },
    });
  } catch (error) {
    console.error("getDocumentMetrics: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document metrics retrieval",
      data: { user: null, metrics: null },
    });
  }
};

const updateDocument = async (req, res) => {
  const { id } = req.params;
  const { name, documentType } = req.body;
  console.log("updateDocument: Request received", {
    id,
    name,
    documentType,
    user: req.user,
  });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.editDocuments) {
      console.log("updateDocument: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to update documents",
        data: { user: null, document: null },
      });
    }

    const document = await Document.findById(id);
    if (!document) {
      console.log("updateDocument: Document not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Document not found",
        data: { user: null, document: null },
      });
    }

    if (
      user.role.name !== "admin" &&
      user.role.name !== "superAdmin" &&
      document.uploadedBy.toString() !== req.user.id
    ) {
      console.log("updateDocument: Unauthorized", {
        userId: req.user.id,
        documentUploader: document.uploadedBy,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to update this document",
        data: { user: null, document: null },
      });
    }

    if (name) document.name = name;
    if (documentType) document.documentType = documentType;

    await document.save();
    console.log("updateDocument: Document updated", { documentId: id });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document updated successfully",
      data: {
        user: null,
        document: {
          _id: document._id,
          name: document.name,
          documentType: document.documentType,
          fileUrl: document.fileUrl,
          organization: document.organization,
          uploadedBy: document.uploadedBy,
          createdAt: document.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("updateDocument: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document update",
      data: { user: null, document: null },
    });
  }
};

const approveDocument = async (req, res) => {
  const { id } = req.params;
  console.log("approveDocument: Request received", { id, user: req.user });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.approveDocuments) {
      console.log("approveDocument: Unauthorized", { userId: req.user.id });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to approve documents",
        data: { user: null, document: null },
      });
    }

    const document = await Document.findById(id);
    if (!document) {
      console.log("approveDocument: Document not found", { id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Document not found",
        data: { user: null, document: null },
      });
    }

    document.isApproved = true;
    document.approvedBy = req.user.id;
    await document.save();

    console.log("approveDocument: Document approved", { documentId: id });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document approved successfully",
      data: {
        user: null,
        document: {
          _id: document._id,
          name: document.name,
          documentType: document.documentType,
          fileUrl: document.fileUrl,
          organization: document.organization,
          uploadedBy: document.uploadedBy,
          isApproved: document.isApproved,
          approvedBy: document.approvedBy,
          createdAt: document.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("approveDocument: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during document approval",
      data: { user: null, document: null },
    });
  }
};

const getContractExpiryAlerts = async (req, res) => {
  const { orgId } = req.params;
  console.log("getContractExpiryAlerts: Request received", {
    orgId,
    user: req.user,
  });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("getContractExpiryAlerts: Unauthorized", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents",
        data: { user: null, alerts: null },
      });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getContractExpiryAlerts: Organization not found", { orgId });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, alerts: null },
      });
    }

    if (
      user.role.name !== "superAdmin" &&
      user.organization.toString() !== orgId
    ) {
      console.log("getContractExpiryAlerts: User not in organization", {
        userId: req.user.id,
        orgId,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view alerts in this organization",
        data: { user: null, alerts: null },
      });
    }

    const now = new Date();
    const alerts = await Document.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          expiryDate: { $gte: now },
        },
      },
      {
        $addFields: {
          daysToExpiry: {
            $divide: [{ $subtract: ["$expiryDate", now] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      {
        $match: {
          $expr: {
            $lte: [
              "$daysToExpiry",
              "$notificationPreferences.contractExpiryDays",
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          documentType: 1,
          expiryDate: 1,
          uploadedBy: 1,
        },
      },
    ]);

    console.log("getContractExpiryAlerts: Alerts retrieved", {
      count: alerts.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: alerts.length
        ? "Contract expiry alerts retrieved successfully"
        : "No contracts expiring soon",
      data: {
        user: null,
        alerts,
      },
    });
  } catch (error) {
    console.error("getContractExpiryAlerts: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during contract expiry alerts retrieval",
      data: { user: null, alerts: null },
    });
  }
};

module.exports = {
  getNotifications,
  getContractExpiryAlerts,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  updateDocument,
  getDocumentsByUser,
  getDocumentMetrics,
  approveDocument,
};
