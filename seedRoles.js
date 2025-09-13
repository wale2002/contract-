const mongoose = require("mongoose");
const Role = require("./models/Role");

const seedRoles = async () => {
  try {
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log("Roles already seeded");
      return;
    }

    const superAdminRole = new Role({
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
      createdBy: null, // Set to a default admin user ID later
    });

    const contractManagerRole = new Role({
      name: "contractManager",
      description: "Manages contracts and documents",
      permissions: {
        UserManagement: {
          viewUsers: false,
          createUsers: false,
          editUsers: false,
          deleteUsers: false,
          manageUserRoles: false,
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
          createOrganizations: false,
          editOrganizations: false,
          deleteOrganizations: false,
        },
      },
      createdBy: null,
    });

    const documentReviewerRole = new Role({
      name: "documentReviewer",
      description: "Reviews and approves documents",
      permissions: {
        UserManagement: {
          viewUsers: false,
          createUsers: false,
          editUsers: false,
          deleteUsers: false,
          manageUserRoles: false,
        },
        DocumentManagement: {
          viewDocuments: true,
          uploadDocuments: false,
          editDocuments: false,
          deleteDocuments: false,
          approveDocuments: true,
        },
        OrganizationManagement: {
          viewOrganizations: true,
          createOrganizations: false,
          editOrganizations: false,
          deleteOrganizations: false,
        },
      },
      createdBy: null,
    });

    const adminStaffRole = new Role({
      name: "adminStaff",
      description: "Administrative staff with limited access",
      permissions: {
        UserManagement: {
          viewUsers: true,
          createUsers: false,
          editUsers: false,
          deleteUsers: false,
          manageUserRoles: false,
        },
        DocumentManagement: {
          viewDocuments: true,
          uploadDocuments: true,
          editDocuments: false,
          deleteDocuments: false,
          approveDocuments: false,
        },
        OrganizationManagement: {
          viewOrganizations: true,
          createOrganizations: false,
          editOrganizations: false,
          deleteOrganizations: false,
        },
      },
      createdBy: null,
    });

    await Promise.all([
      superAdminRole.save(),
      contractManagerRole.save(),
      documentReviewerRole.save(),
      adminStaffRole.save(),
    ]);

    console.log("Default roles seeded successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

module.exports = seedRoles;
