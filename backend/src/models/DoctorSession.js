// src/models/DoctorSession.js
import mongoose from "mongoose";

const doctorSessionSchema = new mongoose.Schema({
  doctorName: { type: String, required: true },
  doctorEmail: { type: String, required: true },

  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  sessionToken: { type: String, required: true, unique: true },

  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

export const DoctorSession = mongoose.model("DoctorSession", doctorSessionSchema);
