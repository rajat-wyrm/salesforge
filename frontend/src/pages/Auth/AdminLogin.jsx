import React, { useState } from "react";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { api, tokenStore } from "../../lib/api";
import { useAuth } from "@/context/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/admin/login", {
        credential: credentialResponse.credential,
      });

      const data = res.data.data || res.data;
      const token = data.token;
      const user = data.user;

      // Store the token so the API client sends it on subsequent requests
      if (token) tokenStore.set(token);

      // Store admin info in localStorage for quick access
      localStorage.setItem("isLoggedIn", "true");
      if (user?.email) localStorage.setItem("adminEmail", user.email);
      if (user?.role) localStorage.setItem("userRole", user.role);

      // Refresh the auth context so RequireAuth/RequireAdmin guards work
      await refresh();

      // Role-based redirect: ADMIN goes to admin-dashboard
      if (user?.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
          className="absolute top-6 left-6 z-20 text-white hover:text-gray-300 flex items-center gap-2 font-medium transition-colors"
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
            <h2 className="text-2xl font-bold text-slate-800 tracking-widest">ADMIN PORTAL</h2>
            <p className="text-slate-500 text-sm mt-1">Secure Management Gateway</p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <p className="text-red-600 bg-red-50 p-3 rounded-lg flex items-center text-sm border border-red-100">
                <XCircle className="w-5 h-5 mr-2 shrink-0" /> {error}
              </p>
            )}

            <div className="flex flex-col items-center justify-center space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Authentication failed.")}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              )}
            </div>

            <p className="text-center text-xs text-slate-400 pt-6">
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;