const Organization = require("../models/Organization");

const getOrganizations = async (req, res) => {
  console.log("getOrganizations: Request received", { user: req.user }); // Debug log
  try {
    const organizations = await Organization.find().select("name createdAt");
    console.log("getOrganizations: Found organizations", {
      count: organizations.length,
    }); // Debug log
    if (organizations.length === 0) {
      return res
        .status(200)
        .json({ message: "No organizations found", data: [] });
    }
    res.json({
      message: "Organizations retrieved successfully",
      data: organizations,
    });
  } catch (error) {
    console.error("getOrganizations: Error", error); // Debug log
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addOrganization = async (req, res) => {
  const { name } = req.body;
  console.log("addOrganization: Request received", { name, user: req.user }); // Debug log
  if (!name) {
    console.log("addOrganization: Missing name"); // Debug log
    return res.status(400).json({ message: "Organization name is required" });
  }

  try {
    const organization = new Organization({ name });
    await organization.save();
    console.log("addOrganization: Organization saved", {
      organizationId: organization._id,
    }); // Debug log
    res.status(201).json({
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    console.error("addOrganization: Error", error); // Debug log
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Organization name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  console.log("deleteOrganization: Request received", {
    orgId: id,
    userId: req.user.id,
  });

  try {
    // Check role
    if (req.user.role !== "admin") {
      console.log("deleteOrganization: Unauthorized", { userId: req.user.id });
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      console.log("deleteOrganization: Organization not found", { orgId: id });
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check for associated users or documents
    const userCount = await User.countDocuments({ organization: id });
    const documentCount = await Document.countDocuments({ organization: id });
    if (userCount > 0 || documentCount > 0) {
      console.log("deleteOrganization: Cannot delete, has associated data", {
        orgId: id,
        userCount,
        documentCount,
      });
      return res.status(400).json({
        message:
          "Cannot delete organization with associated users or documents",
      });
    }

    // Delete organization
    await Organization.findByIdAndDelete(id);

    console.log("deleteOrganization: Success", { orgId: id });
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("deleteOrganization: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateOrganization = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  console.log("updateOrganization: Request received", {
    orgId: id,
    name,
    userId: req.user.id,
  });

  try {
    // Validate input
    if (!name) {
      console.log("updateOrganization: Missing name", { userId: req.user.id });
      return res.status(400).json({ message: "Organization name is required" });
    }

    // Check role
    if (req.user.role !== "admin") {
      console.log("updateOrganization: Unauthorized", { userId: req.user.id });
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      console.log("updateOrganization: Organization not found", { orgId: id });
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check for duplicate name
    const existingOrg = await Organization.findOne({ name, _id: { $ne: id } });
    if (existingOrg) {
      console.log("updateOrganization: Organization name exists", { name });
      return res
        .status(400)
        .json({ message: "Organization name already exists" });
    }

    // Update organization
    organization.name = name;
    await organization.save();

    console.log("updateOrganization: Success", { orgId: id });
    res.json({
      message: "Organization updated successfully",
      data: {
        _id: organization._id,
        name: organization.name,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error("updateOrganization: Error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getOrganizationMetrics = async (req, res) => {
  console.log("getOrganizationMetrics: Request received", { user: req.user });

  try {
    if (!req.user || !req.user.id || !req.user.role) {
      console.log("getOrganizationMetrics: Invalid authentication data");
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "admin") {
      console.log("getOrganizationMetrics: Unauthorized", {
        userId: req.user.id,
      });
      return res.status(403).json({ message: "Only admins can view metrics" });
    }

    const totalOrganizations = await Organization.countDocuments();

    console.log("getOrganizationMetrics: Metrics retrieved", {
      totalOrganizations,
    });

    res.status(200).json({
      message: "Organization metrics retrieved successfully",
      data: { totalOrganizations },
    });
  } catch (error) {
    console.error("getOrganizationMetrics: Error", error);
    const isProduction = process.env.NODE_ENV === "production";
    res.status(500).json({
      message: "Server error",
      error: isProduction ? undefined : error.message,
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
