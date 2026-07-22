import React, { useState, useEffect } from "react";
import { Loader2, ShieldCheck, XCircle, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { api, tokenStore } from "../../lib/api";
import { useAuth } from "@/context/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refresh, isAuthenticated, loading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, user]);

  const handleLoginSuccess = async (responsePayload) => {
    const data = responsePayload.data || responsePayload;
    const token = data.token;
    const responseUser = data.user;

    if (token) tokenStore.set(token);

    localStorage.setItem("isLoggedIn", "true");
    if (responseUser?.email) localStorage.setItem("adminEmail", responseUser.email);
    if (responseUser?.role) localStorage.setItem("userRole", responseUser.role);

    const authData = await refresh();
    const finalRole = authData?.user?.role || responseUser?.role;

    if (finalRole === "ADMIN") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/admin/login", { email, password });
      await handleLoginSuccess(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Access Denied. You must be an administrator.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/admin/login", {
        credential: credentialResponse.credential,
      });
      await handleLoginSuccess(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Access Denied. You must be an administrator.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-inter bg-white">
      <div className="hidden md:block w-1/3 h-screen relative p-0 m-0 overflow-hidden">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 z-20 text-white hover:text-gray-300 flex items-center gap-2 font-medium transition-colors cursor-pointer"
        >
          ← Back
        </button>

        <img
          src="/image 1.png"
          alt="Admin Portal Background"
          className="absolute inset-0 w-full h-full rounded-r-4xl object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-800" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-widest">ADMIN LOGIN</h2>
            <p className="text-slate-500 text-sm mt-1">Secure Management Gateway</p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <p className="text-red-600 bg-red-50 p-3 rounded-lg flex items-center text-sm border border-red-100">
                <XCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Access Dashboard"
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Authentication failed.")}
                theme="outline"
                size="large"
                text="continue_with"
                width="280"
              />
            </div>

            <p className="text-center text-xs text-slate-400 pt-4">
              Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;