import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// ── Reusable Toggle ──────────────────────────────────────────────────────────
const Toggle = ({ label, description, state, setState, dark }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderRadius: 14,
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(23,170,151,0.04)",
        border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(23,170,151,0.12)",
        transition: "all 200ms ease",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: dark ? "#e2e8f0" : "#162944", marginBottom: 2 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 13, color: dark ? "#64748b" : "#888", fontWeight: 500 }}>
            {description}
          </div>
        )}
      </div>

      {/* Toggle pill */}
      <button
        onClick={() => setState(!state)}
        aria-label={`Toggle ${label}`}
        style={{
          width: 50,
          height: 28,
          borderRadius: 99,
          border: "none",
          cursor: "pointer",
          padding: 3,
          background: state
            ? "linear-gradient(90deg, #17AA97, #0e8870)"
            : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: state ? "flex-end" : "flex-start",
          transition: "all 260ms cubic-bezier(.4,0,.2,1)",
          boxShadow: state ? "0 0 0 3px rgba(23,170,151,0.22)" : "none",
          flexShrink: 0,
          marginLeft: 16,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
            transition: "all 260ms cubic-bezier(.4,0,.2,1)",
          }}
        />
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Notifications = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const { requestPermissionAndSubscribe } = usePushNotifications(0);

  const [emailNotif,     setEmailNotif]     = useState(true);
  const [smsNotif,       setSmsNotif]       = useState(false);
  const [pushNotif,      setPushNotif]      = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [saved,          setSaved]          = useState(false);

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // ── Design tokens ────────────────────────────────────────────────────────
  const pageBg  = dark ? "#0b1120" : "#f0fafa";
  const cardBg  = dark ? "rgba(17,27,48,0.96)" : "rgba(255,255,255,0.96)";
  const cardBorder = dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(23,170,151,0.18)";
  const heading = dark ? "#f0f4ff" : "#162944";
  const subtext = dark ? "#64748b"  : "#888";

  const toggleItems = [
    { label: "Email Notifications",  description: "Receive updates and alerts via email",   state: emailNotif,     setState: setEmailNotif },
    { label: "SMS Notifications",    description: "Get texts for critical account activity", state: smsNotif,       setState: setSmsNotif },
    { label: "Push Notifications",   description: "Browser and mobile push alerts",          state: pushNotif,      setState: (val) => {
      setPushNotif(val);
      if (val) requestPermissionAndSubscribe();
    }},
    { label: "Marketing Emails",     description: "Product news, tips, and offers",          state: marketingNotif, setState: setMarketingNotif },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: dark
        ? `radial-gradient(circle at 10% 15%, rgba(23,170,151,0.06), transparent 40%),
           radial-gradient(circle at 90% 85%, rgba(231,105,55,0.05), transparent 45%),
           #0b1120`
        : `radial-gradient(circle at 10% 15%, rgba(23,170,151,0.10), transparent 40%),
           radial-gradient(circle at 90% 85%, rgba(231,105,55,0.07), transparent 45%),
           #f0fafa`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      transition: "background 300ms ease",
      position: "relative",
    }}>

      
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 560,
        background: cardBg,
        border: cardBorder,
        borderRadius: 24,
        boxShadow: dark
          ? "0 24px 64px rgba(0,0,0,0.45)"
          : "0 16px 48px rgba(23,170,151,0.12)",
        padding: "40px 36px 36px",
        backdropFilter: "blur(12px)",
        transition: "all 300ms ease",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, #17AA97, #E76937)",
        }} />
        {/* Shimmer on accent bar */}
        <div style={{
          position: "absolute", top: 0, left: "-40%", width: "40%", height: 4,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.80), transparent)",
          animation: "shimmerNotif 2.4s linear infinite",
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: dark ? "rgba(23,170,151,0.16)" : "rgba(23,170,151,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: 24,
            animation: "iconFloat 2.4s ease-in-out infinite",
          }}>
            🔔
          </div>
          <h2 style={{ color: heading, fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
            Notification Settings
          </h2>
          <p style={{ color: subtext, fontSize: 14, margin: 0 }}>
            Choose how and when you want to be notified
          </p>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {toggleItems.map((item) => (
            <Toggle key={item.label} {...item} dark={dark} />
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={saveSettings}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            border: "none",
            background: saved
              ? "linear-gradient(90deg, #17AA97, #0e8870)"
              : "linear-gradient(90deg, #E76937, #CC4F22)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            letterSpacing: 0.3,
            boxShadow: saved
              ? "0 8px 24px rgba(23,170,151,0.30)"
              : "0 8px 24px rgba(231,105,55,0.28)",
            transform: "translateY(0)",
            transition: "all 260ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = saved ? "0 14px 32px rgba(23,170,151,0.38)" : "0 14px 32px rgba(231,105,55,0.36)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = saved ? "0 8px 24px rgba(23,170,151,0.30)" : "0 8px 24px rgba(231,105,55,0.28)"; }}
        >
          {saved ? "✓ Preferences Saved!" : "Save Preferences"}
        </button>

        {/* Footer hint */}
        <p style={{ textAlign: "center", fontSize: 13, color: subtext, marginTop: 16, marginBottom: 0 }}>
          Changes take effect immediately
        </p>
      </div>

      <style>{`
        @keyframes shimmerNotif {
          0%   { left: -40%; opacity: 0.2; }
          15%  { opacity: 0.8; }
          55%  { opacity: 0.65; }
          100% { left: 110%; opacity: 0.15; }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

export default Notifications;