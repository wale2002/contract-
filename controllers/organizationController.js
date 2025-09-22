const Organization = require("../models/Organization");
const User = require("../models/User");
const Document = require("../models/Document");
const mongoose = require("mongoose");

const getOrganizations = async (req, res) => {
  console.log("getOrganizations: Request received", { user: req.user });

  try {
    // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("getOrganizations: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organizations: null },
      });
    }

    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid page or limit parameters",
        data: { user: null, organizations: null },
      });
    }

    let query = {};
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { organizationType: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const organizations = await Organization.find(query)
      .select("name organizationType createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Organization.countDocuments(query);

    console.log("getOrganizations: Found organizations", {
      count: organizations.length,
      total,
      page: pageNum,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: organizations.length
        ? "Organizations retrieved successfully"
        : "No organizations found",
      data: {
        user: null,
        organizations,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getOrganizations: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization retrieval",
      data: { user: null, organizations: null },
    });
  }
};
// const getOrganizations = async (req, res) => {
//   console.log("getOrganizations: Request received", { user: req.user });

//   try {
//     // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
//     if (!req.user || !req.user.id) {
//       console.log("getOrganizations: Invalid authentication data");
//       return res.status(401).json({
//         status: "error",
//         statusCode: 401,
//         message: "Authentication required",
//         data: { user: null, organizations: null },
//       });
//     }

//     const organizations = await Organization.find().select(
//       "name organizationType createdAt"
//     );
//     console.log("getOrganizations: Found organizations", {
//       count: organizations.length,
//     });

//     return res.status(200).json({
//       status: "success",
//       statusCode: 200,
//       message: organizations.length
//         ? "Organizations retrieved successfully"
//         : "No organizations found",
//       data: { user: null, organizations },
//     });
//   } catch (error) {
//     console.error("getOrganizations: Error", error);
//     return res.status(500).json({
//       status: "error",
//       statusCode: 500,
//       message: "Server error during organization retrieval",
//       data: { user: null, organizations: null },
//     });
//   }
// };

const addOrganization = async (req, res) => {
  const { name, organizationType } = req.body;
  console.log("addOrganization: Request received", {
    name,
    organizationType,
    user: req.user,
  });

  try {
    // Check authentication (middleware handles OrganizationManagement.createOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("addOrganization: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    if (!name?.trim() || !organizationType?.trim()) {
      console.log("addOrganization: Missing required fields");
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Organization name and type are required",
        data: { user: null, organization: null },
      });
    }

    const organization = new Organization({ name, organizationType });
    await organization.save();
    console.log("addOrganization: Organization saved", {
      organizationId: organization._id,
    });

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Organization created successfully",
      data: {
        user: null,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType,
          createdAt: organization.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("addOrganization: Error", error);
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Organization name already exists",
        data: { user: null, organization: null },
      });
    }
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization creation",
      data: { user: null, organization: null },
    });
  }
};

const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  console.log("deleteOrganization: Request received", {
    orgId: id,
    userId: req.user.id,
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check authentication (middleware handles OrganizationManagement.deleteOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("deleteOrganization: Invalid authentication data");
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("deleteOrganization: Invalid organization ID", { id });
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid organization ID",
        data: { user: null, organization: null },
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(id).session(session);
    if (!organization) {
      console.log("deleteOrganization: Organization not found", { orgId: id });
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, organization: null },
      });
    }

    // Get associated users and documents for logging
    const associatedUsers = await User.find({ organization: id })
      .select("_id email")
      .session(session);
    const associatedDocuments = await Document.find({ organization: id })
      .select("_id title")
      .session(session);

    // Delete associated users
    const userDeleteResult = await User.deleteMany(
      { organization: id },
      { session }
    );
    const userCount = userDeleteResult.deletedCount;

    // Delete associated documents
    const documentDeleteResult = await Document.deleteMany(
      { organization: id },
      { session }
    );
    const documentCount = documentDeleteResult.deletedCount;

    // Delete the organization
    await Organization.findByIdAndDelete(id, { session });

    // Log the deletion details
    console.log("deleteOrganization: Success", {
      orgId: id,
      deletedUsers: userCount,
      deletedDocuments: documentCount,
      associatedUsers: associatedUsers.map((user) => ({
        _id: user._id,
        email: user.email,
      })),
      associatedDocuments: associatedDocuments.map((doc) => ({
        _id: doc._id,
        title: doc.title,
      })),
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Organization deleted successfully along with ${userCount} user(s) and ${documentCount} document(s)`,
      data: { user: null, organization: null },
    });
  } catch (error) {
    console.error("deleteOrganization: Error", {
      message: error.message,
      stack: error.stack,
    });
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization deletion",
      data: { user: null, organization: null },
    });
  }
};

const updateOrganization = async (req, res) => {
  const { id } = req.params;
  const { name, organizationType } = req.body;
  console.log("updateOrganization: Request received", {
    orgId: id,
    name,
    organizationType,
    userId: req.user.id,
  });

  try {
    // Check authentication (middleware handles OrganizationManagement.editOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("updateOrganization: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, organization: null },
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("updateOrganization: Invalid organization ID", { id });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid organization ID",
        data: { user: null, organization: null },
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      console.log("updateOrganization: Organization not found", { orgId: id });
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found",
        data: { user: null, organization: null },
      });
    }

    let updated = false;

    // Update name if provided
    if (name && name.trim()) {
      // Check for duplicate name
      const existingOrg = await Organization.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingOrg) {
        console.log("updateOrganization: Organization name exists", { name });
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Organization name already exists",
          data: { user: null, organization: null },
        });
      }
      organization.name = name.trim();
      updated = true;
    }

    // Update organizationType if provided
    if (organizationType && organizationType.trim()) {
      organization.organizationType = organizationType.trim();
      updated = true;
    }

    // Validate input: at least one field must be provided
    if (!updated) {
      console.log("updateOrganization: No fields provided", {
        userId: req.user.id,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message:
          "At least one field (name or organizationType) is required for update",
        data: { user: null, organization: null },
      });
    }

    await organization.save();

    console.log("updateOrganization: Success", { orgId: id });
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization updated successfully",
      data: {
        user: null,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType,
          createdAt: organization.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("updateOrganization: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during organization update",
      data: { user: null, organization: null },
    });
  }
};

const getOrganizationMetrics = async (req, res) => {
  console.log("getOrganizationMetrics: Request received", { user: req.user });

  try {
    // Check authentication (middleware handles OrganizationManagement.viewOrganizations permission)
    if (!req.user || !req.user.id) {
      console.log("getOrganizationMetrics: Invalid authentication data");
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null, metrics: null },
      });
    }

    const totalOrganizations = await Organization.countDocuments();

    console.log("getOrganizationMetrics: Metrics retrieved", {
      totalOrganizations,
    });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization metrics retrieved successfully",
      data: {
        user: null,
        metrics: { totalOrganizations },
      },
    });
  } catch (error) {
    console.error("getOrganizationMetrics: Error", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during metrics retrieval",
      data: { user: null, metrics: null },
    });
  }
};

module.exports = {
  getOrganizations,
  addOrganization,
  deleteOrganization,
  updateOrganization,
  getOrganizationMetrics,
};
