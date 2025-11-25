// backend/src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import accessRoutes from "./routes/accessRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

// Middleware


dotenv.config();

const app = express();

/**
 * Basic middlewares
 */
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "10mb" })); // accept json bodies
app.use(express.urlencoded({ extended: true }));

// dev logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}


/**
 * Connect to DB
 */
connectDB();

/**
 * Routes
 *
 * - /api/auth        : registration, login, forgot password, token generation
 * - /api/records     : patient record CRUD (protected by auth middleware inside routes)
 * - /api/access      : OTP/QR generation, verify OTP, create doctor session, doctor actions
 * - /api/audit       : audit logs (admin/readonly) - protected
 *
 * We apply auditMiddleware to routes that modify or access patient data to keep an access trail.
 */

// Public auth routes (register/login/forgot)
app.use("/api/auth", authRoutes);

// Protected record routes — run auditMiddleware to log accesses/changes
app.use("/api/records", recordRoutes);

// Access routes (OTP / QR flows, doctor sessions). These should be audited too.
app.use("/api/access", accessRoutes);

// Audit route (for admins / devs to query audit logs)
app.use("/api/audit", auditRoutes);

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

/**
 * Error handler (centralized)
 */


/**
 * Start server
 */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} (env: ${process.env.NODE_ENV || "dev"})`);
});


export default app;
