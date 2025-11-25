// src/routes/authRoutes.js
import express from "express";
import { register, login, forgotPassword } from "../controllers/authController.js";
import { createAccessRequest, verifyAccess } from "../controllers/accessController.js";

const router = express.Router();

router.post("/register", register);   // body: {name,email,password,role}
router.post("/login", login);         // body: {email,password}
router.post("/forgot", forgotPassword);

// doctor OTP flow mapped under auth for easier frontend calls
// doctor requests OTP (sends OTP to patient email)
router.post("/doctor/request-otp", createAccessRequest); // body: { doctorName, doctorEmail, patientEmail, method: "otp" }

// doctor verifies OTP (doctor sends patientEmail + otp), reusing verifyAccess
// returns: { sessionToken, expiresAt }
router.post("/doctor/verify-otp", verifyAccess);

export default router;
