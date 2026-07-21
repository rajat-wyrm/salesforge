import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { teamService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { UptoButton, UptoSpinner, UptoCard, UptoPage } from "@/components/UI/UptoHooks";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users } from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, refresh } = useAuth();

  const [status, setStatus] = useState("idle"); // idle, loading, success, error, unauth
  const [errorMsg, setErrorMsg] = useState("");
  const [accepted, setAccepted] = useState(false);

  const accept = useCallback(async () => {
    if (accepted) return;
    setStatus("loading");
    try {
      await teamService.acceptInvite(token);
      setAccepted(true);
      // Refresh auth context so organizationId is updated immediately
      await refresh();
      setStatus("success");
      toast.success("🎉 You have successfully joined the team!");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to accept invite. The link may have expired.");
    }
  }, [accepted, refresh, token]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Invalid or missing invite token.");
      return;
    }

    if (!authLoading && !accepted) {
      if (!isAuthenticated) {
        setStatus("unauth");
      } else {
        accept();
      }
    }
  }, [token, isAuthenticated, authLoading, accept, accepted]);

  if (status === "idle" || status === "loading" || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center space-y-4">
          <UptoSpinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {status === "loading" ? "Joining the team..." : "Verifying invite..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/80 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-4xl">
              📨
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">You're Invited!</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please log in to accept your team invitation and see your teammates.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <Link to={`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}>
              <UptoButton className="w-full">Log In to Accept</UptoButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-red-900/40 dark:bg-gray-900/80 text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-14 w-14 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Invite Failed</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{errorMsg}</p>
          <div className="pt-2">
            <Link to="/dashboard">
              <UptoButton>Go to Dashboard</UptoButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-emerald-200/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-emerald-900/40 dark:bg-gray-900/80 text-center space-y-5">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Welcome to the Team! 🎉
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You've successfully joined the organization. Click below to meet your teammates.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <UptoButton
            className="w-full inline-flex items-center justify-center gap-2"
            onClick={() => navigate("/team")}
          >
            <Users className="h-4 w-4" />
            View Team Members
          </UptoButton>
          <UptoButton
            variant="outline"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </UptoButton>
        </div>
      </div>
    </div>
  );
}
