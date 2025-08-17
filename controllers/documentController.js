const Document = require("../models/Document");
const Organization = require("../models/Organization");
const User = require("../models/User");
const { mega } = require("../config/megaStorage");
const fsPromises = require("fs").promises;
const fs = require("fs"); // For existsSync and createReadStream
const mongoose = require("mongoose");
const Email = require("../utils/email");

const path = require("path");

const getDocuments = async (req, res) => {
  const { orgId } = req.params;
  console.log("getDocuments: Request received", { orgId, user: req.user });
  try {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("getDocuments: Organization not found", { orgId });
      return res.status(404).json({ message: "Organization not found" });
    }

    const documents = await Document.find({ organization: orgId }).select(
      "name documentType uploadDate"
    );
    console.log("getDocuments: Found documents", { count: documents.length });
    res.json({ message: "Documents retrieved successfully", data: documents });
  } catch (error) {
    console.error("getDocuments: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// const uploadDocument = async (req, res, next) => {
//   const { orgId } = req.params;
//   const { name, documentType } = req.body;
//   const file = req.file;
//   console.log("uploadDocument: Request received", {
//     orgId,
//     name,
//     documentType,
//     file: file?.originalname,
//     user: req.user,
//   });

//   let fileDeleted = false;

//   try {
//     // Validate organization
//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("uploadDocument: Organization not found", { orgId });
//       return res.status(404).json({ message: "Organization not found" });
//     }

//     // Validate file
//     if (!file) {
//       console.log("uploadDocument: No file uploaded");
//       return res.status(400).json({ message: "PDF file is required" });
//     }

//     // Normalize file path for Windows
//     const filePath = path.normalize(file.path);
//     console.log("uploadDocument: Checking file path", { filePath });

//     // Debug file existence
//     try {
//       if (!fs.existsSync(filePath)) {
//         console.log("uploadDocument: File does not exist on disk", {
//           filePath,
//         });
//         return res
//           .status(400)
//           .json({ message: "Temporary file not found on disk" });
//       }
//       await fsPromises.access(filePath, fsPromises.constants.R_OK);
//       console.log("uploadDocument: File is accessible", { filePath });
//     } catch (error) {
//       console.log("uploadDocument: Temporary file not found", {
//         path: filePath,
//         error: error.message,
//       });
//       return res.status(400).json({ message: "Temporary file not found" });
//     }

//     let fileUrl, megaNodeId;

//     // MEGA upload logic
//     try {
//       console.log("uploadDocument: Starting MEGA upload");
//       const storage = await mega();
//       let orgFolder = storage.root.children?.find((f) => f.name === orgId);
//       if (!orgFolder) {
//         orgFolder = await storage.mkdir(orgId);
//         console.log("uploadDocument: MEGA folder created", { orgId });
//       } else {
//         console.log("uploadDocument: MEGA folder found", { orgId });
//       }

//       const fileStream = fs.createReadStream(filePath);
//       const fileStats = await fsPromises.stat(filePath);
//       const uploadedFile = await orgFolder
//         .upload(
//           {
//             name: `${name}.pdf`,
//             size: fileStats.size, // Specify file size
//             allowUploadBuffering: true, // Enable buffering as fallback
//           },
//           fileStream
//         )
//         .complete();
//       fileUrl = await uploadedFile.link(false);
//       megaNodeId = uploadedFile.nodeId;
//       console.log("uploadDocument: MEGA upload successful", {
//         fileUrl,
//         megaNodeId,
//       });
//     } catch (megaError) {
//       console.error(
//         "uploadDocument: MEGA upload failed, falling back to S3",
//         megaError
//       );
//       if (!process.env.S3_BUCKET) {
//         console.error(
//           "uploadDocument: S3_BUCKET environment variable is not set"
//         );
//         throw new Error("S3 configuration error: Missing S3_BUCKET");
//       }

//       console.log("uploadDocument: Starting S3 upload");
//       const s3Client = new S3Client({ region: process.env.AWS_REGION });
//       const fileContent = await fsPromises.readFile(filePath);
//       const params = {
//         Bucket: process.env.S3_BUCKET,
//         Key: `documents/${orgId}/${name}.pdf`,
//         Body: fileContent,
//         ContentType: "application/pdf",
//       };
//       const command = new PutObjectCommand(params);
//       await s3Client.send(command);
//       fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/documents/${orgId}/${name}.pdf`;
//       console.log("uploadDocument: S3 upload successful", { fileUrl });
//     }

//     // Save document to MongoDB
//     const document = new Document({
//       name,
//       fileUrl,
//       googleDriveFileId: megaNodeId || null,
//       organization: orgId,
//       documentType: documentType || "Other",
//       uploadedBy: req.user.id,
//     });

//     await document.save();
//     console.log("uploadDocument: Document saved", {
//       documentId: document._id,
//       megaNodeId,
//       fileUrl,
//     });

//     // Clean up temporary file
//     try {
//       await fsPromises.unlink(filePath);
//       fileDeleted = true;
//       console.log("uploadDocument: Temporary file deleted", { path: filePath });
//     } catch (cleanupError) {
//       console.error(
//         "uploadDocument: Failed to delete temporary file",
//         cleanupError
//       );
//     }

//     res
//       .status(201)
//       .json({ message: "Document uploaded successfully", data: document });
//   } catch (error) {
//     console.error("uploadDocument: Error", error);
//     if (file && file.path && !fileDeleted) {
//       try {
//         const filePath = path.normalize(file.path);
//         await fsPromises.access(filePath);
//         await fsPromises.unlink(filePath);
//         console.log("uploadDocument: Temporary file deleted on error", {
//           path: filePath,
//         });
//       } catch (cleanupError) {
//         console.error(
//           "uploadDocument: Failed to delete temporary file on error",
//           cleanupError
//         );
//       }
//     }
//     next(error);
//   }
// };

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
    return res.status(400).json({ message: "PDF file is required" });
  }

  if (!fs.existsSync(file.path)) {
    console.log("uploadDocument: Temporary file not found", {
      path: file.path,
    });
    return res.status(400).json({ message: "Temporary file not found" });
  }

  try {
    // Validate organization
    const organization = await Organization.findById(orgId);
    if (!organization) {
      console.log("uploadDocument: Organization not found", { orgId });
      return res.status(404).json({ message: "Organization not found" });
    }

    // Validate user
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("uploadDocument: User not found", { userId: req.user.id });
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize MEGA storage
    const megaStorage = await mega();
    const orgFolder =
      megaStorage.root.children.find((f) => f.name === orgId) ||
      (await megaStorage.mkdir({ name: orgId }));

    // Upload file to MEGA
    const fileStream = fs.createReadStream(file.path);
    const uploadedFile = await orgFolder.upload(
      { name: `${name}.pdf`, allowUploadBuffering: true },
      fileStream
    ).complete;

    const fileUrl = await uploadedFile.link();

    // Save document in DB
    const document = new Document({
      name,
      fileUrl,
      googleDriveFileId: uploadedFile.nodeId,
      organization: orgId,
      documentType: documentType || "Other",
      uploadedBy: req.user.id,
    });

    await document.save();

    console.log("uploadDocument: Document saved", {
      documentId: document._id,
      organization: document.organization,
      megaNodeId: uploadedFile.nodeId,
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

    return res
      .status(201)
      .json({ message: "Document uploaded successfully", data: document });
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

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
// const uploadDocument = async (req, res) => {
//   const { orgId } = req.params;
//   const { name, documentType } = req.body;
//   const file = req.file;
//   console.log("uploadDocument: Request received", {
//     orgId,
//     name,
//     documentType,
//     file: file?.originalname,
//     filePath: file?.path,
//     user: req.user,
//     userOrgId: req.user.organization,
//   });

//   try {
//     // Validate organization
//     const organization = await Organization.findById(orgId);
//     if (!organization) {
//       console.log("uploadDocument: Organization not found", { orgId });
//       return res.status(404).json({ message: "Organization not found" });
//     }

//     // Validate user organization
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       console.log("uploadDocument: User not found", { userId: req.user.id });
//       return res.status(404).json({ message: "User not found" });
//     }
//     if (!user.organization || user.organization.toString() !== orgId) {
//       console.log("uploadDocument: User not in organization", {
//         userId: req.user.id,
//         orgId,
//         userOrgId: user.organization,
//       });
//       return res
//         .status(403)
//         .json({ message: "User not authorized for this organization" });
//     }

//     // Validate file
//     if (!file) {
//       console.log("uploadDocument: No file uploaded");
//       return res.status(400).json({ message: "PDF file is required" });
//     }

//     // Check if temporary file exists
//     try {
//       await fs.access(file.path);
//       console.log("uploadDocument: Temporary file found", { path: file.path });
//     } catch {
//       console.log("uploadDocument: Temporary file not found", {
//         path: file.path,
//       });
//       return res.status(400).json({ message: "Temporary file not found" });
//     }

//     // Initialize MEGA storage
//     const megaStorage = await mega();
//     const orgFolder =
//       megaStorage.root.children.find((f) => f.name === orgId) ||
//       (await megaStorage.mkdir({ name: orgId }));

//     // Upload to MEGA
//     const fileStream = fs.createReadStream(file.path);
//     const uploadedFile = await orgFolder.upload(
//       { name: `${name}.pdf`, allowUploadBuffering: true },
//       fileStream
//     ).complete;
//     const fileUrl = await uploadedFile.link();

//     // Create document record
//     const document = new Document({
//       name,
//       fileUrl,
//       googleDriveFileId: uploadedFile.nodeId,
//       organization: orgId,
//       documentType: documentType || "Other",
//       uploadedBy: req.user.id,
//     });

//     await document.save();
//     console.log("uploadDocument: Document saved", {
//       documentId: document._id,
//       organization: document.organization,
//       megaNodeId: uploadedFile.nodeId,
//     });

//     // Send email notification to the uploader
//     try {
//       const email = new Email(
//         user,
//         `https://your-app-url.com/documents/${orgId}`,
//         null,
//         {
//           documentName: document.name,
//           uploaderName: user.firstName,
//           uploaderEmail: user.email,
//           organizationName: organization.name,
//           uploadTime: document.createdAt.toLocaleString(),
//           documentsUrl: `https://your-app-url.com/documents/${orgId}`,
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

//     // Clean up temporary file
//     try {
//       await fs.unlink(file.path);
//       console.log("uploadDocument: Temporary file deleted", {
//         path: file.path,
//       });
//     } catch (cleanupError) {
//       console.error(
//         "uploadDocument: Failed to delete temporary file",
//         cleanupError
//       );
//     }

//     res.status(201).json({
//       message: "Document uploaded successfully",
//       data: document,
//     });
//   } catch (error) {
//     console.error("uploadDocument: Error", error);
//     if (file && file.path) {
//       try {
//         await fs.access(file.path);
//         await fs.unlink(file.path);
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
//     res.status(500).json({
//       message: "Server error",
//       error: process.env.NODE_ENV === "production" ? undefined : error.message,
//     });
//   }
// };

const downloadDocument = async (req, res) => {
  const { id } = req.params;
  console.log("downloadDocument: Request received", { id, user: req.user });

  try {
    const document = await Document.findById(id);
    if (!document) {
      console.log("downloadDocument: Document not found", { id });
      return res.status(404).json({ message: "Document not found" });
    }

    // Download from MEGA
    const megaStorage = await mega();
    const fileNode = megaStorage.find(document.googleDriveFileId);
    if (!fileNode) {
      console.log("downloadDocument: File node not found", {
        nodeId: document.googleDriveFileId,
      });
      return res.status(404).json({ message: "File not found in MEGA" });
    }
    const dest = fs.createWriteStream(
      path.join(__dirname, `../../Uploads/temp_${document.name}.pdf`)
    );
    await fileNode.download(dest);

    console.log("downloadDocument: File downloaded", {
      nodeId: document.googleDriveFileId,
    });
    res.download(
      path.join(__dirname, `../../Uploads/temp_${document.name}.pdf`),
      `${document.name}.pdf`,
      () => {
        try {
          fs.unlinkSync(
            path.join(__dirname, `../../Uploads/temp_${document.name}.pdf`)
          );
          console.log("downloadDocument: Temporary file cleaned up");
        } catch (cleanupError) {
          console.error(
            "downloadDocument: Failed to delete temporary file",
            cleanupError
          );
        }
      }
    );
  } catch (error) {
    console.error("downloadDocument: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteDocument = async (req, res) => {
  const { id } = req.params;
  console.log("deleteDocument: Request received", { id, user: req.user });

  try {
    const document = await Document.findById(id);
    if (!document) {
      console.log("deleteDocument: Document not found", { id });
      return res.status(404).json({ message: "Document not found" });
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
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this document" });
    }

    // Delete file from MEGA
    const megaStorage = await mega();
    const fileNode = megaStorage.find(document.googleDriveFileId);
    if (fileNode) {
      await fileNode.delete();
      console.log("deleteDocument: File deleted from MEGA", {
        nodeId: document.googleDriveFileId,
      });
    } else {
      console.log("deleteDocument: File node not found in MEGA", {
        nodeId: document.googleDriveFileId,
      });
    }

    // Delete document from MongoDB
    await Document.findByIdAndDelete(id);
    console.log("deleteDocument: Document deleted from MongoDB", {
      documentId: id,
    });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("deleteDocument: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
      return res
        .status(403)
        .json({ message: "Unauthorized to view these documents" });
    }

    const documents = await Document.find({ uploadedBy: userId }).select(
      "name documentType organization uploadDate"
    );
    console.log("getDocumentsByUser: Found documents", {
      count: documents.length,
    });
    res.json({ message: "Documents retrieved successfully", data: documents });
  } catch (error) {
    console.error("getDocumentsByUser: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
      return res.status(400).json({ message: "Invalid organization ID" });
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
    res.json({
      message: "Metrics retrieved successfully",
      data: {
        mostPopular,
        newReports,
        accessedReports,
        othersReports,
      },
    });
  } catch (error) {
    console.error("getDocumentMetrics: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
      return res.status(404).json({ message: "Document not found" });
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
      return res
        .status(403)
        .json({ message: "Unauthorized to update this document" });
    }

    // Update fields if provided
    if (name) document.name = name;
    if (documentType) document.documentType = documentType;

    await document.save();
    console.log("updateDocument: Document updated", { documentId: id });
    res.json({ message: "Document updated successfully", data: document });
  } catch (error) {
    console.error("updateDocument: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// const getDocumentMetrics = async (req, res) => {
//   const { orgId } = req.params;
//   console.log("getDocumentMetrics: Request received", {
//     orgId,
//     user: req.user,
//   });

//   try {
//     if (!req.user || !req.user.id || !req.user.role) {
//       console.log("getDocumentMetrics: Invalid authentication data");
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(orgId)) {
//       console.log("getDocumentMetrics: Invalid organization ID", { orgId });
//       return res.status(400).json({ message: "Invalid organization ID" });
//     }

//     // Admins can access any org's metrics, users only their own org
//     if (
//       req.user.role !== "admin" &&
//       req.user.organization.toString() !== orgId
//     ) {
//       console.log("getDocumentMetrics: Unauthorized", {
//         userId: req.user.id,
//         orgId,
//       });
//       return res
//         .status(403)
//         .json({
//           message: "Unauthorized to view metrics for this organization",
//         });
//     }

//     const totalDocuments = await Document.countDocuments({
//       organization: orgId,
//     });
//     const totalUploads = await Document.countDocuments({ organization: orgId }); // Assuming uploads = documents

//     console.log("getDocumentMetrics: Metrics retrieved", {
//       orgId,
//       totalDocuments,
//       totalUploads,
//     });

//     res.status(200).json({
//       message: "Document metrics retrieved successfully",
//       data: { totalDocuments, totalUploads },
//     });
//   } catch (error) {
//     console.error("getDocumentMetrics: Error", error);
//     const isProduction = process.env.NODE_ENV === "production";
//     res.status(500).json({
//       message: "Server error",
//       error: isProduction ? undefined : error.message,
//     });
//   }
// };

module.exports = {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  updateDocument,
  getDocumentsByUser,
  getDocumentMetrics,
};
