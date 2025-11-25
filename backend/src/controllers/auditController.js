// src/controllers/auditController.js

import {AuditLog} from "../models/AuditLog.js";

/**
 * @desc Get all audit logs (with optional filters)
 * @route GET /api/audit
 * @access Admin / Doctor (Authenticated)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { actionType, userId, startDate, endDate } = req.query;

    let filter = {};

    if (actionType) filter.actionType = actionType;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.timestamp = {};

      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate("userId", "name email")
      .populate("recordId", "recordType");

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

/**
 * @desc Delete All Logs (Optional for Admin)
 * @route DELETE /api/audit
 */
export const clearAuditLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.json({ success: true, message: "All audit logs cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing audit logs" });
  }
};
