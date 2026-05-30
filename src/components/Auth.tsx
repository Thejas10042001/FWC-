import React, { useState } from "react";
import { UserRole, UserProfile } from "../types";
import { Briefcase, Key, Mail, Shield, User, Users } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide an official email.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Authentication failed. Try quick access roles.");
      }
    } catch (err) {
      setError("Service connection failure. Please confirm backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleEmail, password: "password123" }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Simulated login fell short.");
      }
    } catch (err) {
      setError("Failed to reach auth gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_screen" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Enterprise HRMS
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Secure AI-Powered Human Resource Management Suite
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-sm text-amber-800 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Official Email Address
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Corporate Password
                </label>
                <button
                  type="button"
                  onClick={() => setError("Password reset is managed by Super Admin directory.")}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Forgot your password?
                </button>
              </div>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 block text-xs text-slate-600 font-medium">
                Enforce security token session (24h JWT)
              </label>
            </div>

            <button
              id="btn_submit_login"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition duration-150 disabled:opacity-50"
            >
              {loading ? "Authenticating Session..." : "Secure Login"}
            </button>
          </form>

          {/* Quick-Access Testing Deck */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Roles Gateways (Evaluation Hotkeys)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                id="btn_login_super_admin"
                type="button"
                onClick={() => handleQuickLogin("admin@company.com")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium justify-start"
              >
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                Super Admin
              </button>
              <button
                id="btn_login_mgmt"
                type="button"
                onClick={() => handleQuickLogin("management@company.com")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium justify-start"
              >
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                Management
              </button>
              <button
                id="btn_login_mgr"
                type="button"
                onClick={() => handleQuickLogin("manager@company.com")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium justify-start"
              >
                <User className="h-3.5 w-3.5 text-teal-600" />
                Sr. Manager
              </button>
              <button
                id="btn_login_hr"
                type="button"
                onClick={() => handleQuickLogin("hr@company.com")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium justify-start"
              >
                <Briefcase className="h-3.5 w-3.5 text-violet-600" />
                HR Recruiter
              </button>
            </div>
            <button
              id="btn_login_employee"
              type="button"
              onClick={() => handleQuickLogin("employee@company.com")}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium text-xs"
            >
              <User className="h-3.5 w-3.5 text-amber-600" />
              Sign in as Corporate Employee (Alexander Mercer)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
