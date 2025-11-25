🏥 MediBuddy – Secure & Portable Electronic Health Records (EHR) System
Problem Statement ID: AVS319 — Medical & Health
🚀 Hackathon Project – Portable, Patient-Controlled EHR with OTP-Based Access

Patients often lose their medical history when switching hospitals or visiting new doctors. This leads to repeated tests, higher costs, and even life-threatening misdiagnosis. Current systems are fragmented, and patients have no unified, secure way to carry and share their health records.

MediBuddy solves this.

🧠 What We Built

A secure, patient-controlled Electronic Health Record (EHR) system that allows patients to store medical reports digitally and share them temporarily with a doctor using:

OTP Verification

QR-Code Based Access

Doctors get time-limited access, ensuring privacy & security.
Patients get complete control over their records.

🎯 Key Features
🔐 1. Patient-Controlled Data Access
Patients decide who can see their records.
Doctors cannot access anything without patient approval.

🔑 2. Doctor Access via OTP
Patients share their email → doctor enters it →
Patient receives OTP → doctor logs in → temporary access granted.

🕒 3. Auto-Logout Security
Doctor sessions expire automatically after a fixed duration
(e.g., 30 minutes) to prevent misuse.

📂 4. Upload & Manage Medical Records
Patients can upload:
Prescriptions
Lab reports
X-rays and scans
Treatment notes
PDF / image files
All stored securely in the cloud.

📝 5. Doctor Can Add Notes
Doctors can add notes to a patient’s record — useful for follow-up treatments.

🔍 6. Smart Record Search & Filters
Sort by:
Date
Type (lab report, prescription, etc.)
Keyword search

✨ 7. Modern UI + Fast Performance
Built with React + Tailwind + Vite
Backend powered by Node.js + Express + MongoDB.

🛠️ Tech Stack:
🖥️ Frontend
React (v19)
Tailwind CSS
Vite
React Hot Toast

🗄️ Backend
Node.js + Express
MongoDB + Mongoose
JWT Authentication
Secure OTP System
Audit Logging

🔐 Security
Encrypted tokens
Time-bound sessions
IP logging for audit
Sanitized database operations
OTP-based access control
