/**
 * cleanupMongo.js
 * Run once to remove all duplicate/stale destinations from MongoDB
 * and re-seed cleanly from destinations.json.
 *
 * Usage:  node backend/scripts/cleanupMongo.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/travel-planner";
const dataPath = path.join(__dirname, "../data/destinations.json");

async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  const db = mongoose.connection.db;
  const destinations = db.collection("destinations");

  // Count before
  const before = await destinations.countDocuments();
  console.log(`📊 Destinations before cleanup: ${before}`);

  // Drop all existing destination documents
  await destinations.deleteMany({});
  console.log("🗑️  Cleared all destination documents");

  // Read fresh JSON
  const json = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`📂 Loaded ${json.length} destinations from JSON`);

  // Re-insert clean
  await destinations.insertMany(json);
  console.log(`✅ Re-seeded ${json.length} destinations into MongoDB`);

  // Verify
  const after = await destinations.countDocuments();
  console.log(`📊 Destinations after cleanup: ${after}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Done!");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
