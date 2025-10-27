const Document = require("../models/Document");
const Organization = require("../models/Organization");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinaryStorage");
const fs = require("fs");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
// const Email = require("../utils/email");
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

//     const { page = 1, limit = 10 } = req.query;
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);

//     if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
//       return res.status(400).json({
//         status: "error",
//         statusCode: 400,
//         message: "Invalid page or limit parameters",
//         data: { user: null, documents: null },
//       });
//     }

//     const query = { organization: orgId };

//     const documents = await Document.find(query)
//       .select(
//         "name documentType createdAt isApproved approvedBy startDate expiryDate fileUrl"
//       )
//       .skip((pageNum - 1) * limitNum)
//       .limit(limitNum);

//     const total = await Document.countDocuments(query);

//     // Function to get file size in MB from URL
//     const getFileSizeMB = (url) => {
//       return new Promise((resolve) => {
//         const req = https.request(url, { method: "HEAD" }, (res) => {
//           const contentLength = res.headers["content-length"];
//           const sizeInBytes = contentLength ? parseInt(contentLength, 10) : 0;
//           resolve((sizeInBytes / (1024 * 1024)).toFixed(2));
//         });
//         req.on("error", () => resolve("0.00"));
//         req.end();
//       });
//     };

//     // Add sizeMB to each document
//     const documentsWithSize = await Promise.all(
//       documents.map(async (doc) => {
//         const sizeMB = await getFileSizeMB(doc.fileUrl);
//         return {
//           ...doc.toObject(),
//           sizeMB: parseFloat(sizeMB),
//         };
//       })
//     );

//     console.log("getDocuments: Found documents", {
//       count: documentsWithSize.length,
//       total,
//       page: pageNum,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: documentsWithSize.length
//         ? "Documents retrieved successfully"
//         : "No documents found",
//       data: {
//         user: null,
//         documents: documentsWithSize,
//         total,
//         page: pageNum,
//         totalPages: Math.ceil(total / limitNum),
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
      .select(
        "name documentType createdAt isApproved approvedBy startDate expiryDate fileUrl uploadedBy"
      )
      .populate("uploadedBy", "fullName email")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Document.countDocuments(query);

    // Function to get file size in MB from URL
    const getFileSizeMB = (url) => {
      return new Promise((resolve) => {
        const req = https.request(url, { method: "HEAD" }, (res) => {
          const contentLength = res.headers["content-length"];
          const sizeInBytes = contentLength ? parseInt(contentLength, 10) : 0;
          resolve((sizeInBytes / (1024 * 1024)).toFixed(2));
        });
        req.on("error", () => resolve("0.00"));
        req.end();
      });
    };

    // Add sizeMB to each document
    const documentsWithSize = await Promise.all(
      documents.map(async (doc) => {
        const sizeMB = await getFileSizeMB(doc.fileUrl);
        return {
          ...doc.toObject(),
          sizeMB: parseFloat(sizeMB),
        };
      })
    );

    console.log("getDocuments: Found documents", {
      count: documentsWithSize.length,
      total,
      page: pageNum,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: documentsWithSize.length
        ? "Documents retrieved successfully"
        : "No documents found",
      data: {
        user: null,
        documents: documentsWithSize,
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

const uploadDocument = async (req, res) => {
  const { orgId } = req.params;
  const { documentName, documentType, startDate, expiryDate } = req.body;
  const file = req.file;

  // console.log("uploadDocument: Full req.body", req.body);
  // console.log("uploadDocument: Full req.file", req.file);
  // console.log("uploadDocument: Request received", {
  //   orgId,
  //   documentName,
  //   documentType,
  //   startDate,
  //   expiryDate,
  //   file: file?.originalname,
  //   user: req.user,
  // });

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

    // console.log("uploadDocument: Document saved", {
    //   documentId: document._id,
    //   organization: document.organization,
    //   cloudinaryPublicId: uploadResult.public_id,
    // });

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

    // try {
    //   const email = new Email(
    //     user,
    //     `https://your-app-url.com/documents/${orgId}`,
    //     null,
    //     {
    //       documentName: document.name,
    //       uploaderName: user.fullName,
    //       uploaderEmail: user.email,
    //       organizationName: organization.name,
    //       uploadTime: document.createdAt.toLocaleString(),
    //       documentsUrl: `https://your-app-url.com/documents/${orgId}`,
    //       startDate: document.startDate
    //         ? document.startDate.toLocaleDateString()
    //         : "N/A",
    //       expiryDate: document.expiryDate
    //         ? document.expiryDate.toLocaleDateString()
    //         : "N/A",
    //     }
    //   );
    //   await email.sendDocumentUpload();
    //   console.log("uploadDocument: Notification email sent", {
    //     to: user.email,
    //   });
    // } catch (emailError) {
    //   console.error(
    //     "uploadDocument: Failed to send notification email",
    //     emailError
    //   );
    // }

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
//         data: { user: null, document: null },
//       });
//     }

//     const document = await Document.findById(id);
//     if (!document) {
//       console.log("downloadDocument: Document not found", { id });
//       return res.status(404).json({
//         status: "error",
//         statusCode: 404,
//         message: "Document not found",
//         data: { user: null, document: null },
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
//         data: { user: null, document: null },
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
//         data: { user: null, document: null },
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
//           data: { user: null, document: null },
//         });
//       });
//   } catch (error) {
//     console.error("downloadDocument: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during document download",
//       data: { user: null, document: null },
//     });
//   }
// };
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

    const request = https.get(fileUrl, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        // console.log("downloadDocument: Invalid response from storage", {
        //   statusCode: cloudRes.statusCode,
        //   fileUrl,
        // });
        // Consume the response to avoid memory leaks
        cloudRes.resume();
        return res.status(500).json({
          status: "error",
          statusCode: 500,
          message: "Error fetching file from storage",
          data: { user: null, document: null },
        });
      }

      cloudRes.pipe(res);
      console.log("downloadDocument: File streaming started", { fileUrl });
    });

    request.on("error", (err) => {
      console.error("downloadDocument: Request error", err);
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
      // console.log("deleteDocument: Unauthorized", {
      //   userId: req.user.id,
      //   documentUploader: document.uploadedBy,
      // });
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
const getEnhancedContractExpiryAlerts = async (req, res) => {
  const { orgId } = req.params;
  console.log("getEnhancedContractExpiryAlerts: Request received", {
    orgId,
    user: req.user,
  });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("getEnhancedContractExpiryAlerts: Unauthorized", {
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
      console.log("getEnhancedContractExpiryAlerts: Organization not found", {
        orgId,
      });
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
      console.log("getEnhancedContractExpiryAlerts: User not in organization", {
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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate for expiry alerts with color flags
    const expiryAlerts = await Document.aggregate([
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
        $addFields: {
          flagColor: {
            $cond: {
              if: { $lte: ["$daysToExpiry", 7] },
              then: "red",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $gte: ["$daysToExpiry", 8] },
                      { $lte: ["$daysToExpiry", 14] },
                    ],
                  },
                  then: "orange",
                  else: {
                    $cond: {
                      if: {
                        $and: [
                          { $gte: ["$daysToExpiry", 15] },
                          { $lte: ["$daysToExpiry", 30] },
                        ],
                      },
                      then: "yellow",
                      else: "green",
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $lte: [
                  "$daysToExpiry",
                  "$notificationPreferences.contractExpiryDays",
                ],
              },
              { $lte: ["$daysToExpiry", 30] },
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
          daysToExpiry: { $round: ["$daysToExpiry", 0] },
          flagColor: 1,
          alertType: { $literal: "expiry" },
        },
      },
      { $sort: { daysToExpiry: 1 } },
    ]);

    // Aggregate for recently uploaded documents (within 30 days) as "new upload" alerts
    const newUploadAlerts = await Document.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          createdAt: { $gte: thirtyDaysAgo },
          expiryDate: { $exists: true, $ne: null }, // Only documents with expiry dates
        },
      },
      {
        $addFields: {
          daysSinceUpload: {
            $divide: [{ $subtract: [now, "$createdAt"] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      {
        $addFields: {
          flagColor: {
            $cond: {
              if: { $lte: ["$daysSinceUpload", 7] },
              then: "blue", // New upload within a week
              else: "light-blue", // New upload 8-30 days
            },
          },
        },
      },
      {
        $match: {
          $expr: { $lte: ["$daysSinceUpload", 30] },
        },
      },
      {
        $project: {
          name: 1,
          documentType: 1,
          createdAt: 1, // Use createdAt instead of expiryDate for upload alerts
          uploadedBy: 1,
          daysSinceUpload: { $round: ["$daysSinceUpload", 0] },
          flagColor: 1,
          alertType: { $literal: "new-upload" },
        },
      },
      { $sort: { daysSinceUpload: 1 } }, // Most recent first
    ]);

    // Combine both types of alerts
    const allAlerts = [...expiryAlerts, ...newUploadAlerts];

    console.log("getEnhancedContractExpiryAlerts: Alerts retrieved", {
      expiryCount: expiryAlerts.length,
      newUploadCount: newUploadAlerts.length,
      total: allAlerts.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: allAlerts.length
        ? "Enhanced contract alerts (expiry & new uploads) retrieved successfully"
        : "No alerts found",
      data: {
        user: null,
        alerts: allAlerts,
      },
    });
  } catch (error) {
    console.error("getEnhancedContractExpiryAlerts: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during enhanced contract alerts retrieval",
      data: { user: null, alerts: null },
    });
  }
};
const getGlobalExpiryAlerts = async (req, res) => {
  console.log("getGlobalExpiryAlerts: Request received", { user: req.user });

  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user || !user.role.permissions.DocumentManagement.viewDocuments) {
      console.log("getGlobalExpiryAlerts: Unauthorized", {
        userId: req.user.id,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Unauthorized to view documents",
        data: { user: null, alerts: null },
      });
    }

    // Determine accessible organizations
    let accessibleOrgs = [];
    if (user.role.name === "superAdmin") {
      const allOrgs = await Organization.find({}).select("_id");
      accessibleOrgs = allOrgs.map((org) => org._id);
    } else if (user.organization) {
      accessibleOrgs = [user.organization];
    }

    if (accessibleOrgs.length === 0) {
      console.log("getGlobalExpiryAlerts: No accessible organizations");
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "No alerts found",
        data: {
          user: null,
          alerts: [],
        },
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const accessibleOrgIds = accessibleOrgs.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Aggregate for expiry alerts with color flags and uploader name
    const expiryAlerts = await Document.aggregate([
      {
        $match: {
          organization: { $in: accessibleOrgIds },
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
        $addFields: {
          flagColor: {
            $cond: {
              if: { $lte: ["$daysToExpiry", 7] },
              then: "red",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $gte: ["$daysToExpiry", 8] },
                      { $lte: ["$daysToExpiry", 14] },
                    ],
                  },
                  then: "orange",
                  else: {
                    $cond: {
                      if: {
                        $and: [
                          { $gte: ["$daysToExpiry", 15] },
                          { $lte: ["$daysToExpiry", 30] },
                        ],
                      },
                      then: "yellow",
                      else: "green",
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $lte: [
                  "$daysToExpiry",
                  "$notificationPreferences.contractExpiryDays",
                ],
              },
              { $lte: ["$daysToExpiry", 30] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader",
          pipeline: [{ $project: { fullName: 1 } }],
        },
      },
      {
        $addFields: {
          uploadedBy: { $arrayElemAt: ["$uploader.fullName", 0] },
          daysToExpiry: { $round: ["$daysToExpiry", 0] },
        },
      },
      {
        $unset: "uploader",
      },
      {
        $project: {
          name: 1,
          documentType: 1,
          expiryDate: 1,
          organization: 1,
          uploadedBy: 1,
          daysToExpiry: 1,
          flagColor: 1,
          alertType: { $literal: "expiry" },
        },
      },
      { $sort: { daysToExpiry: 1 } },
    ]);

    // Aggregate for recently uploaded documents (within 30 days) as "new upload" alerts
    const newUploadAlerts = await Document.aggregate([
      {
        $match: {
          organization: { $in: accessibleOrgIds },
          createdAt: { $gte: thirtyDaysAgo },
          expiryDate: { $exists: true, $ne: null }, // Only documents with expiry dates
        },
      },
      {
        $addFields: {
          daysSinceUpload: {
            $divide: [{ $subtract: [now, "$createdAt"] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      {
        $addFields: {
          flagColor: {
            $cond: {
              if: { $lte: ["$daysSinceUpload", 7] },
              then: "blue", // New upload within a week
              else: "light-blue", // New upload 8-30 days
            },
          },
        },
      },
      {
        $match: {
          $expr: { $lte: ["$daysSinceUpload", 30] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader",
          pipeline: [{ $project: { fullName: 1 } }],
        },
      },
      {
        $addFields: {
          uploadedBy: { $arrayElemAt: ["$uploader.fullName", 0] },
          daysSinceUpload: { $round: ["$daysSinceUpload", 0] },
        },
      },
      {
        $unset: "uploader",
      },
      {
        $project: {
          name: 1,
          documentType: 1,
          createdAt: 1, // Use createdAt instead of expiryDate for upload alerts
          organization: 1,
          uploadedBy: 1,
          daysSinceUpload: 1,
          flagColor: 1,
          alertType: { $literal: "new-upload" },
        },
      },
      { $sort: { daysSinceUpload: 1 } }, // Most recent first
    ]);

    // Combine both types of alerts
    const allAlerts = [...expiryAlerts, ...newUploadAlerts];

    // Send notifications immediately for new expiry alerts (if not already notified recently)
    for (const alert of expiryAlerts) {
      const existingNotif = await Notification.findOne({
        type: "document_upload", // FIXED: Use valid enum value
        "metadata.documentId": alert._id,
        createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Within last week
      });

      if (!existingNotif) {
        const docOrg = await Organization.findById(alert.organization).select(
          "name"
        );
        const notification = new Notification({
          user: req.user.id, // FIXED: Set required user field to current user
          organization: alert.organization,
          type: "document_upload", // FIXED: Use valid enum value (adjust if needed based on schema)
          message: `Document "${alert.name}" (${
            alert.documentType
          }) expires in ${alert.daysToExpiry} days on ${new Date(
            alert.expiryDate
          ).toLocaleDateString()}.`,
          metadata: {
            documentId: alert._id,
            daysToExpiry: alert.daysToExpiry,
            orgName: docOrg?.name,
          },
        });
        await notification.save();
        console.log("getGlobalExpiryAlerts: Created expiry notification", {
          documentId: alert._id,
          notificationId: notification._id,
        });
      }
    }

    console.log("getGlobalExpiryAlerts: Alerts retrieved", {
      expiryCount: expiryAlerts.length,
      newUploadCount: newUploadAlerts.length,
      total: allAlerts.length,
      accessibleOrgs: accessibleOrgs.length,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: allAlerts.length
        ? "Global enhanced contract alerts (expiry & new uploads) retrieved successfully"
        : "No global alerts found",
      data: {
        user: null,
        alerts: allAlerts,
      },
    });
  } catch (error) {
    console.error("getGlobalExpiryAlerts: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during global alerts retrieval",
      data: { user: null, alerts: null },
    });
  }
};
module.exports = {
  getGlobalExpiryAlerts,
  getEnhancedContractExpiryAlerts,
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
