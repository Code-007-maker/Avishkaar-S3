import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema({
  doctorName: String,
  doctorEmail: String, // optional
  patientEmail: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // resolved when exists
  otp: String,
  qrToken: String,        // token embedded in QR
  method: { type: String, enum: ["otp", "qr"], required: true },
  expiresAt: Date,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
