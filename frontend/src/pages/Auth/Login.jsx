import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { tokenStore } from "../../lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, refresh } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, loading, navigate]);

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };
const handleGoogleSuccess = async (credentialResponse) => {
  console.log("Google Success");
  console.log(credentialResponse);

  try {
    console.log("Sending request...");

    const res = await axios.post(
      "http://localhost:3000/api/auth/google",
      {
        credential: credentialResponse.credential,
      }
    );

    console.log("Backend response:", res.data);

    tokenStore.set(res.data.data.token);

    await refresh();

    navigate("/dashboard", { replace: true });
  } catch (err) {
    console.log("Axios Error:", err);
    console.log(err.response);

    setError("Google Sign-In failed.");
  }
};

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-950">

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-2xl backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/UptoSkillsLogo.webp"
              alt="UptoSkills Logo"
              className="mb-3 h-14 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your SalesForge workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300"
              >
                Create account
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            <div className="my-4 flex items-center">
  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
  <span className="px-3 text-xs text-gray-500">OR</span>
  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
</div>

<div className="flex justify-center">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => setError("Google Sign-In failed")}
  />
</div>
            
          </form>

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={() => navigate("/admin-login")}
              className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              Admin portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
