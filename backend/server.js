const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const taskRoutes = require("./routes/tasks");
const projectRoutes = require("./routes/projects");
const habitRoutes = require("./routes/habits");
const ideaRoutes = require("./routes/ideas");
const jobRoutes = require("./routes/jobs");
const learningRoutes = require("./routes/learning");
const journalRoutes = require("./routes/journal");
const activityRoutes = require("./routes/activity");
const budgetRoutes = require("./routes/budget");
const aiRoutes = require("./routes/ai");
const knowledgeRoutes = require("./routes/knowledge");
const lifeVisionRoutes = require("./routes/lifeVision");
const dailyStatRoutes = require("./routes/dailyStat");
const achievementRoutes = require("./routes/achievements");

// ── Bootstrap ──────────────────────────────────────────────────────────────────
dotenv.config();
connectDB();

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date() });
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/vision", lifeVisionRoutes);
app.use("/api/daily-stats", dailyStatRoutes);
app.use("/api/achievements", achievementRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Centralised error handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `\n🚀  SahilOS API running on http://localhost:${PORT}  [${process.env.NODE_ENV}]\n`
  );
});

// Graceful shutdown
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  server.close(() => process.exit(1));
});

// ── Keep-alive ping (prevents Render free tier from sleeping) ─────────────────
// Pings own health endpoint every 14 minutes in production
if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
  const https = require("https");
  const PING_URL = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
  const INTERVAL = 14 * 60 * 1000; // 14 minutes

  setInterval(() => {
    https.get(PING_URL, (res) => {
      console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
    }).on("error", (err) => {
      console.warn("⚠️  Keep-alive ping failed:", err.message);
    });
  }, INTERVAL);

  console.log(`🏓 Keep-alive enabled — pinging every 14 minutes`);
}

module.exports = app;