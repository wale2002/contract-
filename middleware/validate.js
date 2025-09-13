// const validateDocumentUpload = (req, res, next) => {
//   const { name, documentType } = req.body;
//   if (!name) {
//     return res.status(400).json({ message: "Document name is required" });
//   }
//   if (
//     documentType &&
//     !["SLA", "Contract", "Co-location", "NDA", "Other"].includes(documentType)
//   ) {
//     return res.status(400).json({ message: "Invalid document type" });
//   }
//   next();
// };

// module.exports = { validateDocumentUpload };

const validateDocumentUpload = (req, res, next) => {
  const { documentName, documentType, startDate, expiryDate } = req.body;

  // Validate document name
  if (!documentName || !documentName.trim()) {
    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "Document name is required",
      data: { token: null, user: null, document: null },
    });
  }

  // Validate document type
  if (
    documentType &&
    !["SLA", "NDA", "Contract", "Other"].includes(documentType)
  ) {
    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "Invalid document type",
      data: { token: null, user: null, document: null },
    });
  }

  // Validate startDate if provided
  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate)) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid start date format",
        data: { token: null, user: null, document: null },
      });
    }
  }

  // Validate expiryDate if provided
  if (expiryDate) {
    const parsedExpiryDate = new Date(expiryDate);
    if (isNaN(parsedExpiryDate)) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid expiry date format",
        data: { token: null, user: null, document: null },
      });
    }
    // Ensure expiryDate is after startDate if both provided
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (parsedExpiryDate <= parsedStartDate) {
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Expiry date must be after start date",
          data: { token: null, user: null, document: null },
        });
      }
    }
  }

  next();
};

module.exports = { validateDocumentUpload };
