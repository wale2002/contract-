// // models/User.js
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   fullName: { type: String, required: true }, // Kept for compatibility
//   firstName: { type: String, default: "" }, // New field
//   lastName: { type: String, default: "" }, // New field
//   Department: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   profilePicture: { type: String, default: "" },
//   role: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Role",
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["Active", "InActive"],
//     default: "Active",
//   },
//   phoneNumber: { type: String, required: true },
//   organization: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Organization",
//     required: false,
//     default: null,
//   },
//   jobTitle: { type: String, default: "" },
//   location: { type: String, default: "" },
//   timezone: { type: String, default: "" },
//   language: { type: String, default: "" },
//   dateFormat: { type: String, default: "" },
//   createdAt: { type: Date, default: Date.now },
//   resetPasswordToken: { type: String },
//   resetPasswordExpires: { type: Date },
// });

// // Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// module.exports = mongoose.model("User", userSchema);

// models/User.js
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   fullName: { type: String, required: true }, // Kept for compatibility
//   firstName: { type: String, default: "" }, // New field
//   lastName: { type: String, default: "" }, // New field
//   Department: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   profilePicture: { type: String, default: "" },
//   role: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Role",
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["Active", "InActive"],
//     default: "Active",
//   },
//   phoneNumber: { type: String, required: true },
//   organization: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Organization",
//     required: false,
//     default: null,
//   },
//   jobTitle: { type: String, default: "" },
//   location: { type: String, default: "" },
//   timezone: { type: String, default: "" },
//   language: { type: String, default: "" },
//   dateFormat: { type: String, default: "" },
//   createdAt: { type: Date, default: Date.now },
//   resetPasswordToken: { type: String },
//   resetPasswordExpires: { type: Date },
// });

// // Hash password before saving

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // Kept for compatibility
  firstName: { type: String, default: "" }, // New field
  lastName: { type: String, default: "" }, // New field
  Department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "InActive"],
    default: "Active",
  },
  phoneNumber: { type: String, required: true },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: false,
    default: null,
  },
  jobTitle: { type: String, default: "" },
  location: { type: String, default: "" },
  timezone: { type: String, default: "" },
  language: { type: String, default: "" },
  dateFormat: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Hash password before saving

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model("User", userSchema);
