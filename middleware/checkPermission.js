const User = require("../models/User"); // Adjust the path based on your project structure
const Role = require("../models/Role"); // Add this import if not already present; assuming Role model exists

const checkPermission = (permissionPath) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("role");
    if (!user) {
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Authentication required",
        data: { user: null },
      });
    }

    // Add null check for role after population
    if (!user.role) {
      console.error("checkPermission: Role not populated for user", {
        userId: req.user.id,
      });
      return res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Server error: Invalid user role",
        data: { user: null },
      });
    }

    // Allow superAdmin to bypass permission checks
    if (user.role.name === "superAdmin") {
      return next();
    }

    // Add null check for permissions object
    if (!user.role.permissions || typeof user.role.permissions !== "object") {
      console.error("checkPermission: Invalid permissions structure", {
        userId: req.user.id,
        roleName: user.role.name,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Invalid role permissions",
        data: { user: null },
      });
    }

    // Navigate permission path (e.g., "UserManagement.viewUsers")
    const [category, permission] = permissionPath.split(".");
    if (!category || !permission) {
      console.error("checkPermission: Invalid permission path", {
        permissionPath,
      });
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid permission path format",
        data: { user: null },
      });
    }

    if (!user.role.permissions[category]?.[permission]) {
      console.log(`checkPermission: Unauthorized for ${permissionPath}`, {
        userId: req.user.id,
        roleName: user.role.name,
      });
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: `Unauthorized: ${permissionPath} permission required`,
        data: { user: null },
      });
    }

    next();
  } catch (error) {
    console.error("checkPermission: Error", error, {
      userId: req.user?.id,
      permissionPath,
    });
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error during permission check",
      data: { user: null },
    });
  }
};

module.exports = checkPermission;
