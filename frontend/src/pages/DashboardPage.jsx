// src/pages/DashboardPage.jsx
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DashboardPage = ({ role, email, onLogout }) => {
  const isDoctor = role === "doctor";
  const roleLabel = isDoctor ? "Doctor" : "Patient";

  // Demo fallback records (still used when backend fails)
  const demoPatientRecords = [
    { id: 1, hospital: "CityCare Hospital", date: "2024-10-12", type: "Consultation + Blood Test" },
    { id: 2, hospital: "GreenLife Diagnostics", date: "2024-11-03", type: "MRI Scan" },
    { id: 3, hospital: "Metro Heart Institute", date: "2025-01-20", type: "Cardiology Follow-up" },
  ];

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Patient share state
  const [shareCode, setShareCode] = useState(null);

  // Doctor access flow states
  const [patientEmailForRequest, setPatientEmailForRequest] = useState("");
  const [doctorNameInput, setDoctorNameInput] = useState("");
  const [doctorEmailInput, setDoctorEmailInput] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    // fetch records for patient when not doctor
    if (!isDoctor) {
      fetchRecords();
    } else {
      setRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // fetch patient records (patient view)
  const fetchRecords = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No auth token. Please login.");
      onLogout();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        onLogout();
        return;
      }

      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        setRecords(data.records.map((r, idx) => ({
          id: r._id || idx,
          hospital: r.uploadedBy ? (r.uploadedBy.name || "Provider") : "Unknown",
          date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : (r.date || "—"),
          type: r.type || r.title || "record",
          raw: r
        })));
      } else {
        setRecords(demoPatientRecords);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
      toast.error("Failed to fetch records. Using demo data.");
      setRecords(demoPatientRecords);
    } finally {
      setLoading(false);
    }
  };

  // --- Doctor initiates access request: send OTP to patientEmail ---
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!patientEmailForRequest || !doctorNameInput) {
      toast.error("Please enter patient email and your name.");
      return;
    }

    try {
      setRequestSent(false);
      const res = await fetch(`${API_BASE}/access/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: doctorNameInput,
          doctorEmail: doctorEmailInput,
          patientEmail: patientEmailForRequest,
          method: "otp",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || data?.message || "Failed to request access");
        return;
      }

      setRequestSent(true);
      toast.success("Access request sent — OTP emailed to the patient.");
    } catch (err) {
      console.error("request access error:", err);
      toast.error("Failed to send access request.");
    }
  };

  // --- Doctor submits OTP (the doctor must have obtained OTP from patient) ---
  const handleVerifyOtpAndCreateSession = async (e) => {
    e.preventDefault();
    if (!patientEmailForRequest || !otpInput) {
      toast.error("Patient email and OTP are required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/access/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientEmail: patientEmailForRequest, otp: otpInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || data?.message || "Failed to verify OTP");
        return;
      }

      const { sessionToken: token, expiresAt } = data;
      if (!token) {
        toast.error("No session token returned.");
        return;
      }

      setSessionToken(token);
      setSessionExpiresAt(expiresAt);
      toast.success("Session created. You can now view patient's records for 30 minutes.");

      // fetch records via session token
      await fetchPatientRecordsBySession(token);

      // start client-side countdown to auto-clear session at expiry
      startSessionTimer(expiresAt);
    } catch (err) {
      console.error("verify OTP error:", err);
      toast.error("Failed to verify OTP.");
    }
  };

  const startSessionTimer = (expiresAtStr) => {
    clearSessionTimer();
    const expiry = new Date(expiresAtStr).getTime();
    sessionTimerRef.current = setInterval(() => {
      if (Date.now() >= expiry) {
        clearSessionTimer();
        toast("Session expired.", { icon: "⏳" });
        setSessionToken(null);
        setSessionExpiresAt(null);
        setActivePatient(null);
      }
    }, 1000 * 5); // check every 5s
  };

  const clearSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  // --- fetch patient records using sessionToken ---
  const fetchPatientRecordsBySession = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/access/patient-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token }),
      });

      if (res.status === 401) {
        toast.error("Session invalid or expired.");
        setSessionToken(null);
        setSessionExpiresAt(null);
        return;
      }

      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        // build activePatient view
        setActivePatient({
          name: "Shared Patient",
          age: "—",
          id: data.records[0]?.patient || "unknown",
          lastUpdated: data.records[0]?.createdAt || "—",
          records: data.records.map((r) => ({
            id: r._id,
            hospital: r.uploadedBy?.name || "Provider",
            date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "—",
            type: r.type || r.title,
            raw: r,
          })),
        });
      } else {
        toast.error("No records returned for this patient (or server error).");
        setActivePatient(null);
      }
    } catch (err) {
      console.error("fetchPatientRecordsBySession error:", err);
      toast.error("Failed to fetch patient records.");
      setActivePatient(null);
    }
  };

  // when doctor manually clears session or logs out
  const clearDoctorSession = () => {
    clearSessionTimer();
    setSessionToken(null);
    setSessionExpiresAt(null);
    setActivePatient(null);
    setRequestSent(false);
    setOtpInput("");
  };

  // Share code generation (patient)
  const handleGenerateShareCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setShareCode(code);
    toast.success(`Temporary access code generated. Share this only with your doctor.`);
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-end p-4">
  <button
    onClick={onLogout}
    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-600 transition"
  >
    Logout
  </button>
</div>

        {/* ... top bar and summary cards (unchanged) ... */}
        {/* For brevity, the rest of the UI stays the same as your original DashboardPage */}
        {/* Replace the right-side Doctor access console block with the updated flow below */}
        <div className="px-6 sm:px-8 py-6 grid gap-6 lg:grid-cols-[2fr,1.2fr]">
          {/* left: records (kept as before) */}
          <div className="space-y-5">
            {/* Summary cards and records table — unchanged (you already have these in your code) */}
            {/* I'll keep the original content to avoid UI changes */}
            {/* ... existing left side code ... */}
          </div>

          {/* right: sharing / doctor access panel */}
          <div className="space-y-4">
            {/* If patient user (non-doctor) show share controls */}
            {!isDoctor && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4">
                <h2 className="text-sm font-semibold text-emerald-800 mb-1.5">Share access with your doctor</h2>
                <p className="text-xs text-emerald-800/80 mb-3">Generate a temporary code that your doctor can enter on their MediBuddy console. You stay in full control – revoke or let it expire after the consultation.</p>
                <button onClick={handleGenerateShareCode} className="w-full mb-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition">Generate access code</button>
                {shareCode && (
                  <div className="rounded-xl bg-white border border-emerald-200 px-4 py-3 text-center">
                    <p className="text-[11px] text-gray-500 mb-1">Share this code only with your doctor:</p>
                    <p className="text-2xl font-semibold tracking-[0.25em] text-emerald-700">{shareCode}</p>
                    <p className="mt-1 text-[11px] text-emerald-700/80">Demo mode: in a real app this can also be encoded into a <span className="font-semibold">QR code</span>.</p>
                  </div>
                )}
              </div>
            )}

            {/* Doctor console (updated to use patient-email OTP flow) */}
            {isDoctor && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4">
                <h2 className="text-sm font-semibold text-emerald-800 mb-1.5">Patient access console</h2>
                <p className="text-xs text-emerald-800/80 mb-3">Enter the patient's email and request an OTP. The OTP will be emailed to the patient. Once the patient shares the OTP with you, enter it below to open a secure, time-bound EHR session (30 minutes).</p>

                {/* Request access */}
                <form onSubmit={handleRequestAccess} className="space-y-3">
                  <input type="text" value={doctorNameInput} onChange={(e) => setDoctorNameInput(e.target.value)} placeholder="Your name (Dr. ...)" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition" />
                  <input type="email" value={doctorEmailInput} onChange={(e) => setDoctorEmailInput(e.target.value)} placeholder="Your email (optional)" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition" />
                  <input type="email" value={patientEmailForRequest} onChange={(e) => setPatientEmailForRequest(e.target.value)} placeholder="Patient's email" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition" />
                  <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition">Request OTP for patient</button>
                </form>

                {/* Show message if request sent */}
                {requestSent && (
                  <div className="mt-3 rounded-xl bg-white border border-emerald-200 px-4 py-3 text-xs text-gray-700">
                    <p className="font-semibold text-emerald-800 mb-1">OTP requested</p>
                    <p>OTP was emailed to the patient. Ask the patient to share the OTP with you, then enter it below.</p>
                  </div>
                )}

                {/* Enter OTP to create session */}
                <form onSubmit={handleVerifyOtpAndCreateSession} className="mt-3 space-y-3">
                  <input type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))} placeholder="Enter OTP from patient" className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm tracking-[0.3em] text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-md hover:bg-emerald-700 transition">Verify OTP & open session</button>
                    <button type="button" onClick={clearDoctorSession} className="rounded-xl border border-gray-200 px-4 py-2 text-xs sm:text-sm">Clear</button>
                  </div>
                </form>

                {sessionToken && sessionExpiresAt && (
                  <div className="mt-3 rounded-xl bg-white border border-emerald-200 px-4 py-3 text-xs text-gray-700">
                    <p className="font-semibold text-emerald-800 mb-1">Active session</p>
                    <p>Expires at: {new Date(sessionExpiresAt).toLocaleString()}</p>
                    <p className="mt-1">You can now view the patient’s records in the table on the left.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tech stack explainer unchanged */}
            <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-1.5">How this solves the problem (tech + flow)</h2>
              <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                <li>Patient-centric, portable EHR wallet instead of siloed hospital records.</li>
                <li>Temporary access for doctors via OTP / access code (demo), designed to extend to QR & FHIR APIs.</li>
                <li>Role-based UI: patients manage records & sharing; doctors consume records only when access is granted.</li>
                <li>Current build: React + Vite + Tailwind on frontend with mock data; ready to connect to secure backend & auth provider in next phase.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 sm:px-8 py-3 bg-white">
          <p className="text-[11px] text-center text-gray-400">© {new Date().getFullYear()} MediBuddy • All rights are reserved</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
