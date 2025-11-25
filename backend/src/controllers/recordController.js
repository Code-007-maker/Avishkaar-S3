import { HealthRecord } from "../models/HealthRecord.js";
import { User } from "../models/User.js";
import { createAudit } from "../middleware/auditMiddleware.js";
import mongoose from "mongoose";

// Upload a record (patient or doctor uploading a file URL)
// recordController.js

export const createRecord = async (req, res) => {
  try {
    console.log("📝 Create Record Request:");
    console.log("Body:", req.body);
    console.log("User:", req.user);

    const { title, type, description, fileUrl, patientId } = req.body;
    
    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({ 
        error: "Title and type are required fields" 
      });
    }

    // Determine the actual patient ID
    const actualPatient = patientId || (req.user?.role === "patient" ? req.user._id : null);
    
    if (!actualPatient) {
      return res.status(400).json({ 
        error: "Patient ID required. User must be logged in as patient or provide patientId." 
      });
    }

    console.log("✅ Creating record for patient:", actualPatient);

    // Create the health record
    const record = await HealthRecord.create({
      patient: actualPatient,
      title,
      type,
      description: description || "",
      fileUrl: fileUrl || "",
      uploadedBy: req.user?._id || null,
    });

    console.log("✅ Record created:", record._id);

    // Create audit log (wrap in try-catch to not fail entire request)
    try {
      await createAudit({ 
        actor: req.user?._id, 
        actorRole: req.user?.role, 
        action: "CREATE_RECORD", 
        meta: { recordId: record._id }, 
        ip: req.ip 
      });
    } catch (auditErr) {
      console.error("⚠️ Audit log failed (non-critical):", auditErr.message);
    }

    res.status(201).json(record);
    
  } catch (err) {
    console.error("❌ Create Record Error:", err);
    
    // Send detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        error: "Server error", 
        details: err.message,
        stack: err.stack 
      });
    }
    
    res.status(500).json({ 
      error: "Server error creating record" 
    });
  }
};

export const getRecords = async (req, res) => {
  try {
    console.log("📋 Get Records Request:");
    console.log("User:", req.user);

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let query = {};
    
    // Patients see only their own records
    if (req.user.role === "patient") {
      query.patient = req.user._id;
    }
    // Doctors can see all records (or add filtering logic here)
    // else if (req.user.role === "doctor") {
    //   // Add doctor-specific filtering if needed
    // }

    const records = await HealthRecord.find(query)
      .populate("patient", "name email")
      .populate("doctorNotes.doctor", "name")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${records.length} records`);

    res.json({ records });
    
  } catch (err) {
    console.error("❌ Get Records Error:", err);
    res.status(500).json({ error: "Server error fetching records" });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    console.log("🗑️ Delete Record Request:");
    console.log("Record ID:", req.params.id);
    console.log("User:", req.user);

    const record = await HealthRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Check if user is authorized to delete
    if (req.user.role === "patient" && record.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this record" });
    }

    await HealthRecord.findByIdAndDelete(req.params.id);

    // Create audit log
    try {
      await createAudit({ 
        actor: req.user._id, 
        actorRole: req.user.role, 
        action: "DELETE_RECORD", 
        meta: { recordId: req.params.id }, 
        ip: req.ip 
      });
    } catch (auditErr) {
      console.error("⚠️ Audit log failed (non-critical):", auditErr.message);
    }

    console.log("✅ Record deleted");
    res.json({ message: "Record deleted successfully" });
    
  } catch (err) {
    console.error("❌ Delete Record Error:", err);
    res.status(500).json({ error: "Server error deleting record" });
  }
};
// Doctor adds a note to a record (doctor must have an active session - handled in accessController)
export const addDoctorNote = async (req, res) => {
  try {
    const { id } = req.params; // record id
    const { note } = req.body;
    const record = await HealthRecord.findById(id);
    if (!record) return res.status(404).json({ error: "Not found" });

    // req.user expected to be doctor (or accessed via session)
    if (!req.user || req.user.role !== "doctor") return res.status(403).json({ error: "Forbidden" });

    record.doctorNotes.push({ doctor: req.user._id, note });
    await record.save();

    await createAudit({ actor: req.user._id, actorRole: "doctor", action: "ADD_DOCTOR_NOTE", meta: { recordId: id }, ip: req.ip });
    res.json({ message: "Note added", record });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET records for a patient with search & filters: date range & type
// export const getRecords = async (req, res) => {
//   try {
//     const { patientId, type, from, to, q, page = 1, limit = 20 } = req.query;

//     // Build query
//     const query = {};
//     if (patientId) query.patient = patientId;
//     if (type) query.type = type;
//     if (from || to) query.createdAt = {};
//     if (from) query.createdAt.$gte = new Date(from);
//     if (to) query.createdAt.$lte = new Date(to);
//     if (q) query.$or = [
//       { title: { $regex: q, $options: "i" } },
//       { description: { $regex: q, $options: "i" } }
//     ];

//     const skip = (Number(page) - 1) * Number(limit);
//     const records = await HealthRecord.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("doctorNotes.doctor", "name email");

//     res.json({ records, count: records.length });
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// };
