import React, { useState } from "react";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS
        const token = data.data.token;
        const user = data.data.user;
        
        localStorage.setItem("adminToken", token);
        localStorage.setItem("isLoggedIn", "true"); 
        localStorage.setItem("adminEmail", user.email);
        localStorage.setItem("userRole", user.role); 

        navigate("/admin-dashboard");
      } else {
        // ❌ FAILURE
        setError(data.message || data.error || "Access Denied. You must be an administrator.");
      }
    } catch (err) {
      setError("Could not connect to the backend server.");
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