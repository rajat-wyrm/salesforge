import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { FaSun, FaMoon, FaUser, FaLock, FaGlobe, FaShieldAlt } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";

// ── Reusable styled toggle pill (matches Notifications style) ────────────────
const TogglePill = ({ checked, onChange, dark }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 50, height: 28, borderRadius: 99, border: "none",
      cursor: "pointer", padding: 3,
      background: checked
        ? "linear-gradient(90deg, #17AA97, #0e8870)"
        : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)",
      display: "flex", alignItems: "center",
      justifyContent: checked ? "flex-end" : "flex-start",
      transition: "all 260ms cubic-bezier(.4,0,.2,1)",
      boxShadow: checked ? "0 0 0 3px rgba(23,170,151,0.22)" : "none",
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      transition: "all 260ms cubic-bezier(.4,0,.2,1)",
    }} />
  </button>
);

const SectionHeading = ({ icon, label, dark }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, marginTop: 28 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: dark ? "rgba(23,170,151,0.16)" : "rgba(23,170,151,0.10)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#17AA97", fontSize: 14,
    }}>
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: dark ? "#c8d8f0" : "#162944" }}>
      {label}
    </h3>
  </div>
);

const Settings1 = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [language,      setLanguage]      = useState("English");
  const [notifications, setNotifications] = useState(false);
  const [publicprofile, setPublicprofile] = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [focusField,    setFocusField]    = useState("");

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // ── Tokens ───────────────────────────────────────────────────────────────
  const pageBg = dark
    ? `radial-gradient(circle at 10% 15%, rgba(23,170,151,0.06), transparent 40%),
       radial-gradient(circle at 90% 85%, rgba(231,105,55,0.05), transparent 45%),
       #0b1120`
    : `radial-gradient(circle at 10% 15%, rgba(23,170,151,0.10), transparent 40%),
       radial-gradient(circle at 90% 85%, rgba(231,105,55,0.07), transparent 45%),
       #f0fafa`;

  const cardBg     = dark ? "rgba(17,27,48,0.96)"             : "rgba(255,255,255,0.97)";
  const cardBorder = dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(23,170,151,0.18)";
  const heading    = dark ? "#f0f4ff"  : "#162944";
  const subtext    = dark ? "#64748b"  : "#888";

  const inputStyle = (field) => ({
    width: "100%", padding: "12px 16px", fontSize: 15,
    borderRadius: 12, outline: "none",
    background: dark ? "#131e32" : "#fff",
    color:  dark ? "#e2e8f0" : "#162944",
    border: focusField === field
      ? "1.6px solid rgba(231,105,55,0.65)"
      : dark ? "1.5px solid rgba(255,255,255,0.10)" : "1.5px solid rgba(0,0,0,0.10)",
    boxShadow: focusField === field ? "0 0 0 4px rgba(231,105,55,0.15)" : "none",
    transition: "all 200ms ease",
    boxSizing: "border-box",
  });

  const rowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderRadius: 12, marginBottom: 10,
    background: dark ? "rgba(255,255,255,0.04)" : "rgba(23,170,151,0.04)",
    border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(23,170,151,0.12)",
  };

  const rowLabel = { fontWeight: 700, fontSize: 15, color: dark ? "#e2e8f0" : "#162944" };

  return (
    <div style={{
      minHeight: "100vh",
      background: pageBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "36px 16px",
      transition: "background 300ms ease",
    }}>

      
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%", maxWidth: 560,
        background: cardBg, border: cardBorder,
        borderRadius: 24,
        boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.45)" : "0 16px 48px rgba(23,170,151,0.12)",
        padding: "44px 36px 36px",
        backdropFilter: "blur(12px)",
        transition: "all 300ms ease",
        position: "relative", overflow: "hidden",
      }}>

        {/* Accent bar + shimmer */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #17AA97, #E76937)" }} />
        <div style={{ position: "absolute", top: 0, left: "-40%", width: "40%", height: 4, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.80), transparent)", animation: "shimmerSettings 2.4s linear infinite" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: dark ? "rgba(23,170,151,0.16)" : "rgba(23,170,151,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", fontSize: 24,
            animation: "iconFloat 2.4s ease-in-out infinite",
          }}>⚙️</div>
          <h2 style={{ color: heading, fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Account Settings</h2>
          <p style={{ color: subtext, fontSize: 14, margin: 0 }}>Manage your profile, security, and preferences</p>
        </div>

        {/* ── Profile ──────────────────────────────────────────────────── */}
        <SectionHeading icon={<FaUser />} label="Profile" dark={dark} />
        <input
          type="text" placeholder="Full Name" value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocusField("name")} onBlur={() => setFocusField("")}
          style={{ ...inputStyle("name"), marginBottom: 12 }}
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusField("email")} onBlur={() => setFocusField("")}
          style={{ ...inputStyle("email"), marginBottom: 4 }}
        />

        {/* ── Password ─────────────────────────────────────────────────── */}
        <SectionHeading icon={<FaLock />} label="Change Password" dark={dark} />
        <input
          type="password" placeholder="New Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocusField("password")} onBlur={() => setFocusField("")}
          style={{ ...inputStyle("password"), marginBottom: 4 }}
        />

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <SectionHeading icon={<FaGlobe />} label="Preferences" dark={dark} />

        <div style={rowStyle}>
          <span style={rowLabel}>Email Notifications</span>
          <TogglePill checked={notifications} onChange={setNotifications} dark={dark} />
        </div>

        <div style={{ marginBottom: 4 }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px", fontSize: 15,
              borderRadius: 12, outline: "none",
              background: dark ? "#131e32" : "#fff",
              color: dark ? "#e2e8f0" : "#162944",
              border: dark ? "1.5px solid rgba(255,255,255,0.10)" : "1.5px solid rgba(0,0,0,0.10)",
              boxSizing: "border-box", cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Marathi</option>
          </select>
        </div>

        {/* ── Privacy ──────────────────────────────────────────────────── */}
        <SectionHeading icon={<FaShieldAlt />} label="Privacy" dark={dark} />

        <div style={rowStyle}>
          <span style={rowLabel}>Public Profile</span>
          <TogglePill checked={publicprofile} onChange={setPublicprofile} dark={dark} />
        </div>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <button
          onClick={saveSettings}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          style={{
            width: "100%", padding: "14px 0", marginTop: 24,
            borderRadius: 14, border: "none",
            background: saved
              ? "linear-gradient(90deg, #17AA97, #0e8870)"
              : "linear-gradient(90deg, #E76937, #CC4F22)",
            color: "#fff", fontWeight: 800, fontSize: 16,
            cursor: "pointer", letterSpacing: 0.3,
            boxShadow: saved ? "0 8px 24px rgba(23,170,151,0.30)" : "0 8px 24px rgba(231,105,55,0.28)",
            transition: "all 260ms ease",
          }}
        >
          {saved ? "✓ Settings Saved!" : "Save Settings"}
        </button>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <Link to="/">
          <button
            onMouseEnter={(e) => { e.currentTarget.style.background = "#be123c"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = dark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)"; }}
            style={{
              width: "100%", padding: "13px 0", marginTop: 12,
              borderRadius: 14,
              border: "1.5px solid rgba(239,68,68,0.35)",
              background: dark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)",
              color: dark ? "#fca5a5" : "#dc2626",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              transition: "all 220ms ease", letterSpacing: 0.3,
            }}
          >
            Logout
          </button>
        </Link>
      </div>

      <style>{`
        @keyframes shimmerSettings {
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

export default Settings1;