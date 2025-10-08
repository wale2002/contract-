const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  googleDriveFileId: { type: String }, // Reused for Cloudinary public_id
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  documentType: {
    type: String,
    enum: ["SLA", "NDA", "Contract", "Other"],
    default: "Other",
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accessCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // Added updatedAt field
  startDate: { type: Date, required: false }, // New field
  expiryDate: { type: Date, required: false }, // New field
  isApproved: { type: Boolean, default: false },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  note: { type: String, required: false, default: "" }, // Note field added for when document is added to organization
  notificationPreferences: {
    contractExpiryDays: { type: Number, default: 30 }, // Notify X days before expiry
  },
});

// Add middleware to update updatedAt on save
documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Document", documentSchema);
