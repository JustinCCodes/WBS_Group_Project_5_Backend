const app =
  require("../dist/api-server/app").default ||
  require("../dist/api-server/app");
const { connectDB } = require("../dist/shared/db");

// Ensure database connection before handling requests
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

module.exports = app;
