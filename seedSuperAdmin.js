const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Role = require("./models/Role");
const Organization = require("./models/Organization");
const connectDB = require("./config/db");
require("dotenv").config();

async function seedSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB");
    console.log("Current database:", mongoose.connection.db.databaseName);

    // Check if superAdmin role exists
    let superAdminRole = await Role.findOne({ name: "superAdmin" });
    if (!superAdminRole) {
      console.log("Creating superAdmin role...");
      superAdminRole = new Role({
        name: "superAdmin",
        description: "Super Administrator with full system access",
        permissions: {
          UserManagement: {
            viewUsers: true,
            createUsers: true,
            editUsers: true,
            deleteUsers: true,
            manageUserRoles: true,
          },
          DocumentManagement: {
            viewDocuments: true,
            uploadDocuments: true,
            editDocuments: true,
            deleteDocuments: true,
            approveDocuments: true,
          },
          OrganizationManagement: {
            viewOrganizations: true,
            createOrganizations: true,
            editOrganizations: true,
            deleteOrganizations: true,
          },
        },
        createdBy: null,
        createdAt: new Date(),
      });
      await superAdminRole.save();
      console.log(
        "SuperAdmin role created:",
        superAdminRole.name,
        "ID:",
        superAdminRole._id
      );
    } else {
      console.log(
        "SuperAdmin role already exists:",
        superAdminRole.name,
        "ID:",
        superAdminRole._id
      );
    }

    // Check if Admin Organization exists
    let organization = await Organization.findOne({
      name: "Admin Organization",
    });
    if (!organization) {
      console.log("Creating Admin Organization...");
      organization = new Organization({
        name: "Admin Organization",
        // Add other required fields if necessary (based on Organization schema)
      });
      await organization.save();
      console.log(
        "Admin Organization created:",
        organization.name,
        "ID:",
        organization._id
      );
    } else {
      console.log(
        "Admin Organization already exists:",
        organization.name,
        "ID:",
        organization._id
      );
    }

    // Check if superAdmin user exists
    const existingSuperAdmin = await User.findOne({
      email: "superadmin@example.com",
    });
    if (existingSuperAdmin) {
      console.log("SuperAdmin user already exists:", existingSuperAdmin.email);
      console.log("Existing user details:", {
        id: existingSuperAdmin._id,
        fullName: existingSuperAdmin.fullName,
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role,
        organization: existingSuperAdmin.organization,
        status: existingSuperAdmin.status,
      });
      await mongoose.connection.close();
      return;
    }

    // Create superAdmin user
    console.log("Creating superAdmin user...");
    const superAdmin = new User({
      fullName: "Super Admin",
      Department: "Administration",
      email: "superadmin@example.com",
      password: "SuperAdmin123!", // Let pre-save hook hash it
      profilePicture: "",
      role: superAdminRole._id,
      phoneNumber: "+1234567890",
      status: "Active",
      organization: organization._id, // Reference organization
    });

    console.log("User object before save:", {
      fullName: superAdmin.fullName,
      email: superAdmin.email,
      role: superAdmin.role,
      organization: superAdmin.organization,
      phoneNumber: superAdmin.phoneNumber,
      status: superAdmin.status,
    });
    const savedDoc = await superAdmin.save();
    console.log(
      "SuperAdmin user saved:",
      superAdmin.email,
      "ID:",
      savedDoc._id
    );

    // Verify user creation
    const savedUser = await User.findOne({ email: "superadmin@example.com" })
      .populate("role")
      .populate("organization");
    if (savedUser) {
      console.log(
        "Verified: SuperAdmin user exists in database:",
        savedUser.email
      );
      console.log("Saved user details:", {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role ? savedUser.role.name : "No role populated",
        organization: savedUser.organization
          ? savedUser.organization.name
          : "No organization",
        status: savedUser.status,
      });
    } else {
      console.error(
        "Error: SuperAdmin user was not found in database after save"
      );
    }
  } catch (error) {
    console.error("Error seeding superAdmin:", error);
  } finally {
    console.log("Closing MongoDB connection...");
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedSuperAdmin();
