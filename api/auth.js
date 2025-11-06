// Serverless entry for auth API
console.log("=== AUTH SERVERLESS FUNCTION STARTING ===");
try {
  const app =
    require("./dist/src/auth-server/app").default ||
    require("./dist/src/auth-server/app");
  const { connectDB } = require("./dist/src/shared/db");
  connectDB().catch((err) => {
    console.error("Failed to connect to database:", err);
  });
  module.exports = app;
} catch (error) {
  console.error("✗ ERROR:", error.message);
  const express = require("express");
  const errorApp = express();
  errorApp.use((req, res) => {
    res.status(500).json({
      error: "Failed to initialize application",
      message: error.message,
    });
  });
  module.exports = errorApp;
}
