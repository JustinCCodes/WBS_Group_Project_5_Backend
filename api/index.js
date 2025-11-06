const fs = require("fs");
const path = require("path");

console.log("=== SERVERLESS FUNCTION STARTING ===");
console.log("Current directory:", __dirname);
console.log("Process cwd:", process.cwd());

// Check if dist exists
const distPath = path.join(__dirname, "..", "dist");
console.log("Looking for dist at:", distPath);

try {
  if (fs.existsSync(distPath)) {
    console.log("✓ dist/ folder exists");
    const distContents = fs.readdirSync(distPath);
    console.log("dist/ contents:", distContents);

    // Check for api-server
    const apiServerPath = path.join(distPath, "api-server");
    if (fs.existsSync(apiServerPath)) {
      console.log("✓ dist/api-server exists");
      console.log("api-server contents:", fs.readdirSync(apiServerPath));
    } else {
      console.error("✗ dist/api-server does NOT exist");
    }

    // Check for shared
    const sharedPath = path.join(distPath, "shared");
    if (fs.existsSync(sharedPath)) {
      console.log("✓ dist/shared exists");
    } else {
      console.error("✗ dist/shared does NOT exist");
    }
  } else {
    console.error("✗ dist/ folder does NOT exist at", distPath);
    console.log(
      "Parent directory contents:",
      fs.readdirSync(path.join(__dirname, ".."))
    );
  }
} catch (err) {
  console.error("Error checking file system:", err);
}

// Try to load the modules
try {
  console.log("Attempting to load app...");
  const app =
    require("../dist/api-server/app").default ||
    require("../dist/api-server/app");
  console.log("✓ App loaded successfully");

  console.log("Attempting to load connectDB...");
  const { connectDB } = require("../dist/shared/db");
  console.log("✓ connectDB loaded successfully");

  // Connect to database
  connectDB().catch((err) => {
    console.error("Failed to connect to database:", err);
  });

  console.log("=== SERVERLESS FUNCTION READY ===");
  module.exports = app;
} catch (error) {
  console.error("✗ ERROR loading modules:", error.message);
  console.error("Stack:", error.stack);

  // Export a minimal error app so at least something responds
  const express = require("express");
  const errorApp = express();

  errorApp.use((req, res) => {
    res.status(500).json({
      error: "Failed to initialize application",
      message: error.message,
      stack: error.stack,
    });
  });

  module.exports = errorApp;
}
