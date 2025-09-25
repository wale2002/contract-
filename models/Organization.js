// const mongoose = require("mongoose");

// const organizationSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Organization", organizationSchema);

const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  organizationType: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // Added updatedAt field
});

// Add middleware to update updatedAt on save
organizationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Organization", organizationSchema);
