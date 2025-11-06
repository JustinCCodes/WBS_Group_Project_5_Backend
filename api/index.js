const fs = require("fs");
const path = require("path");

console.log("=== SERVERLESS FUNCTION STARTING ===");

try {
  // Load from ./dist instead of ../dist
  console.log("Attempting to load app from ./dist/src/api-server/app...");
  const app =
    require("./dist/src/api-server/app").default ||
    require("./dist/src/api-server/app");
  console.log("✓ App loaded successfully");

  console.log("Attempting to load connectDB...");
  const { connectDB } = require("./dist/src/shared/db");
  console.log("✓ connectDB loaded successfully");

  connectDB().catch((err) => {
    console.error("Failed to connect to database:", err);
  });

  console.log("=== SERVERLESS FUNCTION READY ===");
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
