import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { createAudit } from "../middleware/auditMiddleware.js";

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

export const register = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields: email and password are required" });
    }

    // Derive defaults if missing
    if (!name) {
      // take local-part of email as a fallback name
      name = String(email).split("@")[0] || "User";
    }
    if (!role) {
      role = "patient"; // default to patient if not provided
    }

    // Validate role explicitly to match schema
    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'patient' or 'doctor'." });
    }

    // Check duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create user
    const user = await User.create({ name, email, password, role });

    // Try to create audit record but do not fail registration if audit errors
    try {
      await createAudit({ actor: user._id, actorRole: role, action: "REGISTER", meta: { email }, ip: req.ip });
    } catch (auditErr) {
      console.error("Audit creation failed for register:", auditErr);
      // don't return error to client — registration succeeded
    }

    const token = signToken(user._id);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    // If mongoose validation error, give friendly response
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    // For duplicate key errors thrown by Mongo
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already registered (duplicate key)" });
    }
    res.status(500).json({ error: "Server error: " + (err.message || "unknown") });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user._id);
    await createAudit({ actor: user._id, actorRole: user.role, action: "LOGIN", meta: {}, ip: req.ip });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Forgot password: create reset token and email link (simple implementation)
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: "If email exists, reset link sent" }); // do not reveal
  const token = crypto.randomBytes(32).toString("hex");
  // Ideally store hashed token in DB with expiry. For brevity, send token in email and store in-memory or a collection.
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail(email, "Password reset", `Click to reset: <a href="${resetLink}">Reset</a>`);
  await createAudit({ actor: user?._id, actorRole: user?.role, action: "FORGOT_PASSWORD", meta: { email }, ip: req.ip });
  res.json({ message: "If email exists, reset link sent" });
};
