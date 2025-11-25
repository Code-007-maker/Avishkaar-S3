import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["lab", "scan", "prescription", "report","other"], default: "other" },
  description: String,
  fileUrl: String, // store uploaded file URL or S3 path
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // patient or doctor
  doctorNotes: [
    {
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);
