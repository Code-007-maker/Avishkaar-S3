// src/App.jsx
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx"; 


/**
 * App root - minimal changes:
 * - Read token from localStorage to persist login across refresh.
 * - Provide onLoginSuccess callback to children.
 */

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // "patient" | "doctor"
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("medibuddy_user"); // stored by LoginForm
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserRole(u.role || null);
        setUserEmail(u.email || null);
        setIsLoggedIn(true);
      } catch (e) {
        // invalid stored user
        localStorage.removeItem("medibuddy_user");
      }
    }
  }, []);

  const handleLoginSuccess = (role, email, userObj, token) => {
    // store user minimal info
    const user = userObj || { email, role };
    localStorage.setItem("medibuddy_user", JSON.stringify(user));
    if (token) localStorage.setItem("token", token);
    setUserRole(role);
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("medibuddy_user");
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-green-50 via-white to-green-50 flex items-center justify-center px-2 sm:px-4">
        {
  isLoggedIn ? (
  userRole === "patient" ? (
    <PatientDashboard onLogout={handleLogout} />
  ) : userRole === "doctor" ? (
    <DoctorDashboard onLogout={handleLogout} />
  ) : (
    <DashboardPage role={userRole} email={userEmail} onLogout={handleLogout} />
  )
) : (
  <LoginPage onLoginSuccess={handleLoginSuccess} />
)

}

      </div>

      <Toaster position="top-right" />
    </>
  );
}

export default App;
