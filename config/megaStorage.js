// const { Storage } = require("megajs"); // Changed to 'megajs'
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");

// const storage = new Storage({
//   email: process.env.MEGA_EMAIL,
//   password: process.env.MEGA_PASSWORD,
// });

// async function initMega() {
//   await storage.ready;
//   console.log("MEGA: Storage initialized");
//   return storage;
// }

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: "./Uploads/",
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}_${file.originalname}`);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "application/pdf") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF files are allowed"), false);
//     }
//   },
// });

// module.exports = { mega: initMega, upload };

const { Storage } = require("megajs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure Uploads folder exists
const UPLOAD_DIR = path.join(__dirname, "Uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Initialize Mega storage
const storage = new Storage({
  email: process.env.MEGA_EMAIL,
  password: process.env.MEGA_PASSWORD,
});

async function initMega() {
  try {
    await storage.ready;
    console.log("MEGA: Storage initialized");
    return storage;
  } catch (err) {
    console.error("MEGA: Failed to initialize storage:", err.message);
    throw new Error(
      "Mega storage not available. Check network or credentials."
    );
  }
}

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
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

module.exports = { mega: initMega, upload };
