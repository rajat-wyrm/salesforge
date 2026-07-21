import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, tokenStore } from "../../lib/api";

// View states
const VIEW = {
  GOOGLE: "google",       // default — shows Google button
  FORGOT: "forgot",       // shows email input
  SENT: "sent",           // shows "check your email" confirmation
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { isAuthenticated, loading, refresh, user } = useAuth();

  const [view, setView] = useState(VIEW.GOOGLE);
  const [error, setError] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  // Forgot-password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, redirect, user]);

  /* ── Google OAuth ─────────────────────────────────────────── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setSigningIn(true);
    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      tokenStore.set(res.data.data.token);
      const authData = await refresh();

      // Role-based redirect: ADMIN users go to admin dashboard
      const userRole = authData?.user?.role || res.data.data.user?.role;
      if (userRole === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.normalized?.message ||
        "Google Sign-In failed. Please try again.";
      setError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  /* ── Forgot password ──────────────────────────────────────── */
  const handleSendReset = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSending(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      setView(VIEW.SENT);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.normalized?.message ||
        "Could not send reset email. Please try again.";
      setResetError(msg);
    } finally {
      setResetSending(false);
    }
  };

  const goBack = () => {
    setView(VIEW.GOOGLE);
    setError(null);
    setResetError(null);
    setResetEmail("");
  };

  /* ── Render helpers ───────────────────────────────────────── */
  const renderGoogleView = () => (
    <>
      {/* Error banner */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-5">
        {signingIn ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
            Signing you in…
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Sign-In failed. Please try again.")}
            width="280"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
        )}

        <button
          type="button"
          onClick={() => { setView(VIEW.FORGOT); setError(null); }}
          className="text-sm font-medium text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors"
        >
          Forgot password?
        </button>
      </div>
    </>
  );

  const renderForgotView = () => (
    <>
      <button
        type="button"
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Reset your password</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">We'll email you a secure sign-in link.</p>
        </div>
      </div>

      {resetError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {resetError}
        </div>
      )}

      <form onSubmit={handleSendReset} className="space-y-4">
        <input
          type="email"
          required
          autoFocus
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={resetSending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resetSending && <Loader2 className="h-4 w-4 animate-spin" />}
          {resetSending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </>
  );

  const renderSentView = () => (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">Check your email</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          If an account exists for <span className="font-medium text-gray-700 dark:text-gray-300">{resetEmail}</span>,
          a reset link has been sent. Check your inbox (and spam folder).
        </p>
      </div>
      <button
        type="button"
        onClick={goBack}
        className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
      >
        ← Back to sign in
      </button>
    </div>
  );

  /* ── Layout ───────────────────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 px-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/80">

          {/* Logo + heading (always visible) */}
          <div className="mb-7 flex flex-col items-center text-center">
            <img
              src="/UptoSkillsLogo.webp"
              alt="UptoSkills Logo"
              className="mb-4 h-14 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your SalesForge workspace
            </p>
          </div>

          {/* Dynamic content */}
          {view === VIEW.GOOGLE && renderGoogleView()}
          {view === VIEW.FORGOT && renderForgotView()}
          {view === VIEW.SENT  && renderSentView()}

          {/* Admin portal link (always visible) */}
          {view === VIEW.GOOGLE && (
            <div className="mt-8 border-t border-gray-100 pt-5 text-center dark:border-gray-800">
              <button
                type="button"
                onClick={() => navigate("/admin-login")}
                className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                Admin portal →
              </button>
            </div>
          )}
        </div>

        {/* Terms */}
        {view === VIEW.GOOGLE && (
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
            By continuing, you agree to our{" "}
            <span className="cursor-pointer underline hover:text-gray-600 dark:hover:text-gray-400">Terms</span>
            {" "}&amp;{" "}
            <span className="cursor-pointer underline hover:text-gray-600 dark:hover:text-gray-400">Privacy Policy</span>.
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
