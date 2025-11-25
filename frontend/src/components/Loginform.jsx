// src/components/LoginForm.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import RoleToggle from "./RoleToggle.jsx";
import AuthDialog from "./AuthDialog.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoginForm = ({ onLoginSuccess }) => {
  const [role, setRole] = useState("patient"); // "patient" | "doctor"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Register dialog state (we only require email+password per your choice A, but backend needs name => we'll send a simple name)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Doctor OTP flow state
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [patientEmailForOtp, setPatientEmailForOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // ----------------- Patient login (email + password) -----------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) return toast.error("Please enter a valid email.");
    if (role === "patient" && (!password || password.length < 6))
      return toast.error("Please enter your password (min 6 chars).");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return toast.error(data?.error || data?.message || "Login failed");
      }

      // Save token & user
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("medibuddy_user", JSON.stringify(data.user));

      toast.success("Login successful");
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data.user?.role || "patient", data.user?.email || email, data.user || null, data.token || null);
      }
    } catch (err) {
      console.error("login error", err);
      toast.error("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Registration (patient) -----------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(regEmail)) return toast.error("Enter a valid email");
    if (!regPassword || regPassword.length < 6) return toast.error("Password must be at least 6 chars");

    // inside your frontend registration handler
const payload = {
  name: regEmail.split("@")[0], // regName optional; fallback from email
  email: regEmail,
  password: regPassword,
  role: "patient"
};

const res = await fetch(`${API_BASE}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await res.json();
if (!res.ok) {
  // show friendly message
  toast.error(data?.error || "Registration failed");
} else {
  toast.success("Registered — please login");
  // optionally auto-login: store token & user
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("medibuddy_user", JSON.stringify(data.user));
  }
}

   
  };

  // ----------------- Doctor OTP: Request OTP to patient email -----------------
  const handleDoctorRequestOtp = async (e) => {
    e.preventDefault();

    if (!doctorName) return toast.error("Enter your name (doctor)");
    if (!validateEmail(patientEmailForOtp)) return toast.error("Enter a valid patient email");

    try {
      const res = await fetch(`${API_BASE}/auth/doctor/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName,
          doctorEmail: doctorEmail || undefined,
          patientEmail: patientEmailForOtp,
          method: "otp",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return toast.error(data?.error || data?.message || "Failed to request OTP");
      }

      setOtpRequested(true);
      toast.success("OTP sent to patient email (they must share it with you).");
    } catch (err) {
      console.error("request-otp error", err);
      toast.error("Network error while requesting OTP");
    }
  };

  // ----------------- Doctor OTP: Verify OTP (creates a DoctorSession and returns sessionToken) -----------------
  const handleDoctorVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail(patientEmailForOtp)) return toast.error("Patient email required");
    if (!otpInput || otpInput.length !== 6) return toast.error("Enter the 6-digit OTP");

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/doctor/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientEmail: patientEmailForOtp, otp: otpInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        return toast.error(data?.error || data?.message || "OTP verification failed");
      }

      // server returns { sessionToken, expiresAt }
      const { sessionToken, expiresAt } = data;
      if (!sessionToken) {
        toast.error("No session token returned by server");
        return;
      }

      // store session token and expiry for doctor flows
      const sessionObj = { sessionToken, expiresAt };
      localStorage.setItem("doctor_session", JSON.stringify(sessionObj));

      toast.success("OTP verified. Session active for limited time (30 minutes).");

      // Notify parent that doctor is logged in (role doctor). No backend JWT for doctor; we use sessionToken for access.
      if (typeof onLoginSuccess === "function") {
        // pass doctor email (entered) and session token via localStorage for the dashboard to use.
        onLoginSuccess("doctor", doctorEmail || patientEmailForOtp, { email: doctorEmail || "", role: "doctor" }, null);
      }
    } catch (err) {
      console.error("verify-otp error", err);
      toast.error("Network error while verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-emerald-50 px-6 py-6 sm:px-8 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-emerald-700">
            {role === "patient" ? "Login to MediBuddy" : "Doctor access"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {role === "patient"
              ? "Secure patient access with email + password."
              : "Request an OTP to the patient email, then enter OTP to open a time-limited session."}
          </p>
        </div>
      </div>

      <RoleToggle value={role} onChange={setRole} />

      {/* Patient Login */}
      {role === "patient" && (
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label className="block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm outline-none"
              placeholder="patient@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm outline-none"
              placeholder="Your password"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-3 flex items-center justify-between text-xs">
            <button type="button" onClick={() => setIsRegisterOpen(true)} className="text-emerald-700 underline">Register</button>
            <button type="button" onClick={() => toast("Forgot password flow (demo).")} className="text-gray-500 underline">Forgot?</button>
          </div>
        </form>
      )}

      {/* Doctor OTP Flow */}
      {role === "doctor" && (
        <div className="space-y-4">
          {/* Request OTP */}
          <form onSubmit={handleDoctorRequestOtp} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Your name</label>
              <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none" placeholder="Dr. John Smith" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Your email (optional)</label>
              <input value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none" placeholder="doctor@hospital.com" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Patient's email</label>
              <input value={patientEmailForOtp} onChange={(e) => setPatientEmailForOtp(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none" placeholder="patient@example.com" />
            </div>

            <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">Request OTP for patient</button>
          </form>

          {/* Verify OTP */}
          {otpRequested && (
            <form onSubmit={handleDoctorVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Enter OTP sent to patient</label>
                <input value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-center outline-none" placeholder="123456" />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={verifyingOtp} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">
                  {verifyingOtp ? "Verifying..." : "Verify OTP & Open Session"}
                </button>
                <button type="button" onClick={() => { setOtpRequested(false); setOtpInput(""); }} className="rounded-xl border px-4 py-2.5">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Register Dialog */}
      <AuthDialog open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register as Patient">
        <form className="space-y-3" onSubmit={handleRegisterSubmit}>
          <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
          <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} type="password" placeholder="Password (min 6 chars)" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs sm:text-sm font-medium text-white">Register</button>
          </div>
        </form>
      </AuthDialog>
    </div>
  );
};

export default LoginForm;
