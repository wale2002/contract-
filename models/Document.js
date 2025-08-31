// const mongoose = require("mongoose");

// const documentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   fileUrl: { type: String, required: true },
//   googleDriveFileId: { type: String }, // Reused for MEGA node ID
//   organization: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Organization",
//     required: true,
//   },
//   documentType: {
//     type: String,
//     enum: ["SLA", "NDA", "Contract", "Other"],
//     default: "Other",
//   },
//   uploadedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   accessCount: { type: Number, default: 0 },
//   uploadDate: { type: Date, default: Date.now },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Document", documentSchema);

const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  googleDriveFileId: { type: String }, // Reused for Cloudinary public_id (consider renaming to cloudinaryPublicId)
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
  uploadDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);
