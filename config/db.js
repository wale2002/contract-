require("dotenv").config(); // Load environment variables

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ DB connection successful");
  } catch (error) {
    console.error("❌ DB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
