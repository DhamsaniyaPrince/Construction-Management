const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ContractorHub API running",
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/material-requests", require("./routes/materialRequestRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/equipment", require("./routes/equipmentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/blueprints", require("./routes/blueprintRoutes"));

// 404 handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error("Not Found"));
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
