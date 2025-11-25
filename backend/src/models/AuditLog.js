import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  actorRole: String, // "patient" | "doctor" | "system"
  action: String, // e.g., "CREATE_RECORD", "DELETE_RECORD", "ACCESS_GRANTED"
  meta: mongoose.Schema.Types.Mixed,
  ip: String,
  createdAt: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model("AuditLog", auditSchema);
