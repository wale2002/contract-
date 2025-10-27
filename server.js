require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const organizationRoutes = require("./routes/organizations");
const documentRoutes = require("./routes/documents");
const userRoutes = require("./routes/users");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Connect to MongoDB
connectDB();
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://fifthlab-collaboration.onrender.com",
  "http://localhost:5000",
  "http://localhost:8080",
  "http://localhost:2212",
  "http://localhost:2213",
  "https://msg-app-5mwq.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://cmp-sage.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new AppError(`CORS policy: Origin ${origin} not allowed`, 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on the port ${PORT}`));
