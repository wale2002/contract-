const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Set up Google Drive API- documentation
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

// Configure Multer for local temporary storage
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

module.exports = { drive, upload };
