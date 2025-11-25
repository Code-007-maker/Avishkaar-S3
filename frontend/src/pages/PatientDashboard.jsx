import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/records";

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: "",
    type: "",
    description: "",
    fileUrl: ""
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Fetch records
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📡 Fetching records...");
      
      const res = await axios.get(API, { headers });
      console.log("✅ Records fetched:", res.data);
      
      setRecords(res.data.records || []);
      setLoading(false);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setLoading(false);
      
      // If token expired or invalid → force logout
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        setError(error.response?.data?.error || "Failed to load records");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      loadRecords();
    }
  }, []);

  // Upload new record
  const uploadRecord = async () => {
    // Validation
    if (!form.title?.trim()) {
      alert("⚠️ Title is required");
      return;
    }
    
    if (!form.type) {
      alert("⚠️ Please select a record type");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      console.log("📤 Uploading record:", form);
      
      const res = await axios.post(API, { ...form }, { headers });
      
      console.log("✅ Record uploaded:", res.data);
      
      // Clear form
      setForm({ title: "", type: "", description: "", fileUrl: "" });
      
      // Show success message
      alert("✅ Record uploaded successfully!");
      
      // Reload records
      loadRecords();
      
    } catch (error) {
      console.error("❌ Upload error:", error);
      console.error("Error response:", error.response?.data);
      
      setUploading(false);
      
      // Show detailed error
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.details 
        || "Failed to upload record";
      
      alert(`❌ Upload failed: ${errorMsg}`);
      
      // Log more details for debugging
      if (error.response?.data?.details) {
        console.error("Server error details:", error.response.data.details);
      }
      if (error.response?.data?.stack) {
        console.error("Server stack:", error.response.data.stack);
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete a record
  const deleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      console.log("🗑️ Deleting record:", id);
      
      await axios.delete(`${API}/${id}`, { headers });
      
      console.log("✅ Record deleted");
      alert("✅ Record deleted successfully!");
      
      loadRecords();
    } catch (error) {
      console.error("❌ Delete error:", error);
      
      const errorMsg = error.response?.data?.error || "Failed to delete record";
      alert(`❌ Delete failed: ${errorMsg}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header with gradient background */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              MediBuddy • Patient Portal
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-emerald-700">
              My Health Wallet
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your medical records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-100">
              Patient Portal
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 sm:px-8 py-6 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
          
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-emerald-700/80">Total Records</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">
                {records.length}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-800/70">
                Medical records in your wallet
              </p>
            </div>

            <div className="rounded-2xl border border-blue-50 bg-blue-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-blue-700/80">Record Types</p>
              <p className="mt-1 text-lg font-semibold text-blue-800">
                {new Set(records.map(r => r.type)).size}
              </p>
              <p className="mt-0.5 text-[11px] text-blue-800/70">
                Different categories available
              </p>
            </div>

            <div className="rounded-2xl border border-purple-50 bg-purple-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs text-purple-700/80">Doctor Notes</p>
              <p className="mt-1 text-lg font-semibold text-purple-800">
                {records.filter(r => r.doctorNotes?.length > 0).length}
              </p>
              <p className="mt-0.5 text-[11px] text-purple-800/70">
                Records with medical annotations
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4">
            <h2 className="text-sm font-semibold text-emerald-800 mb-1.5">
              Upload Health Record
            </h2>
            <p className="text-xs text-emerald-800/80 mb-3">
              Add a new medical record to your personal health wallet. Include reports, prescriptions, scans, or lab tests.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Record Title *"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={uploading}
              />

              <select
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={uploading}
              >
                <option value="">Select Type *</option>
                <option value="report">Report</option>
                <option value="prescription">Prescription</option>
                <option value="scan">Scan</option>
                <option value="test">Lab Test</option>
              </select>

              <input
                type="text"
                placeholder="File URL (PDF/Image link)"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                disabled={uploading}
              />

              <textarea
                placeholder="Description or notes"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 transition md:col-span-2"
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={uploading}
              />
            </div>

            <button
              className="mt-3 w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={uploadRecord}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Record"}
            </button>
          </div>

          {/* Records List */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-1.5">
              Your Medical Records
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              All your health records in one place. Click on any record to view details or manage doctor notes.
            </p>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-white border border-gray-200">
                <p className="text-gray-400 text-sm">No records found.</p>
                <p className="text-[11px] text-gray-400 mt-1">Upload your first health record to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r) => (
                  <div key={r._id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-800">{r.title}</h3>
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                            {r.type}
                          </span>
                        </div>
                        
                        {r.description && (
                          <p className="text-xs text-gray-600 mb-2">{r.description}</p>
                        )}

                        {r.fileUrl && (
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View File
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => deleteRecord(r._id)}
                        className="ml-4 rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Doctor Notes */}
                    {r.doctorNotes && r.doctorNotes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Doctor Notes:</h4>
                        <div className="space-y-2">
                          {r.doctorNotes.map((n, i) => (
                            <div key={i} className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2">
                              <p className="text-xs text-gray-700">
                                <span className="font-semibold text-blue-700">
                                  {n.doctor?.name || "Doctor"}:
                                </span>{" "}
                                {n.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 sm:px-8 py-3 bg-white">
          <p className="text-[11px] text-center text-gray-400">
            © {new Date().getFullYear()} MediBuddy • All rights are reserved
          </p>
        </div>
      </div>
    </div>
  );
}