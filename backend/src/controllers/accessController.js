// src/controllers/accessController.js
import { AccessRequest } from "../models/AccessRequest.js";
import { User } from "../models/User.js";
import { DoctorSession } from "../models/DoctorSession.js";
import { HealthRecord } from "../models/HealthRecord.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { createAudit } from "../middleware/auditMiddleware.js";

/**
 * Doctor requests access — sends OTP (or QR) to patient email.
 * Body: { doctorName, doctorEmail, patientEmail, method }
 */
export const createAccessRequest = async (req, res) => {
  try {
    const { doctorName, doctorEmail, patientEmail, method = "otp" } = req.body;
    if (!patientEmail || !doctorName) return res.status(400).json({ error: "Missing fields" });

    const otp = method === "otp" ? generateOtp() : null;
    const qrToken = method === "qr" ? uuidv4() : null;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expiry: 5 minutes

    const request = await AccessRequest.create({
      doctorName,
      doctorEmail,
      patientEmail,
      otp,
      qrToken,
      method,
      expiresAt,
    });

    let html;
    if (method === "otp") {
      html = `<p>Dr. ${doctorName} requested access to your records. Use this OTP: <b>${otp}</b>. Expires in 5 minutes.</p>`;
    } else {
      const qrPayload = JSON.stringify({ qrToken, doctorName, doctorEmail });
      const dataUrl = await QRCode.toDataURL(qrPayload);
      html = `<p>Dr. ${doctorName} requested access to your records. Scan this QR in the clinic to grant access.</p><img src="${dataUrl}" />`;
    }

    // send email to patient
    await sendEmail(patientEmail, "Access request to your health records", html);

    await createAudit({ actorRole: "system", action: "CREATE_ACCESS_REQUEST", meta: { patientEmail, method, doctorName, doctorEmail }, ip: req.ip });
    res.json({ ok: true, method, message: "Access request sent to patient email." });
  } catch (err) {
    console.error("createAccessRequest error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Patient-provided OTP (or QR) verified -> create a DoctorSession for the doctor.
 * Body: { patientEmail, otp, qrToken, doctorNameOptional }
 * Note: This endpoint can be called by the patient OR by the doctor if the doctor obtains the OTP from patient.
 */
export const verifyAccess = async (req, res) => {
  try {
    const { patientEmail, otp, qrToken } = req.body;

    if (!patientEmail || (!otp && !qrToken)) {
      return res.status(400).json({ error: "Missing patientEmail or otp/qrToken" });
    }

    let request;
    if (otp) {
      request = await AccessRequest.findOne({ patientEmail, otp, verified: false });
    } else {
      request = await AccessRequest.findOne({ patientEmail, qrToken, verified: false });
    }

    if (!request) return res.status(400).json({ error: "Invalid token or otp" });
    if (new Date(request.expiresAt) < new Date()) return res.status(400).json({ error: "Expired" });

    // get patient
    const patient = await User.findOne({ email: patientEmail });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // mark OTP/QR verified
    request.verified = true;
    request.patientId = patient._id;
    await request.save();

    // create doctor session (NO doctor registration required!)
    const sessionToken = uuidv4();
    const sessionExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    const doctorSession = await DoctorSession.create({
      doctorName: request.doctorName,
      doctorEmail: request.doctorEmail,
      patientId: patient._id,
      sessionToken,
      expiresAt: sessionExpires
    });

    res.json({
      sessionToken,
      expiresAt: sessionExpires,
    });

  } catch (err) {
    console.error("verifyAccess error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Validate session token and return allowed patient id + doctorName + expiry
 * Body: { sessionToken }
 */
export const validateSession = async (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });

    const session = await DoctorSession.findOne({ sessionToken });
    if (!session) return res.status(401).json({ error: "Invalid session" });
    if (new Date(session.expiresAt) < new Date()) return res.status(401).json({ error: "Session expired" });

    res.json({ patientId: session.patient, doctorName: session.doctorName, expiresAt: session.expiresAt });
  } catch (err) {
    console.error("validateSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * New: Return patient records given a valid sessionToken.
 * Body: { sessionToken }
 * This allows a doctor (who has sessionToken but not JWT) to fetch patient records
 * for the duration of the session.
 */
export const getPatientRecordsBySession = async (req, res) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) return res.status(400).json({ error: "sessionToken required" });

    const session = await DoctorSession.findOne({ sessionToken });
    if (!session) return res.status(401).json({ error: "Invalid session" });
    if (new Date(session.expiresAt) < new Date()) return res.status(401).json({ error: "Session expired" });

    // Fetch patient's records
    const records = await HealthRecord.find({ patient: session.patient }).sort({ createdAt: -1 }).populate("doctorNotes.doctor", "name email");

    await createAudit({ actorRole: "doctor_session", action: "VIEW_RECORDS_BY_SESSION", meta: { sessionId: session._id, patient: session.patient }, ip: req.ip });

    res.json({ records });
  } catch (err) {
    console.error("getPatientRecordsBySession error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
