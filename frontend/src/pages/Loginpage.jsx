// src/pages/LoginPage.jsx
import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LoginForm from "../components/LoginForm.jsx";

const LoginPage = ({ onLoginSuccess }) => {
  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[540px] lg:min-h-[620px]">

        {/* LEFT SECTION - PROBLEM + SOLUTION */}
        <section className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-400 to-green-600 text-white flex-col justify-between p-10 lg:p-12 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-64 h-64 bg-white rounded-full blur-3xl absolute -top-10 -left-10" />
            <div className="w-64 h-64 bg-emerald-900 rounded-full blur-3xl absolute bottom-0 right-0" />
          </div>

          <div className="relative z-10 space-y-6">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur border border-white/20">
              Portable EHR • Patient-controlled access
            </p>

            <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
              One <span className="font-bold">Health Record</span>,
              <br />
              Everywhere You Go.
            </h1>

            <p className="text-sm lg:text-base text-emerald-50/90 max-w-md">
              MediBuddy is a secure, portable Electronic Health Record (EHR)
              wallet. Patients own their data and can grant temporary access to
              doctors using a secure OTP or shareable access code / QR.
            </p>

            <ul className="mt-4 space-y-3 text-sm lg:text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                <span>
                  No more lost histories between hospitals – a single,
                  longitudinal record under the patient&apos;s control.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                <span>
                  Temporary access for doctors using OTP / access code. Revoke
                  any time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                <span>
                  Designed to plug into real hospital systems and QR-based
                  flows in the next phase.
                </span>
              </li>
            </ul>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 text-xs lg:text-sm">
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3">
              <p className="text-2xl font-semibold">100%</p>
              <p className="text-emerald-50/80">Patient-controlled data</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3">
              <p className="text-2xl font-semibold">0</p>
              <p className="text-emerald-50/80">Redundant tests (goal)</p>
            </div>
          </div>
        </section>

        {/* RIGHT SECTION - LOGIN CARD */}
        <section className="w-full md:w-1/2 bg-white flex flex-col">
          <Navbar />

          <main className="flex-1 flex items-center justify-center px-6 pb-6 sm:px-8 lg:px-10">
            <div className="w-full max-w-md">
              <LoginForm onLoginSuccess={onLoginSuccess} />
            </div>
          </main>

          <Footer />
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
