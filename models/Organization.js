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
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Organization", organizationSchema);
