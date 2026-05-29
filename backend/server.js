require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { createRemoteJWKSet, jwtVerify } = require("jose");

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/travel-planner";
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const SUPABASE_JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

const dataPath = path.join(__dirname, "data", "destinations.json");
const packagesPath = path.join(__dirname, "data", "packages.json");

app.use(cors());
app.use(express.json());

let usingMongo = false;
let jsonDestinations = [];
let jsonPackagePrices = {};
let Destination;
let PackagePrice;
let User;

const slugifyDestinationName = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  return url.replace(/https?:\/\/plus\.unsplash\.com\//g, "https://images.unsplash.com/");
};

const repairDestinationImages = async () => {
  const docs = await Destination.find({});
  let fixed = 0;

  for (const doc of docs) {
    let changed = false;

    if (doc.heroImage && doc.heroImage.includes("plus.unsplash.com")) {
      doc.heroImage = normalizeImageUrl(doc.heroImage);
      changed = true;
    }

    if (Array.isArray(doc.images)) {
      const nextImages = doc.images.map((img) => {
        if (typeof img === "string" && img.includes("plus.unsplash.com")) {
          changed = true;
          return normalizeImageUrl(img);
        }
        return img;
      });
      doc.images = nextImages;
    }

    if (changed) {
      await doc.save();
      fixed += 1;
    }
  }

  if (fixed > 0) {
    console.log(`✅ Normalized Unsplash image URLs for ${fixed} destinations`);
  }
};

const defaultPackagePrice = (dest) => {
  const budget = dest.expenses?.budget || {};
  const daily =
    (budget.accommodation || 0) +
    (budget.food || 0) +
    (budget.transport || 0) +
    (budget.activities || 0) +
    (budget.misc || 0);
  return Math.max(2500, daily * 3);
};

const readJsonData = () => {
  try {
    jsonDestinations = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch (err) {
    console.error("❌ Error loading destinations data:", err.message);
    jsonDestinations = [];
  }

  try {
    if (fs.existsSync(packagesPath)) {
      jsonPackagePrices = JSON.parse(fs.readFileSync(packagesPath, "utf-8"));
    } else {
      jsonPackagePrices = jsonDestinations.reduce((acc, dest) => {
        acc[dest.id] = defaultPackagePrice(dest);
        return acc;
      }, {});
      fs.writeFileSync(packagesPath, JSON.stringify(jsonPackagePrices, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("❌ Error loading package prices:", err.message);
    jsonPackagePrices = {};
  }

  console.log(`✅ Loaded ${jsonDestinations.length} destinations from JSON`);
};

const initMongoModels = () => {
  const destinationSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const packageSchema = new mongoose.Schema(
    {
      destinationId: { type: String, required: true, unique: true, index: true },
      packagePrice: { type: Number, required: true, min: 1 },
    },
    { timestamps: true }
  );
  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      supabaseId: { type: String, unique: true, sparse: true, index: true },
      role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    { timestamps: true }
  );

  Destination = mongoose.models.Destination || mongoose.model("Destination", destinationSchema, "destinations");
  PackagePrice = mongoose.models.PackagePrice || mongoose.model("PackagePrice", packageSchema, "package_prices");
  User = mongoose.models.User || mongoose.model("User", userSchema, "users");
};

const seedMongoFromJson = async () => {
  const jsonIds = new Set(jsonDestinations.map((d) => d.id).filter(Boolean));

  // ── Step 1: Upsert every destination from JSON into MongoDB ──────────────
  // This ensures all image/content changes in destinations.json are live in DB.
  let upsertedDests = 0;
  for (const dest of jsonDestinations) {
    if (!dest.id) continue;
    await Destination.updateOne(
      { id: dest.id },
      { $set: dest },
      { upsert: true }
    );
    upsertedDests += 1;
  }
  console.log(`✅ Upserted ${upsertedDests} destinations from JSON → MongoDB`);

  // ── Step 2: Delete any MongoDB records NOT present in the JSON ───────────
  // This removes stale/duplicate records automatically on every startup.
  const deleteResult = await Destination.deleteMany({
    $or: [
      { id: { $exists: false } },
      { id: null },
      { id: "" },
      { id: { $nin: [...jsonIds] } },
    ],
  });
  if (deleteResult.deletedCount > 0) {
    console.log(`🗑️  Removed ${deleteResult.deletedCount} stale destination(s) from MongoDB`);
  }

  // ── Step 2b: Remove duplicate names (e.g. sample data + JSON both had Shimla) ─
  const allDocs = await Destination.find({}).lean();
  const byName = new Map();
  for (const doc of allDocs) {
    const nameKey = slugifyDestinationName(doc.name || doc.id);
    if (!nameKey) continue;
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey).push(doc);
  }
  let removedDupes = 0;
  for (const docs of byName.values()) {
    if (docs.length <= 1) continue;
    const keep = docs.find((d) => jsonIds.has(d.id)) || docs[0];
    for (const doc of docs) {
      if (String(doc._id) !== String(keep._id)) {
        await Destination.deleteOne({ _id: doc._id });
        removedDupes += 1;
      }
    }
  }
  if (removedDupes > 0) {
    console.log(`🗑️  Removed ${removedDupes} duplicate destination(s) by name`);
  }

  // ── Step 3: Ensure package prices exist for all destinations ─────────────
  const destinations = await Destination.find({}).lean();
  let upsertedCount = 0;
  for (const dest of destinations) {
    if (!dest.id) continue;
    const price = Number(jsonPackagePrices[dest.id] ?? defaultPackagePrice(dest));
    await PackagePrice.updateOne(
      { destinationId: dest.id },
      { $set: { destinationId: dest.id, packagePrice: price } },
      { upsert: true }
    );
    upsertedCount += 1;
  }

  // Clean up stale package prices too
  await PackagePrice.deleteMany({ destinationId: { $nin: [...jsonIds] } });
  console.log(`✅ Synced package prices for ${upsertedCount} destinations`);

  await repairDestinationImages();
};

const connectMongoIfAvailable = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    initMongoModels();
    await seedMongoFromJson();
    usingMongo = true;
    console.log("✅ MongoDB connected. Using database as primary store");
  } catch (err) {
    usingMongo = false;
    console.error("❌ MongoDB connection failed, using JSON fallback:", err.message);
  }
};

const sanitizeUser = (userDoc) => ({
  id: String(userDoc._id),
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
});

const extractNameFromEmail = (email = "") => {
  const head = String(email).split("@")[0] || "Traveler";
  return head
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
};

const ensureLocalUserFromSupabase = async (payload) => {
  const supabaseId = String(payload.sub || "");
  const normalizedEmail = String(payload.email || "").toLowerCase().trim();
  if (!supabaseId || !normalizedEmail) return null;

  const forcedRole = ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "user";
  const fallbackName = extractNameFromEmail(normalizedEmail);

  const user = await User.findOneAndUpdate(
    { $or: [{ supabaseId }, { email: normalizedEmail }] },
    {
      $set: {
        supabaseId,
        email: normalizedEmail,
        name:
          String(payload.user_metadata?.full_name || payload.user_metadata?.name || "").trim() || fallbackName,
        role: forcedRole,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return user;
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

  try {
    if (!SUPABASE_URL || !SUPABASE_JWKS) {
      return res.status(500).json({
        success: false,
        message: "Supabase auth is not configured. Set SUPABASE_URL in backend .env",
      });
    }

    const { payload } = await jwtVerify(token, SUPABASE_JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });

    if (!usingMongo) {
      return res
        .status(503)
        .json({ success: false, message: "Auth requires MongoDB. Please configure MONGO_URI." });
    }

    const user = await ensureLocalUserFromSupabase(payload);
    if (!user) return res.status(401).json({ success: false, message: "Invalid token" });
    req.user = user;
    req.authPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token", error: err.message });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }
  next();
};

const sanitizeDestinationImages = (dest) => {
  if (!dest) return dest;
  const next = { ...dest };
  if (next.heroImage) next.heroImage = normalizeImageUrl(next.heroImage);
  if (Array.isArray(next.images)) {
    next.images = next.images.map((img) => normalizeImageUrl(img));
  }
  return next;
};

const dedupeDestinations = (list) => {
  const jsonIdSet = new Set(jsonDestinations.map((d) => d.id).filter(Boolean));
  const byKey = new Map();

  for (const dest of list) {
    const key = (dest.id || slugifyDestinationName(dest.name)).toLowerCase();
    if (!key) continue;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, dest);
      continue;
    }

    const preferCurrent =
      jsonIdSet.has(dest.id) && !jsonIdSet.has(existing.id);
    if (preferCurrent) byKey.set(key, dest);
  }

  return [...byKey.values()];
};

const getAllDestinations = async () => {
  const list = usingMongo ? await Destination.find({}).lean() : jsonDestinations;
  return dedupeDestinations(list).map(sanitizeDestinationImages);
};

const getDestinationById = async (id) => {
  let dest;
  if (usingMongo) {
    const normalizedName = String(id).replace(/[-_]/g, " ");
    dest = await Destination.findOne({
      $or: [{ id }, { name: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i") }],
    }).lean();
  } else {
    dest = jsonDestinations.find((d) => d.id === id);
  }
  return sanitizeDestinationImages(dest);
};

const getPackagePriceMap = async () => {
  if (usingMongo) {
    const docs = await PackagePrice.find({}).lean();
    return docs.reduce((acc, item) => {
      acc[item.destinationId] = item.packagePrice;
      return acc;
    }, {});
  }
  return jsonPackagePrices;
};

const updatePackagePrice = async (destinationId, price) => {
  if (usingMongo) {
    await PackagePrice.updateOne(
      { destinationId },
      { $set: { packagePrice: Math.round(price) } },
      { upsert: true }
    );
    return Math.round(price);
  }

  jsonPackagePrices[destinationId] = Math.round(price);
  fs.writeFileSync(packagesPath, JSON.stringify(jsonPackagePrices, null, 2), "utf-8");
  return jsonPackagePrices[destinationId];
};

// ─── ROUTES ───────────────────────────────────────────────

app.post("/api/auth/register", async (_req, res) =>
  res.status(410).json({
    success: false,
    message: "Local register disabled. Use Supabase sign-up from frontend.",
  })
);

app.post("/api/auth/login", async (_req, res) =>
  res.status(410).json({
    success: false,
    message: "Local login disabled. Use Supabase sign-in from frontend.",
  })
);

app.get("/api/auth/me", authenticate, async (req, res) => {
  return res.json({ success: true, data: { user: sanitizeUser(req.user) } });
});

// GET /api/destinations — List all destinations (summary)
app.get("/api/destinations", async (req, res) => {
  const { region, search, sort } = req.query;

  const destinations = await getAllDestinations();
  const packagePrices = await getPackagePriceMap();

  let results = destinations.map((d) => {
    const resolvedId = d.id || slugifyDestinationName(d.name);
    return {
      id: resolvedId,
      name: d.name,
      tagline: d.tagline,
      region: d.region,
      state: d.state,
      heroImage: d.heroImage,
      rating: d.rating,
      bestTime: d.bestTime,
      duration: d.duration,
      highlights: (d.highlights || []).slice(0, 3),
      budgetPerDay:
        (d.expenses?.budget?.accommodation || 0) +
        (d.expenses?.budget?.food || 0) +
        (d.expenses?.budget?.transport || 0) +
        (d.expenses?.budget?.activities || 0) +
        (d.expenses?.budget?.misc || 0),
      packagePrice: packagePrices[resolvedId] ?? defaultPackagePrice(d),
    };
  });

  if (region && region !== "all") {
    results = results.filter((d) => d.region.toLowerCase().includes(String(region).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.highlights.some((h) => h.toLowerCase().includes(q))
    );
  }

  if (sort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sort === "budget") {
    results.sort((a, b) => a.budgetPerDay - b.budgetPerDay);
  } else if (sort === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({ success: true, count: results.length, data: results });
});

// GET /api/destinations/:id — Full destination details
app.get("/api/destinations/:id", async (req, res) => {
  const dest = await getDestinationById(req.params.id);
  if (!dest) {
    return res.status(404).json({ success: false, message: "Destination not found" });
  }
  res.json({ success: true, data: dest });
});

// GET /api/packages — List destination packages
app.get("/api/packages", async (req, res) => {
  const destinations = await getAllDestinations();
  const packagePrices = await getPackagePriceMap();
  const data = destinations.map((d) => ({
    id: d.id || slugifyDestinationName(d.name),
    name: d.name,
    region: d.region,
    duration: d.duration,
    packagePrice: Number(packagePrices[d.id || slugifyDestinationName(d.name)] ?? defaultPackagePrice(d)),
    heroImage: d.heroImage,
    tagline: d.tagline,
  }));
  res.json({ success: true, count: data.length, data });
});

// PUT /api/packages/:id — Update package price (admin)
app.put("/api/packages/:id", authenticate, requireRole("admin"), async (req, res) => {
  const { price } = req.body;
  const destinationId = req.params.id;
  const destination = await getDestinationById(destinationId);

  if (!destination) {
    return res.status(404).json({ success: false, message: "Destination not found" });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ success: false, message: "Price must be a positive number" });
  }

  try {
    const updatedPrice = await updatePackagePrice(destinationId, numericPrice);
    return res.json({
      success: true,
      message: "Package price updated",
      data: {
        id: destinationId,
        packagePrice: updatedPrice,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to persist package price" });
  }
});

// GET /api/destinations/:id/itinerary — Get itinerary only
app.get("/api/destinations/:id/itinerary", async (req, res) => {
  const dest = await getDestinationById(req.params.id);
  if (!dest) {
    return res.status(404).json({ success: false, message: "Destination not found" });
  }
  res.json({
    success: true,
    data: {
      destination: dest.name,
      duration: dest.duration,
      itinerary: dest.itinerary,
    },
  });
});

// POST /api/expenses/calculate — Calculate trip expenses
app.post("/api/expenses/calculate", async (req, res) => {
  const { destinationId, travelers, days, budgetTier } = req.body;

  if (!destinationId || !travelers || !days || !budgetTier) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: destinationId, travelers, days, budgetTier",
    });
  }

  const dest = await getDestinationById(destinationId);
  if (!dest) {
    return res.status(404).json({ success: false, message: "Destination not found" });
  }

  const tierKey = budgetTier === "budget" ? "budget" : budgetTier === "luxury" ? "luxury" : "midRange";
  const dailyCosts = dest.expenses[tierKey];

  const breakdown = {
    accommodation: dailyCosts.accommodation * days * Math.ceil(travelers / 2), // shared rooms
    food: dailyCosts.food * days * travelers,
    transport: dailyCosts.transport * days * Math.ceil(travelers / 4), // shared transport
    activities: dailyCosts.activities * days * travelers,
    miscellaneous: dailyCosts.misc * days * travelers,
  };

  const totalCost = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const perPerson = Math.round(totalCost / travelers);

  res.json({
    success: true,
    data: {
      destination: dest.name,
      travelers,
      days,
      budgetTier,
      breakdown,
      totalCost,
      perPerson,
      dailyPerPerson: Math.round(perPerson / days),
    },
  });
});

// GET /api/regions — List unique regions
app.get("/api/regions", async (req, res) => {
  const destinations = await getAllDestinations();
  const regions = [...new Set(destinations.map((d) => d.region))];
  res.json({ success: true, data: regions });
});

// POST /api/admin/sync-from-json — Re-sync all destinations from JSON into MongoDB
// Use this whenever you update destinations.json to push changes into the database.
app.post("/api/admin/sync-from-json", async (req, res) => {
  if (!usingMongo) {
    return res.json({
      success: true,
      message: "Running in JSON-only mode — no MongoDB sync needed. Changes in destinations.json are live immediately.",
    });
  }

  try {
    readJsonData(); // Re-read the latest JSON file from disk
    let synced = 0;
    const results = [];

    for (const dest of jsonDestinations) {
      if (!dest.id) continue;
      await Destination.updateOne(
        { id: dest.id },
        { $set: dest },
        { upsert: true }
      );
      results.push(dest.id);
      synced += 1;
    }

    await repairDestinationImages();

    return res.json({
      success: true,
      message: `✅ Synced ${synced} destinations from JSON into MongoDB.`,
      synced: results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sync failed",
      error: err.message,
    });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  const destinations = await getAllDestinations();
  res.json({
    status: "ok",
    mode: usingMongo ? "mongodb" : "json-fallback",
    authConfigured: Boolean(SUPABASE_URL && SUPABASE_JWKS),
    destinations: destinations.length,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  readJsonData();
  await connectMongoIfAvailable();
  const destinations = await getAllDestinations();

  const httpServer = app.listen(PORT, () => {
    console.log(`\n🌍 Travel Planner API running on http://localhost:${PORT}`);
    console.log(`📍 ${destinations.length} destinations available`);
    console.log(`🗄️ Store mode: ${usingMongo ? "MongoDB (primary)" : "JSON fallback"}`);
    console.log(`🔐 Supabase auth: ${SUPABASE_URL ? "configured" : "NOT configured (set SUPABASE_URL on Render)"}`);
    console.log("\nEndpoints:");
    console.log("  POST /api/auth/register  (deprecated; use Supabase)");
    console.log("  POST /api/auth/login     (deprecated; use Supabase)");
    console.log("  GET  /api/auth/me");
    console.log("  GET  /api/destinations");
    console.log("  GET  /api/destinations/:id");
    console.log("  GET  /api/packages");
    console.log("  PUT  /api/packages/:id   (admin only)");
    console.log("  GET  /api/destinations/:id/itinerary");
    console.log("  POST /api/expenses/calculate");
    console.log("  GET  /api/regions");
    console.log("  GET  /api/health\n");
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use. Stop other backend instances (Ctrl+C), then restart.\n`);
      process.exit(1);
    }
    throw err;
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      httpServer.close(() => process.exit(0));
    });
  }
};

startServer();
