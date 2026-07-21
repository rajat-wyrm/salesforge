import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { FaSun, FaMoon, FaUser, FaLock, FaGlobe, FaShieldAlt } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";
import { userService, notificationPrefService } from "../../../services";
import { toast } from "sonner";

// Categories the backend tracks preferences for (see notificationPrefController.js).
// The Settings page exposes a single "Email Notifications" master toggle, so saving
// it updates the email channel across every category at once.
const NOTIFICATION_CATEGORIES = ["lead", "deal", "billing", "team", "system"];

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
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [language,      setLanguage]      = useState("English");
  const [notifications, setNotifications] = useState(true);
  const [publicprofile, setPublicprofile] = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [focusField,    setFocusField]    = useState("");
  const [errors,        setErrors]        = useState({});

  // Populate Name/Email from the signed-in user once, so the form shows real
  // data instead of always starting blank. Guarded by a ref so a save (which
  // refreshes the user in context) doesn't wipe out what's on screen again.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (user && !initializedRef.current) {
      setName(user.name || "");
      setEmail(user.email || "");
      initializedRef.current = true;
    }
  }, [user]);

  // Load the user's real email-notification preference from the backend so the
  // toggle reflects what is actually saved, instead of always defaulting to off.
  useEffect(() => {
    let cancelled = false;
    notificationPrefService
      .list()
      .then((prefs) => {
        if (cancelled) return;
        const emailPrefs = (prefs || []).filter((p) => p.channel === "email");
        const allEnabled = emailPrefs.length > 0 && emailPrefs.every((p) => p.enabled);
        setNotifications(allEnabled);
      })
      .catch(() => {
        // Keep the current toggle state if preferences can't be loaded.
      });
    return () => { cancelled = true; };
  }, []);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Full name is required.";
    else if (name.trim().length < 2) next.name = "Full name must be at least 2 characters.";
    if (!email.trim()) next.email = "Email is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveSettings = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    try {
      // Only the name is editable/persistable here (the backend's /users/me
      // endpoint only accepts name + mobile). Update the shared auth context
      // immediately so the header/sidebar reflect the new name right away.
      if (user && name.trim() !== user.name) {
        const updatedUser = await userService.updateMe({ name: name.trim() });
        updateUser(updatedUser);
      }

      // Persist the email notification preference for real, across every
      // category, so the toggle actually controls whether emails go out.
      await notificationPrefService.update(
        NOTIFICATION_CATEGORIES.map((category) => ({
          channel: "email",
          category,
          enabled: notifications,
        }))
      );

      setSaved(true);
      toast.success("Settings saved.");
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      toast.error(err?.normalized?.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
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
    border: errors[field]
      ? "1.6px solid #dc2626"
      : focusField === field
      ? "1.6px solid rgba(231,105,55,0.65)"
      : dark ? "1.5px solid rgba(255,255,255,0.10)" : "1.5px solid rgba(0,0,0,0.10)",
    boxShadow: errors[field]
      ? "0 0 0 4px rgba(220,38,38,0.15)"
      : focusField === field
      ? "0 0 0 4px rgba(231,105,55,0.15)"
      : "none",
    transition: "all 200ms ease",
    boxSizing: "border-box",
  });

  // Email can't be changed from this page (the backend only allows updating
  // name/mobile here), so it's shown read-only instead of pretending to save.
  const disabledInputStyle = {
    width: "100%", padding: "12px 16px", fontSize: 15,
    borderRadius: 12, outline: "none",
    background: dark ? "#0d1626" : "#eef1f4",
    color: dark ? "#64748b" : "#94a3b8",
    border: dark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.06)",
    cursor: "not-allowed",
    boxSizing: "border-box",
  };

  const errorTextStyle = { color: "#dc2626", fontSize: 12, fontWeight: 700, margin: "6px 2px 10px" };
  const helperTextStyle = { color: subtext, fontSize: 12, margin: "6px 2px 12px" };

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
          style={{ ...inputStyle("name"), marginBottom: errors.name ? 0 : 12 }}
        />
        {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
        <input
          type="email" placeholder="Email" value={email}
          disabled
          readOnly
          title="Your email is tied to your account and can't be changed here."
          style={{ ...disabledInputStyle, marginBottom: 4 }}
        />
        <p style={helperTextStyle}>Your email is tied to your account and can't be changed here.</p>

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
          disabled={saving}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          style={{
            width: "100%", padding: "14px 0", marginTop: 24,
            borderRadius: 14, border: "none",
            background: saved
              ? "linear-gradient(90deg, #17AA97, #0e8870)"
              : "linear-gradient(90deg, #E76937, #CC4F22)",
            color: "#fff", fontWeight: 800, fontSize: 16,
            cursor: saving ? "not-allowed" : "pointer", letterSpacing: 0.3,
            opacity: saving ? 0.75 : 1,
            boxShadow: saved ? "0 8px 24px rgba(23,170,151,0.30)" : "0 8px 24px rgba(231,105,55,0.28)",
            transition: "all 260ms ease",
          }}
        >
          {saving ? "Saving…" : saved ? "✓ Settings Saved!" : "Save Settings"}
        </button>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <button
           type="button"
           onClick={handleLogout}
           onMouseEnter={(e) => {
             e.currentTarget.style.background = "#dc2626";
             e.currentTarget.style.color = "#ffffff";
             e.currentTarget.style.borderColor = "#dc2626";
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.background = dark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)";
             e.currentTarget.style.color = dark ? "#fca5a5" : "#dc2626";
             e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
           }}
           style={{
             width: "100%", padding: "13px 0", marginTop: 12,
             borderRadius: 14,
             border: "1.5px solid rgba(239,68,68,0.35)",
             background: dark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)",
             color: dark ? "#fca5a5" : "#dc2626",
             fontWeight: 700, fontSize: 15, cursor: "pointer",
             transition: "background 220ms ease, color 220ms ease, border-color 220ms ease",
             letterSpacing: 0.3,
           }}
         >
           Logout
         </button>
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
