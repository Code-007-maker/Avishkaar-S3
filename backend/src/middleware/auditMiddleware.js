import { AuditLog } from "../models/AuditLog.js";

export async function logAction(req, res, next) {
  next();
}

export async function createAudit({ actor, actorRole, action, meta, ip }) {
  await AuditLog.create({ actor, actorRole, action, meta, ip });
}
