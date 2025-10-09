require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const Redis = require("ioredis");

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.MONGO_HOST;   // e.g., mongodb+srv://cluster0.lixbqmp.mongodb.net
const USER = process.env.MONGO_USER;   // comp263_2025
const PASS = process.env.MONGO_PASS;   // your password
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);

(function validateEnv() {
  const missing = [];
  if (!HOST) missing.push("MONGO_HOST");
  if (!USER) missing.push("MONGO_USER");
  if (!PASS) missing.push("MONGO_PASS");
  if (missing.length) {
    console.error("❌ Missing env var(s):", missing.join(", "));
    console.error("   Make sure .env is next to app.js and contains those keys.");
    process.exit(1);
  }
})();

const client = new MongoClient(`${HOST}/?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  auth: { username: USER, password: PASS },
  authSource: "admin"
});

const redis = new Redis(REDIS_URL);

let collection;
(async function start() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    const db = client.db("Lab2");
    collection = db.collection("Agriculture");

    const host = HOST.replace(/^mongodb\+srv:\/\//, "");
    const count = await collection.estimatedDocumentCount();
    console.log(`✅ Connected to ${host}`);
    console.log(`📚 Lab2.Agriculture docs: ${count}`);

    redis.on("connect", () => console.log("✅ Redis connected:", REDIS_URL));
    redis.on("error", (e) => console.error("❌ Redis error:", e.message));

    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ DB connection error:", err.message || err);
    process.exit(1);
  }
})();

// Timing helpers
function withTimer(handler) {
  return async (req, res) => {
    const t0 = process.hrtime.bigint();
    try {
      await handler(req, res, t0);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  };
}
function elapsedMs(t0) {
  return Number((process.hrtime.bigint() - t0) / 1000000n);
}

// Baseline: Mongo only (limit for readability)
app.get("/agriculture/mongo", withTimer(async (req, res, t0) => {
  if (!collection) return res.status(503).send("Database not initialized");
  const docs = await collection.find({}).limit(500).toArray();
  const body = { source: "mongo", timeMs: elapsedMs(t0), count: docs.length, data: docs };
  res.set("X-Response-Time", body.timeMs + "ms").json(body);
}));

// Redis cached
app.get("/agriculture/redis", withTimer(async (req, res, t0) => {
  if (!collection) return res.status(503).send("Database not initialized");

  // Optional: simple query param affects key (exten
