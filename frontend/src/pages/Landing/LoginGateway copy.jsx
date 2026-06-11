import { Shield, TrendingUp, User } from "lucide-react";
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { ThemeToggle } from "../../context/ThemeToggle";

const LoginGateway = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  console.log("DarkMode: ", darkMode);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500 ${
        darkMode
          ? "bg-slate-950 text-gray-100"
          : "bg-white text-gray-900"
      }`}
    >
      {/* Header with Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Logo Section */}
      <div className="text-center max-w-2xl mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-teal-400 p-3 rounded-xl -ml-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </div>
        <Link to="/">
          <img
            src="/UptoSkillsLogo.webp"
            alt="UptoSkill Logo"
            className="h-16 w-auto my-4 gap-6"
          />
        </Link>
        <p
          className={`text-lg font-semibold -ml-3 ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Lead Generation & CRM Platform
        </p>
      </div>

      {/* Login Options Grid */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* User Portal */}
        <div
          onClick={() => navigate("/login")}
          className={`p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border group ${
            darkMode
              ? "bg-slate-900 border-slate-800 hover:border-violet-500/30"
              : "bg-amber-50 border-slate-200 hover:border-violet-300"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
              darkMode
                ? "bg-indigo-950 group-hover:bg-indigo-900 text-indigo-400"
                : "bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600"
            }`}
          >
            <User className="w-8 h-8" />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            User Portal
          </h2>
          <p
            className={`mb-6 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Access your personal dashboard and tools.
          </p>
          <div
            className={`font-medium flex items-center ${
              darkMode ? "text-indigo-400" : "text-indigo-600"
            }`}
          >
            Login as User →
          </div>
        </div>

        {/* Admin Console */}
        <div
          onClick={() => navigate("/admin-login")}
          className={`p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border group relative overflow-hidden ${
            darkMode
              ? "bg-slate-900 border-slate-800 hover:border-violet-500/30"
              : "bg-amber-50 border-slate-200 hover:border-violet-300"
          }`}
        >
          <div className={`absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg ${
            darkMode
              ? "bg-violet-600 text-white"
              : "bg-slate-900 text-white"
          }`}>
            MANAGEMENT
          </div>
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
              darkMode
                ? "bg-slate-800 group-hover:bg-slate-700 text-slate-400"
                : "bg-slate-100 group-hover:bg-slate-200 text-slate-800"
            }`}
          >
            <Shield className="w-8 h-8" />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            Admin Console
          </h2>
          <p
            className={`mb-6 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manage users and settings.
          </p>
          <div
            className={`font-medium flex items-center ${
              darkMode ? "text-slate-300" : "text-slate-800"
            }`}
          >
            Login as Admin →
          </div>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="mt-12">
        <Link
          to="/"
          className={`font-medium transition-colors ${
            darkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LoginGateway;