import React, { useEffect, useState } from "react";
import { FaBookOpen, FaPlayCircle, FaUpload, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";

// ── Theme-aware color palettes ────────────────────────────────────────────────
const makeTokens = (darkMode) => ({
  // Page / structural
  pageBg: darkMode
    ? `radial-gradient(circle at 12% 18%, rgba(23,170,151,0.06), transparent 45%),
       radial-gradient(circle at 88% 82%, rgba(231,105,55,0.05), transparent 50%),
       #0b1120`
    : `radial-gradient(circle at 12% 18%, rgba(23,170,151,0.08), transparent 45%),
       radial-gradient(circle at 88% 82%, rgba(231,105,55,0.07), transparent 50%),
       #ffffff`,

  // Cards
  cardBg: darkMode ? "rgba(17,27,48,0.92)" : "rgba(255,255,255,0.86)",
  cardBorderDefault: darkMode ? "1.5px solid rgba(255,255,255,0.07)" : "1.5px solid rgba(0,0,0,0.10)",
  cardBorderHoverEmail: darkMode ? "1.5px solid rgba(231,105,55,0.45)" : "1.5px solid rgba(231,105,55,0.35)",
  cardBorderHoverBulk:  darkMode ? "1.5px solid rgba(23,170,151,0.45)"  : "1.5px solid rgba(23,170,151,0.35)",
  cardShadowDefault: darkMode ? "0 4px 24px rgba(0,0,0,0.35)" : "0 4px 12px rgba(0,0,0,0.05)",
  cardShadowHoverEmail: darkMode ? "0 18px 44px rgba(231,105,55,0.22)" : "0 18px 44px rgba(231,105,55,0.18)",
  cardShadowHoverBulk:  darkMode ? "0 18px 44px rgba(23,170,151,0.22)"  : "0 18px 44px rgba(23,170,151,0.18)",

  // Typography
  heading:  darkMode ? "#f0f4ff" : "#162944",
  subtext:  darkMode ? "#94a3b8" : "#454545",
  menuGray: darkMode ? "#6b7d9c" : "#636c72",

  // Inputs
  inputBg:     darkMode ? "#131e32" : "#fff",
  inputBorder: (focused) =>
    focused
      ? "1.6px solid rgba(231,105,55,0.65)"
      : darkMode
      ? "1.5px solid rgba(255,255,255,0.12)"
      : "1.5px solid rgba(0,0,0,0.10)",
  inputShadow: (focused) =>
    focused
      ? "0 0 0 4px rgba(231,105,55,0.18)"
      : "0 0 0 0 rgba(0,0,0,0)",
  inputColor: darkMode ? "#e2e8f0" : "#1a1a1a",
  placeholderColor: darkMode ? "#4a5a72" : undefined,

  // Upload box
  uploadBoxBg: darkMode
    ? `radial-gradient(circle at 15% 20%, rgba(231,105,55,0.06), transparent 45%),
       radial-gradient(circle at 85% 80%, rgba(23,170,151,0.08), transparent 50%),
       rgba(23,170,151,0.04)`
    : `radial-gradient(circle at 15% 20%, rgba(231,105,55,0.08), transparent 45%),
       radial-gradient(circle at 85% 80%, rgba(23,170,151,0.10), transparent 50%),
       rgba(23,170,151,0.06)`,
  uploadBoxBorder: darkMode ? "1.5px solid rgba(23,170,151,0.20)" : "1.5px solid rgba(23,170,151,0.25)",
  uploadBoxTitle: darkMode ? "#1ecfba" : "#0E887B",

  // Choose file button
  chooseFileBg: (hover) =>
    hover
      ? darkMode
        ? "linear-gradient(90deg, rgba(231,105,55,0.28), rgba(23,170,151,0.24))"
        : "linear-gradient(90deg, rgba(231,105,55,0.20), rgba(23,170,151,0.18))"
      : darkMode
      ? "rgba(23,170,151,0.16)"
      : "rgba(23,170,151,0.14)",
  chooseFileColor: darkMode ? "#d0e8e5" : "#344755",
  chooseFileBorder: (hover) =>
    hover
      ? "1.5px solid rgba(231,105,55,0.38)"
      : darkMode
      ? "1.5px solid rgba(23,170,151,0.30)"
      : "1.5px solid rgba(23,170,151,0.22)",

  // Selected-file chip
  fileChipBg:     darkMode ? "rgba(23,170,151,0.14)" : "rgba(23,170,151,0.10)",
  fileChipBorder: darkMode ? "1.5px solid rgba(23,170,151,0.35)" : "1.5px solid rgba(23,170,151,0.25)",
  fileChipColor:  "#17AA97",

  // Icon chip bg
  iconChipEmail: darkMode ? "rgba(231,105,55,0.18)" : "rgba(231,105,55,0.12)",
  iconChipBulk:  darkMode ? "rgba(23,170,151,0.18)"  : "rgba(23,170,151,0.12)",

  // Particles
  particle1: darkMode ? "rgba(23,170,151,0.07)"  : "rgba(23,170,151,0.10)",
  particle2: darkMode ? "rgba(231,105,55,0.05)"  : "rgba(231,105,55,0.07)",

  // Toggle button
  toggleBg: darkMode ? "rgba(11,17,32,0.70)" : "rgba(255,255,255,0.22)",
  toggleBorder: darkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.35)",
  toggleColor: "#fff",
});

const EmailSearch = () => {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const T = makeTokens(darkMode);

  const [isEmailCardHover, setIsEmailCardHover] = useState(false);
  const [isBulkCardHover,  setIsBulkCardHover]  = useState(false);
  const [pageLoaded,       setPageLoaded]        = useState(false);

  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [domain,       setDomain]       = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);

  const [isFindHover,   setIsFindHover]   = useState(false);
  const [isChooseHover, setIsChooseHover] = useState(false);
  const [isWatchHover,  setIsWatchHover]  = useState(false);
  const [isGuideHover,  setIsGuideHover]  = useState(false);
  const [isUploadBoxHover, setIsUploadBoxHover] = useState(false);
  const [focusField, setFocusField] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleEmailSearch = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !domain) { alert("Please fill in all fields"); return; }
    if (!selectedFile) { alert("Please select a file when entering first name, last name, and domain"); return; }
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); }, 1200);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const inputStyle = (name) => ({
    flex: 1,
    padding: "11px 12px",
    fontSize: 15,
    borderRadius: 10,
    outline: "none",
    background: T.inputBg,
    color: T.inputColor,
    border: T.inputBorder(focusField === name),
    boxShadow: T.inputShadow(focusField === name),
    transition: "all 200ms ease",
  });

  return (
    <div>
      {/* ── Header banner ─────────────────────────────────────────────────── */}
<div style={{
  background: darkMode
    ? "linear-gradient(90deg, #020617, #0f172a)"
    : "linear-gradient(90deg, #17AA97, #E76937)",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px 30px",
  color: darkMode ? "#e2e8f0" : "#fff",
  fontWeight: 700,
  fontSize: 20,
  boxSizing: "border-box",
  minHeight: 65,
  gap: "30px",
  // marginBottom: "20px",
  flexWrap: "wrap",
}}>

  <span style={{
    flex: "1 1 300px",
    textAlign: "center",
    color: darkMode ? "#cbd5f5" : "#fff"
  }}>
    Learn how to collect targeted leads from any domain
  </span>

  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    justifyContent: "center"
  }}>

    {/* Watch Button */}
    <a href="https://uptoskills.com/" target="_blank" rel="noreferrer">
      <button
        onMouseEnter={() => setIsWatchHover(true)}
        onMouseLeave={() => setIsWatchHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: darkMode ? "#1e293b" : "#fff",
          color: darkMode ? "#38bdf8" : "#17AA97",
          border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "none",
          fontWeight: 700,
          padding: "11px 26px",
          borderRadius: 36,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: isWatchHover
            ? "0 12px 24px rgba(0,0,0,0.25)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          transform: isWatchHover
            ? "translateY(-2px) scale(1.03)"
            : "translateY(0) scale(1)",
          transition: "all 220ms ease",
        }}
      >
        <FaPlayCircle style={{
          color: darkMode ? "#38bdf8" : "#17AA97",
          fontSize: 21
        }} />
        Watch tutorial
      </button>
    </a>

    {/* Guide Button */}
    <a href="https://uptoskills.com/" target="_blank" rel="noreferrer">
      <button
        onMouseEnter={() => setIsGuideHover(true)}
        onMouseLeave={() => setIsGuideHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: darkMode ? "#1e293b" : "#fff",
          color: darkMode ? "#38bdf8" : "#17AA97",
          border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "none",
          fontWeight: 700,
          padding: "11px 26px",
          borderRadius: 36,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: isGuideHover
            ? "0 12px 24px rgba(0,0,0,0.25)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          transform: isGuideHover
            ? "translateY(-2px) scale(1.03)"
            : "translateY(0) scale(1)",
          transition: "all 220ms ease",
        }}
      >
        <FaBookOpen style={{
          color: darkMode ? "#38bdf8" : "#17AA97",
          fontSize: 21
        }} />
        Read Guide
      </button>
    </a>

    </div>
</div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{
        background: T.pageBg,
        boxSizing: "border-box", position: "relative",
        overflow: "hidden", padding: "18px", paddingBottom: "26px",
        transition: "background 300ms ease",
      }}>

        {/* Floating particles */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -40, left: -60, width: 220, height: 220, borderRadius: "50%", background: T.particle1, filter: "blur(1px)", animation: "float1 3.5s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: 120, right: -60, width: 180, height: 180, borderRadius: "50%", background: T.particle2, filter: "blur(2px)", animation: "float2 4s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "52%", left: -90, width: 190, height: 190, borderRadius: "50%", background: T.particle2, filter: "blur(2px)", animation: "float3 3.8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: -60, left: -80, width: 200, height: 200, borderRadius: "50%", background: T.particle1, filter: "blur(3px)", animation: "float4 4.5s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: 80, right: 60, width: 140, height: 140, borderRadius: "50%", background: T.particle1, filter: "blur(1px)", animation: "float5 3.2s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "42%", left: "46%", width: 170, height: 170, borderRadius: "50%", background: T.particle2, filter: "blur(2px)", animation: "float6 3.6s ease-in-out infinite" }} />
        </div>

        {/* ── Email Search card ──────────────────────────────────────────── */}
        <div
          onMouseEnter={() => setIsEmailCardHover(true)}
          onMouseLeave={() => setIsEmailCardHover(false)}
          style={{
            width: "100%", margin: "0 0 30px 0", borderRadius: 18,
            border: isEmailCardHover ? T.cardBorderHoverEmail : T.cardBorderDefault,
            background: T.cardBg,
            backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
            padding: "40px", boxSizing: "border-box",
            boxShadow: isEmailCardHover ? T.cardShadowHoverEmail : T.cardShadowDefault,
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? (isEmailCardHover ? "translateY(-5px)" : "translateY(0px)") : "translateY(18px)",
            transition: "all 320ms ease",
            position: "relative", overflow: "hidden", zIndex: 1,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #E76937, #CC4F22)" }} />
          <div style={{ position: "absolute", top: 0, left: "-40%", width: "40%", height: 5, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)", animation: "shimmer 2.2s linear infinite" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: T.iconChipEmail }}>
              <span style={{ fontSize: 18, animation: "iconFloat 2.4s ease-in-out infinite" }}>🔍</span>
            </div>
            <h2 style={{ color: T.heading, fontSize: 18, margin: 0, fontWeight: 800 }}>Email Search</h2>
          </div>

          <p style={{ fontSize: 15, marginBottom: 16, color: T.subtext }}>
            Find email from your leads name and company
          </p>

          <form onSubmit={handleEmailSearch}>
            <div style={{ display: "flex", gap: 27, marginBottom: 22 }}>
              {["first", "last", "domain"].map((field, i) => (
                <input
                  key={field}
                  style={inputStyle(field)}
                  placeholder={["First Name", "Last Name", "Company Domain Name"][i]}
                  value={[firstName, lastName, domain][i]}
                  onFocus={() => setFocusField(field)}
                  onBlur={() => setFocusField("")}
                  onChange={(e) => [setFirstName, setLastName, setDomain][i](e.target.value)}
                />
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="submit"
                onMouseEnter={() => setIsFindHover(true)}
                onMouseLeave={() => setIsFindHover(false)}
                style={{
                  background: "linear-gradient(90deg, #E76937, #CC4F22)",
                  color: "#fff", border: "none", fontWeight: 700, fontSize: 15,
                  borderRadius: 12, padding: "11px 40px", marginTop: 2, cursor: "pointer",
                  boxShadow: isFindHover ? "0 14px 28px rgba(231,105,55,0.35)" : "0 2px 7px rgba(0,0,0,0.08)",
                  transform: isFindHover ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)",
                  transition: "all 220ms ease",
                }}
              >
                {isLoading ? "Searching..." : "Find Email"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Bulk Email Search card ─────────────────────────────────────── */}
        <div
          onMouseEnter={() => setIsBulkCardHover(true)}
          onMouseLeave={() => setIsBulkCardHover(false)}
          style={{
            width: "100%", margin: 0, borderRadius: 18,
            border: isBulkCardHover ? T.cardBorderHoverBulk : T.cardBorderDefault,
            background: T.cardBg,
            backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
            padding: "40px", boxSizing: "border-box",
            boxShadow: isBulkCardHover ? T.cardShadowHoverBulk : T.cardShadowDefault,
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? (isBulkCardHover ? "translateY(-5px)" : "translateY(0px)") : "translateY(28px)",
            transition: "all 340ms ease", transitionDelay: "120ms",
            position: "relative", overflow: "hidden", zIndex: 1,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #17AA97, #0E887B)" }} />
          <div style={{ position: "absolute", top: 0, left: "-40%", width: "40%", height: 5, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)", animation: "shimmer 2.2s linear infinite", animationDelay: "0.4s" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: T.iconChipBulk }}>
              <span style={{ fontSize: 18, animation: "iconFloat 2.4s ease-in-out infinite" }}>📤</span>
            </div>
            <h2 style={{ color: T.heading, fontSize: 18, margin: 0, fontWeight: 800 }}>Bulk Email Search</h2>
          </div>

          <p style={{ fontSize: 15, marginBottom: 14, color: T.subtext }}>
            Collect emails in bulk from a list of lead names and company domains
          </p>

          {/* Upload drop zone */}
          <div
            onMouseEnter={() => setIsUploadBoxHover(true)}
            onMouseLeave={() => setIsUploadBoxHover(false)}
            style={{
              border: T.uploadBoxBorder, borderRadius: 14,
              background: T.uploadBoxBg,
              padding: "36px 0 34px 0", textAlign: "center", minHeight: 140,
              position: "relative",
              boxShadow: isUploadBoxHover
                ? "0 0 0 5px rgba(23,170,151,0.12)"
                : darkMode
                ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                : "inset 0 0 0 1px rgba(231,105,55,0.06)",
              transition: "all 260ms ease",
            }}
          >
            <div style={{ color: T.uploadBoxTitle, fontWeight: 800, fontSize: 19, marginBottom: 17, marginTop: 7 }}>
              Upload or drop a file here
            </div>

            <label
              htmlFor="file-upload"
              onMouseEnter={() => setIsChooseHover(true)}
              onMouseLeave={() => setIsChooseHover(false)}
              style={{
                color: T.chooseFileColor,
                background: T.chooseFileBg(isChooseHover),
                fontSize: 17, display: "inline-flex", alignItems: "center", gap: 10,
                padding: "15px 40px", borderRadius: 12, fontWeight: 700,
                marginBottom: 6, marginTop: 4, cursor: "pointer",
                boxShadow: isChooseHover ? "0 14px 26px rgba(231,105,55,0.18)" : "0 1px 5px rgba(23,170,151,0.25)",
                transform: isChooseHover ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
                transition: "all 220ms ease",
                border: T.chooseFileBorder(isChooseHover),
                letterSpacing: 0.4,
              }}
            >
              <FaUpload style={{ fontSize: 20 }} />
              <span>Choose file</span>
              <input id="file-upload" name="file-upload" type="file" style={{ display: "none" }} onChange={handleFileChange} />
            </label>

            <div style={{ margin: "18px auto 0 auto", color: T.menuGray, fontSize: 15, fontWeight: 500, maxWidth: 530 }}>
              Process up to 50,000 domain searches at once with our Bulk Email Search feature.
            </div>

            {selectedFile && (
              <div style={{ backgroundColor: T.fileChipBg, border: T.fileChipBorder, borderRadius: "10px", padding: "10px 18px", marginTop: 16, fontSize: 15, color: T.fileChipColor, fontWeight: 700, display: "inline-block" }}>
                Selected file: <span style={{ fontWeight: 900 }}>{selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(70px,45px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-80px,60px)} }
          @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(90px,-55px)} }
          @keyframes float4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-100px,-65px)} }
          @keyframes float5 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,40px)} }
          @keyframes float6 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(70px,-40px)} }
          @keyframes shimmer {
            0%   { left:-40%; opacity:0.2; }
            15%  { opacity:0.8; }
            55%  { opacity:0.65; }
            100% { left:110%; opacity:0.15; }
          }
          @keyframes iconFloat {
            0%,100% { transform:translateY(0px); }
            50%     { transform:translateY(-3px); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EmailSearch;