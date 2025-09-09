const Document = require("../models/Document");
const Organization = require("../models/Organization");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinaryStorage");
const fs = require("fs");
const mongoose = require("mongoose");
const Email = require("../utils/email");
const path = require("path");
const https = require("https");

const getDocuments = async (req, res) => {
  const { orgId } = req.params;
  console.log("getDocuments: Request received", { orgId, user: req.user });
  try {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getDocuments: Organization not found", { orgId });
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const documents = await Document.find({ organization: orgId }).select(
      "name documentType uploadDate"
    );
    console.log("getDocuments: Found documents", { count: documents.length });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: documents.length
        ? "Documents retrieved successfully"
        : "No documents found",
      token: null,
      data: { user: null, documents },
    });
  } catch (error) {
    console.error("getDocuments: Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error during document retrieval",
      error: error.message,
    });
  }
};

const uploadDocument = async (req, res) => {
  const { orgId } = req.params;
  const { name, documentType } = req.body;
  const file = req.file;

  console.log("uploadDocument: Request received", {
    orgId,
    name,
    documentType,
    file: file?.originalname,
    user: req.user,
    userOrgId: req.user.organization,
  });

  if (!file) {
    console.log("uploadDocument: No file uploaded");
    return res.status(400).json({
      success: false,
      message: "PDF file is required",
    });
  }

  if (!fs.existsSync(file.path)) {
    console.log("uploadDocument: Temporary file not found", {
      path: file.path,
    });
    return res.status(400).json({
      success: false,
      message: "Temporary file not found",
    });
  }

  try {
    // Validate organization
    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("uploadDocument: Organization not found", { orgId });
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Validate user
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("uploadDocument: User not found", { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: orgId,
      public_id: name,
      resource_type: "raw",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });

    // Save document in DB
    const document = new Document({
      name,
      fileUrl: uploadResult.secure_url,
      googleDriveFileId: uploadResult.public_id,
      organization: orgId,
      documentType: documentType || "Other",
      uploadedBy: req.user.id,
    });

    await document.save();

    console.log("uploadDocument: Document saved", {
      documentId: document._id,
      organization: document.organization,
      cloudinaryPublicId: uploadResult.public_id,
    });

    // Send notification email
    try {
      const email = new Email(
        user,
        `https://your-app-url.com/documents/${orgId}`,
        null,
        {
          documentName: document.name,
          uploaderName: user.firstName,
          uploaderEmail: user.email,
          organizationName: organization.name,
          uploadTime: document.createdAt.toLocaleString(),
          documentsUrl: `https://your-app-url.com/documents/${orgId}`,
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

    // Clean up temporary file
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
      token: null,
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
    console.error("uploadDocument: Error", error);

    // Cleanup file on error
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
      success: false,
      message: "Server error during document upload",
      error: error.message,
    });
  }
};

const downloadDocument = async (req, res) => {
  const { id } = req.params;
  console.log("downloadDocument: Request received", { id, user: req.user });

  try {
    const document = await Document.findById(id);
    if (!document) {
      console.log("downloadDocument: Document not found", { id });
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Stream the file from Cloudinary URL
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
          success: false,
          message: "Error downloading file",
        });
      });
  } catch (error) {
    console.error("downloadDocument: Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error during document download",
      error: error.message,
    });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;
  console.log("deleteDocument: Request received", { id, user: req.user });

  try {
    const document = await Document.findById(id);
    if (!document) {
      console.log("deleteDocument: Document not found", { id });
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is authorized (admin or uploader)
    if (
      req.user.role !== "admin" &&
      document.uploadedBy.toString() !== req.user.id
    ) {
      console.log("deleteDocument: Unauthorized", {
        userId: req.user.id,
        documentUploader: document.uploadedBy,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this document",
      });
    }

    // Delete file from Cloudinary
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

    // Delete document from MongoDB
    await Document.findByIdAndDelete(id);
    console.log("deleteDocument: Document deleted from MongoDB", {
      documentId: id,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document deleted successfully",
      token: null,
      data: { user: null },
    });
  } catch (error) {
    console.error("deleteDocument: Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error during document deletion",
      error: error.message,
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
    // Restrict to admin or the user themselves
    if (req.user.role !== "admin" && req.user.id !== userId) {
      console.log("getDocumentsByUser: Unauthorized", {
        userId,
        requester: req.user.id,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view these documents",
      });
    }

    const documents = await Document.find({ uploadedBy: userId }).select(
      "name documentType organization uploadDate"
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
      token: null,
      data: { user: null, documents },
    });
  } catch (error) {
    console.error("getDocumentsByUser: Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error during user document retrieval",
      error: error.message,
    });
  }
};

const getDocumentMetrics = async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.id;
  console.log("getDocumentMetrics: Request received", { orgId, userId });

  try {
    // Validate orgId
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      console.log("getDocumentMetrics: Invalid orgId", { orgId });
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
    }

    // Most popular reports (top 5 by accessCount)
    const mostPopular = await Document.find({ organization: orgId })
      .sort({ accessCount: -1 })
      .limit(5)
      .select("name documentType accessCount uploadedBy createdAt");

    // New reports (created in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newReports = await Document.find({
      organization: orgId,
      createdAt: { $gte: sevenDaysAgo },
    }).select("name documentType uploadedBy createdAt");

    // New reports accessed (sorted by accessCount, non-zero)
    const accessedReports = await Document.find({
      organization: orgId,
      accessCount: { $gt: 0 },
    })
      .sort({ accessCount: -1 })
      .limit(5)
      .select("name documentType accessCount uploadedBy createdAt");

    // Reports uploaded by other users
    const othersReports = await Document.find({
      organization: orgId,
      uploadedBy: { $ne: userId },
    }).select("name documentType uploadedBy createdAt");

    console.log("getDocumentMetrics: Success", { orgId });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document metrics retrieved successfully",
      token: null,
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
      success: false,
      message: "Server error during document metrics retrieval",
      error: error.message,
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
    const document = await Document.findById(id);
    if (!document) {
      console.log("updateDocument: Document not found", { id });
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if user is authorized (admin or uploader)
    if (
      req.user.role !== "admin" &&
      document.uploadedBy.toString() !== req.user.id
    ) {
      console.log("updateDocument: Unauthorized", {
        userId: req.user.id,
        documentUploader: document.uploadedBy,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this document",
      });
    }

    // Update fields if provided
    if (name) document.name = name;
    if (documentType) document.documentType = documentType;

    await document.save();
    console.log("updateDocument: Document updated", { documentId: id });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Document updated successfully",
      token: null,
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
      success: false,
      message: "Server error during document update",
      error: error.message,
    });
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  updateDocument,
  getDocumentsByUser,
  getDocumentMetrics,
};
