const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

const createAdmin = async () => {
  await connectDB();
  const username = "admin";
  const password = "admin123"; // Replace with secure password
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role: "admin" });
  await user.save();
  console.log("Admin user created");
  process.exit();
};

createAdmin();
