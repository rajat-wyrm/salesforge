import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";

const COLORS = {
  orange: "#E76937",
  green:  "#17AA97",
};

// ── Banner ────────────────────────────────────────────────────────────────────
const Banner = ({ dark, toggleTheme }) => (
  <div className="relative overflow-hidden">
    
    <div
      className="w-full py-10 transition-all duration-300"
      style={{
        background: dark
          ? "linear-gradient(90deg, #020617, #0f172a)"
          : `linear-gradient(90deg, ${COLORS.green}, ${COLORS.orange})`
      }}
    >

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4"
      >

        {/* Heading */}
        <h1 className="text-xl md:text-2xl font-semibold transition-colors"
          style={{ color: dark ? "#e2e8f0" : "#ffffff" }}>
          Learn how to collect targeted leads from any domain
        </h1>

        <div className="flex gap-3 flex-wrap items-center justify-center">

          {/* Read Guide */}
          <motion.a
            href="https://uptoskills.com/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.12,
              boxShadow: dark
                ? "0 0 25px rgba(56,189,248,0.5)"
                : "0 0 25px rgba(16,185,129,0.6)"
            }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-full font-semibold shadow-xl flex items-center gap-2 transition-all"
            style={{
              background: dark ? "#1e293b" : "#ffffff",
              color: dark ? "#38bdf8" : COLORS.green,
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
            }}
          >
            📘 Read Guide
          </motion.a>

          {/* Watch Tutorial */}
          <motion.a
            href="https://www.youtube.com/watch?v=ynSz8u0eqNc"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.15,
              boxShadow: dark
                ? "0 0 30px rgba(59,130,246,0.6)"
                : "0 0 30px rgba(249,115,22,0.7)"
            }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-full font-semibold shadow-xl flex items-center gap-3 transition-all"
            style={{
              background: dark ? "#1e293b" : "#ffffff",
              color: dark ? "#60a5fa" : COLORS.orange,
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
            }}
          >
            <motion.span
              className="flex items-center justify-center w-8 h-8 rounded-full text-white"
              style={{
                backgroundColor: dark ? "#3b82f6" : COLORS.orange
              }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ▶
            </motion.span>
            Watch Tutorial
          </motion.a>

          </div>  
      </motion.div>
    </div>
  </div>
);

// ── Search Tool card ──────────────────────────────────────────────────────────
const SearchTool = ({ dark }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver,   setIsDragOver]   = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const cardBg     = dark ? "rgba(17,27,48,0.95)"              : "#fff";
  const cardBorder = dark ? "1px solid rgba(255,255,255,0.08)"  : "1px solid rgba(23,170,151,0.18)";
  const heading    = dark ? "#f0f4ff" : "#1a2a3a";
  const subtext    = dark ? "#64748b" : "#6b7280";
  const dropBg     = dark
    ? isDragOver ? "rgba(23,170,151,0.12)" : "rgba(23,170,151,0.05)"
    : isDragOver ? "rgba(23,170,151,0.08)" : "rgba(23,170,151,0.02)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        background: cardBg, border: cardBorder,
        borderRadius: 20,
        boxShadow: dark ? "0 20px 56px rgba(0,0,0,0.40)" : "0 8px 32px rgba(23,170,151,0.10)",
        padding: "36px 32px",
        backdropFilter: "blur(10px)",
        transition: "background 300ms ease, border 300ms ease",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #17AA97, #E76937)" }} />
      <div style={{ position: "absolute", top: 0, left: "-40%", width: "40%", height: 4, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.80), transparent)", animation: "shimmerSocial 2.4s linear infinite" }} />

      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: heading }}>
        Social URL Search
      </h2>
      <p style={{ fontSize: 15, marginBottom: 24, color: subtext, lineHeight: 1.6 }}>
        Upload a CSV or TXT file containing LinkedIn profile links to extract email addresses associated with each profile.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setSelectedFile(f); }}
        style={{
          border: `2px dashed ${isDragOver ? COLORS.orange : COLORS.green}`,
          borderRadius: 16, padding: "32px 20px",
          textAlign: "center", marginBottom: 24,
          background: dropBg,
          transition: "all 250ms ease",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
        <input type="file" className="hidden" id="fileUpload" accept=".csv,.txt" onChange={handleFileChange} />
        <label
          htmlFor="fileUpload"
          style={{ cursor: "pointer", fontWeight: 700, fontSize: 16, color: COLORS.green }}
        >
          {selectedFile ? "Change File" : "Choose File"}
        </label>
        <p style={{ fontSize: 13, color: subtext, marginTop: 8 }}>
          {selectedFile ? selectedFile.name : "Drag & drop or click — CSV or TXT files only"}
        </p>
        {selectedFile && (
          <div style={{
            marginTop: 14, display: "inline-flex", alignItems: "center",
            background: dark ? "rgba(23,170,151,0.16)" : "rgba(23,170,151,0.08)",
            border: "1px solid rgba(23,170,151,0.28)",
            borderRadius: 99, padding: "6px 18px",
            fontSize: 13, fontWeight: 700, color: COLORS.green,
          }}>
            ✓ {selectedFile.name}
          </div>
        )}
      </div>

      <motion.button
        whileHover={selectedFile ? { scale: 1.03, boxShadow: "0 12px 28px rgba(231,105,55,0.35)" } : {}}
        whileTap={selectedFile ? { scale: 0.97 } : {}}
        disabled={!selectedFile}
        style={{
          width: "100%", padding: "14px 0",
          borderRadius: 14, border: "none",
          background: selectedFile ? `linear-gradient(90deg, ${COLORS.orange}, #CC4F22)` : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          color: selectedFile ? "#fff" : dark ? "#4a5568" : "#9ca3af",
          fontWeight: 800, fontSize: 16,
          cursor: selectedFile ? "pointer" : "not-allowed",
          transition: "all 260ms ease",
          boxShadow: selectedFile ? "0 6px 20px rgba(231,105,55,0.22)" : "none",
        }}
      >
        {selectedFile ? "Search" : "Upload a file to search"}
      </motion.button>
    </motion.div>
  );
};

// ── Feature cards ─────────────────────────────────────────────────────────────
const Features = ({ dark }) => {
  const features = [
    { icon: "⚡", title: "Bulk Processing",      text: "Process up to 20,000 profiles simultaneously" },
    { icon: "🔗", title: "Social Intelligence",   text: "Identify professional contacts through social media" },
    { icon: "✅", title: "Pre-verified Results",  text: "Reliable insights with pre-verified results" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 28 }}
    >
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 + 0.2 }}
          whileHover={{ y: -4, boxShadow: dark ? "0 16px 40px rgba(0,0,0,0.35)" : "0 16px 40px rgba(23,170,151,0.15)" }}
          style={{
            borderRadius: 18, padding: "26px 22px",
            background: dark ? "rgba(17,27,48,0.92)" : "#fff",
            border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(23,170,151,0.14)",
            boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.05)",
            backdropFilter: "blur(8px)",
            transition: "background 300ms ease, border 300ms ease",
            cursor: "default",
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14, marginBottom: 16,
            background: dark ? "rgba(23,170,151,0.16)" : "rgba(23,170,151,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>{f.icon}</div>
          <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: dark ? "#c8d8f0" : "#162944" }}>{f.title}</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: dark ? "#64748b" : "#6b7280", margin: 0 }}>{f.text}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────
const SocialUrlSearch = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  const pageBg = dark
    ? `radial-gradient(circle at 8% 12%, rgba(23,170,151,0.07), transparent 40%),
       radial-gradient(circle at 92% 88%, rgba(231,105,55,0.06), transparent 45%),
       #0b1120`
    : `radial-gradient(circle at 8% 12%, rgba(23,170,151,0.08), transparent 40%),
       radial-gradient(circle at 92% 88%, rgba(231,105,55,0.06), transparent 45%),
       #f4f9f9`;

  return (
    <div style={{ background: pageBg, minHeight: "100vh", transition: "background 300ms ease" }}>
      <Banner dark={dark} toggleTheme={toggleTheme} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 60px" }}>
        <SearchTool dark={dark} />
        <Features   dark={dark} />
      </div>

      <style>{`
        @keyframes shimmerSocial {
          0%   { left: -40%; opacity: 0.2; }
          15%  { opacity: 0.8; }
          55%  { opacity: 0.65; }
          100% { left: 110%; opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

export default SocialUrlSearch;