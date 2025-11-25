// src/routes/accessRoutes.js
import express from "express";
import { createAccessRequest, verifyAccess, validateSession, getPatientRecordsBySession } from "../controllers/accessController.js";

const router = express.Router();

router.post("/request", createAccessRequest);       // doctor supply patientEmail, doctorName, method=otp|qr
router.post("/verify", verifyAccess);               // patient supplies otp or qrToken (or doctor supplies otp acquired from patient)
router.post("/validate-session", validateSession);  // doctor passes sessionToken
router.post("/patient-records", getPatientRecordsBySession); // doctor fetches patient records using sessionToken

export default router;
