// const mongoose = require("mongoose");

// const roleSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
//   description: { type: String, required: true },
//   permissions: {
//     UserManagement: {
//       viewUsers: { type: Boolean, default: false },
//       createUsers: { type: Boolean, default: false },
//       editUsers: { type: Boolean, default: false },
//       deleteUsers: { type: Boolean, default: false },
//       manageUserRoles: { type: Boolean, default: false },
//     },
//     DocumentManagement: {
//       viewDocuments: { type: Boolean, default: false },
//       uploadDocuments: { type: Boolean, default: false },
//       editDocuments: { type: Boolean, default: false },
//       deleteDocuments: { type: Boolean, default: false },
//       approveDocuments: { type: Boolean, default: false },
//     },
//     OrganizationManagement: {
//       viewOrganizations: { type: Boolean, default: false },
//       createOrganizations: { type: Boolean, default: false },
//       editOrganizations: { type: Boolean, default: false },
//       deleteOrganizations: { type: Boolean, default: false },
//     },
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: false,
//     default: null,
//   }, // Changed to optional
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Role", roleSchema);

// models/Role.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: {
    UserManagement: {
      viewUsers: { type: Boolean, default: false },
      createUsers: { type: Boolean, default: false },
      editUsers: { type: Boolean, default: false },
      deleteUsers: { type: Boolean, default: false },
      manageUserRoles: { type: Boolean, default: false },
    },
    DocumentManagement: {
      viewDocuments: { type: Boolean, default: false },
      uploadDocuments: { type: Boolean, default: false },
      editDocuments: { type: Boolean, default: false },
      deleteDocuments: { type: Boolean, default: false },
      approveDocuments: { type: Boolean, default: false },
    },
    OrganizationManagement: {
      viewOrganizations: { type: Boolean, default: false },
      createOrganizations: { type: Boolean, default: false },
      editOrganizations: { type: Boolean, default: false },
      deleteOrganizations: { type: Boolean, default: false },
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  }, // Changed to optional
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Role", roleSchema);
