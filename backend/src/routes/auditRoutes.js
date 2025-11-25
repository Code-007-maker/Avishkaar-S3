// src/routes/auditRoutes.js

import express from "express";
import { getAuditLogs, clearAuditLogs } from "../controllers/auditController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAuditLogs);

router.delete("/", protect, clearAuditLogs);

export default router;
