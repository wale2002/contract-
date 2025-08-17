const validateDocumentUpload = (req, res, next) => {
  const { name, documentType } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Document name is required" });
  }
  if (
    documentType &&
    !["SLA", "SOW", "Co-location", "NDA", "Other"].includes(documentType)
  ) {
    return res.status(400).json({ message: "Invalid document type" });
  }
  next();
};

module.exports = { validateDocumentUpload };
