import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DoctorDashboard({ onLogout }) {
  
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [activeRecordNote, setActiveRecordNote] = useState(null);
  const [autoLogoutTimer, setAutoLogoutTimer] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState(null);
const [records, setRecords] = useState([
  {
    _id: "demo123",
    title: "Blood report",
    type: "Report",
    description: "Blood group test",
    fileUrl: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.drlogy.com%2Fplus%2Fblood-report-format%3Fsrsltid%3DAfmBOorP4And9Fb9TnJ99lQwvCXmTVfufmcVnYpk-a2koYC1GVhkWwNj&psig=AOvVaw3EADSU16oVBoqayRlI_H9n&ust=1764181203698000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCMiFraL1jZEDFQAAAAAdAAAAABAE",
    date: new Date().toISOString(),
    doctorNotes: [
      {
        note: "Hemoglobin slightly low. Recommend iron supplements.",
        createdAt: new Date().toISOString()
      }
    ],
    patient: "demo-patient-001"
  }
]);

  const email = localStorage.getItem("medibuddy_user") || "doctor@example.com";

  // Auto logout after 30 min of inactivity
  const setupAutoLogout = () => {
    if (autoLogoutTimer) clearTimeout(autoLogoutTimer);
    const timer = setTimeout(() => {
      alert("Session expired. Logging out...");
      handleLogout();
    }, 30 * 60 * 1000); // 30 minutes
    setAutoLogoutTimer(timer);
  };

  useEffect(() => {
    setupAutoLogout();
    window.addEventListener("mousemove", setupAutoLogout);
    window.addEventListener("keydown", setupAutoLogout);

    // Fetch records on mount
    fetchRecordsViaSession();

    return () => {
      clearTimeout(autoLogoutTimer);
      window.removeEventListener("mousemove", setupAutoLogout);
      window.removeEventListener("keydown", setupAutoLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("medibuddy_user");
    localStorage.removeItem("sessionToken");
    if (onLogout) onLogout();
  };

  // Fetch patient records using the session token from OTP verification
  const fetchRecordsViaSession = async () => {
    setLoading(true);
    setError(null);

    // Check for session token (from OTP verification flow)
    const sessionToken = localStorage.getItem("sessionToken");
    
    if (!sessionToken) {
      setError("No active patient session. Please request access via patient email and OTP.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/access/patient-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });

      if (res.status === 401) {
        setError("Session expired or invalid. Please request access again.");
        localStorage.removeItem("sessionToken");
        setRecords([]);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch records");
      }

      const data = await res.json();
      
      if (data && Array.isArray(data.records)) {
        const mappedRecords = data.records.map((r) => ({
          _id: r._id,
          title: r.title || "Untitled",
          type: r.type || "General",
          description: r.description || "",
          fileUrl: r.fileUrl || "",
          date: r.createdAt,
          doctorNotes: r.doctorNotes || [],
          patient: r.patient,
        }));
        
        setRecords(mappedRecords);
        
        // Set session info for display
        if (mappedRecords.length > 0) {
          setSessionInfo({
            patientId: data.records[0].patient,
            recordCount: mappedRecords.length,
            sessionExpiry: data.expiresAt,
          });
        }
      } else {
        setRecords([]);
        setError("No records found for this patient.");
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
      setError(err.message || "Failed to fetch records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (recordId) => {
    if (!noteText.trim()) {
      alert("Please enter note text");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token. Please login.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/doctor-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: noteText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add note");
      }

      setNoteText("");
      setActiveRecordNote(null);
      
      // Refresh records to show the new note
      await fetchRecordsViaSession();
      
      alert("Note added successfully");
    } catch (err) {
      console.error("Failed to add note:", err);
      alert(err.message || "Error adding note");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              MediBuddy • Doctor Console
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-emerald-700">
              Patient Records Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Signed in as{" "}
              <span className="font-medium">
                Doctor • {email}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-100">
              Role: Doctor
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6">
          {/* Session info banner */}
          {sessionInfo && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">
                    Active Patient Session
                  </h3>
                  <div className="text-xs text-blue-700/80 space-y-1">
                    <p>Patient ID: <span className="font-medium">{sessionInfo.patientId}</span></p>
                    <p>Total Records: <span className="font-medium">{sessionInfo.recordCount}</span></p>
                    {sessionInfo.sessionExpiry && (
                      <p>Session expires: <span className="font-medium">{new Date(sessionInfo.sessionExpiry).toLocaleString()}</span></p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("sessionToken");
                    setRecords([]);
                    setSessionInfo(null);
                    alert("Session cleared. Please request new access.");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  End Session
                </button>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-emerald-700/80">Total records</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">
                {records.length}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-800/70">
                Patient health records in current session.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 bg-blue-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-blue-700/80">Records with notes</p>
              <p className="mt-1 text-lg font-semibold text-blue-800">
                {records.filter(r => r.doctorNotes?.length > 0).length}
              </p>
              <p className="mt-0.5 text-[11px] text-blue-800/70">
                Records you've annotated with clinical notes.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-50 bg-purple-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-purple-700/80">Session status</p>
              <p className="mt-1 text-lg font-semibold text-purple-800">
                {sessionInfo ? "Active" : "No Session"}
              </p>
              <p className="mt-0.5 text-[11px] text-purple-800/70">
                Auto-logout after 30 minutes of inactivity.
              </p>
            </div>
          </div>

          {/* Records section */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-1.5">
              Patient Health Records
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Review patient records, add clinical notes, and access shared files. All notes are timestamped and stored securely.
            </p>

            {/* Error state */}
            {error && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-6 py-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-orange-800">Session Error</p>
                    <p className="text-xs text-orange-700 mt-1">{error}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      Please go back to the main dashboard and request patient access via email and OTP.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                  <p className="mt-3 text-sm text-gray-500">Loading records...</p>
                </div>
              </div>
            ) : records.length === 0 && !error ? (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-3 text-sm text-gray-600 font-medium">No records found</p>
                <p className="mt-1 text-xs text-gray-500">
                  No patient records are available for this session.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((r) => (
                  <div 
                    key={r._id} 
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Record header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-800">
                            {r.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Type: <span className="font-medium text-gray-700">{r.type}</span>
                            </span>
                            {r.date && (
                              <span className="inline-flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {new Date(r.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {r.fileUrl && (
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View File
                          </a>
                        )}
                      </div>
                      {r.description && (
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                          {r.description}
                        </p>
                      )}
                    </div>

                    {/* Doctor notes section */}
                    {r.doctorNotes?.length > 0 && (
                      <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100">
                        <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Clinical Notes ({r.doctorNotes.length})
                        </h4>
                        <div className="space-y-1.5">
                          {r.doctorNotes.map((n, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                              <span className="inline-block mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                              <p className="flex-1 leading-relaxed">{n.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add note section */}
                    <div className="px-5 py-4 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add clinical note..."
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                          value={activeRecordNote === r._id ? noteText : ""}
                          onChange={(e) => {
                            setNoteText(e.target.value);
                            setActiveRecordNote(r._id);
                          }}
                          onFocus={() => setActiveRecordNote(r._id)}
                        />
                        <button
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => addNote(r._id)}
                          disabled={activeRecordNote !== r._id || !noteText}
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 sm:px-8 py-3 bg-white">
          <p className="text-[11px] text-center text-gray-400">
            © {new Date().getFullYear()} MediBuddy • Secure patient record management system
          </p>
        </div>
      </div>
    </div>
  );
}