const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Role = require("./models/Role"); // Import Role model
const Organization = require("./models/Organization"); // Import Organization model
const connectDB = require("./config/db");

const createSuperAdmin = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Check if superAdmin role exists, create if not
    let superAdminRole = await Role.findOne({ name: "superAdmin" });
    if (!superAdminRole) {
      console.log("Creating superAdmin role...");
      superAdminRole = new Role({
        name: "superAdmin",
        description: "Super Administrator with full access",
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
        createdBy: null, // No creator for initial role
      });
      await superAdminRole.save();
      console.log("superAdmin role created");
    }

    // Check if organization exists, create if not
    let organization = await Organization.findOne({
      name: "Admin Organization",
    });
    if (!organization) {
      console.log("Creating Admin Organization...");
      organization = new Organization({
        name: "Admin Organization",
        // Add other required fields for Organization schema if necessary
      });
      await organization.save();
      console.log("Admin Organization created");
    }

    // Check if superAdmin user already exists
    const existingUser = await User.findOne({
      email: "superadmin@example.com",
    });
    if (existingUser) {
      console.log("SuperAdmin user already exists");
      process.exit(0);
    }

    // Hash the password
    const password = "SuperAdmin123!"; // Replace with a secure password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the superAdmin user
    const user = new User({
      fullName: "Super Admin",
      Department: "Administration",
      email: "superadmin@example.com",
      password: hashedPassword,
      profilePicture: "", // Optional, can set a default or leave empty
      role: superAdminRole._id, // Reference the superAdmin role ObjectId
      status: "Active",
      phoneNumber: "+1234567890", // Replace with a valid phone number
      organization: organization._id, // Reference the organization ObjectId
    });

    // Save the user
    await user.save();
    console.log("SuperAdmin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating superAdmin user:", error);
    process.exit(1);
  }
};

createSuperAdmin();
