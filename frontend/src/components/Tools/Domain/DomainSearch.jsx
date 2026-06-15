import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import image from "../../../assets/domain-search1.png";
import {
  FaPlayCircle,
  FaBook,
  FaCheck,
  FaFileUpload,
  FaChevronDown,
  FaArrowRight,
  FaCheckCircle,
  FaUsers,
  FaGlobe,
  FaStar,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";

const DomainSearchApp = () => {
  const [activePage, setActivePage] = useState("single");
  const [selectedUpload, setSelectedUpload] = useState("upload");
  const [companyInput, setCompanyInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  // ── Design tokens (mirrors Insights.jsx pattern) ──────────────────────────
  const pageBg   = darkMode ? "bg-slate-950"                           : "bg-gradient-to-br from-slate-50 via-white to-blue-50";
  const card     = darkMode ? "bg-slate-900 border-slate-800"          : "bg-white border-slate-100";
  const cardHover= darkMode ? "hover:border-slate-600"                 : "hover:border-teal-300";
  const heading  = darkMode ? "text-white"                             : "text-gray-900";
  const muted    = darkMode ? "text-slate-400"                         : "text-gray-600";
  const inputBg  = darkMode ? "bg-slate-800 text-slate-100 placeholder-slate-500" : "bg-white text-gray-900 placeholder-gray-500";
  const selectBg = darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900";
  const optionsBg= darkMode ? "bg-slate-800"                           : "bg-white";
  const divider  = darkMode ? "border-slate-800"                       : "border-slate-100";
  const recentCard=darkMode ? "bg-slate-800/60 border-slate-700 hover:border-teal-500" : "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100 hover:border-teal-300";
  const bannerBg = "bg-gradient-to-r from-teal-600 to-emerald-600"; // always teal

  // ── Logic ──────────────────────────────────────────────────────────────────
  const companyLists = ["Select list", "Tech Companies", "Fortune 500", "Startups"];

  const handleSearch = async () => {
  try {
    setIsSearching(true);

    const response = await axios.post(
      "http://localhost:5000/app/search/email",
      {
        email: companyInput,
      }
    );

    console.log(response.data);

    alert("Search completed successfully!");
  } catch (error) {
    console.error(error);

    alert("Search failed!");
  } finally {
    setIsSearching(false);
  }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedUpload("upload");
      alert("File selected: " + file.name);
    }
  };

  // ── Upload card active styles ──────────────────────────────────────────────
  const uploadCardActive = darkMode
    ? "border-teal-500 bg-teal-900/20"
    : "border-teal-500 bg-teal-50/50";
  const uploadCardIdle   = darkMode
    ? `border-slate-700 bg-slate-900 hover:border-teal-600 hover:bg-teal-900/10`
    : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/20";

  // ── Theme toggle button ────────────────────────────────────────────────────
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      aria-label="Toggle darkMode mode"
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
        darkMode
          ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          : "bg-white/20 border-white/30 text-white hover:bg-white/30"
      }`}
    >
      {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-white" />}
      {darkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );

  // ── Search-options accordion card ──────────────────────────────────────────
  const settingsCard = darkMode
    ? "bg-slate-900 border-slate-700 hover:border-teal-600"
    : "bg-white border-gray-200 hover:border-teal-300";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>

     {/* Tutorial Banner */}
    <div
      className={`${
        darkMode
          ? "bg-gray-900 text-gray-200"
          : `${bannerBg} text-white`
      } px-6 md:px-10 py-4 shadow-sm transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <span
          className={`text-sm font-medium ${
            darkMode ? "text-gray-300" : "text-white"
          }`}
        >
          💡 Learn how to collect verified leads from any domain
        </span>

        <div className="flex gap-3 flex-wrap items-center">
          
          <motion.a
            href="https://www.youtube.com/watch?v=ynSz8u0eqNc"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.15,
              boxShadow: darkMode
                ? "0 0 30px rgba(249,115,22,0.9)"
                : "0 0 30px rgba(249,115,22,0.7)",
            }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                : "bg-white/20 hover:bg-white/30 text-white"
            }`}
          >
            <FaPlayCircle className="text-lg" />
            Watch Tutorial
          </motion.a>

          <motion.a
            href="https://uptoskills.com/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            whileHover={{
              scale: 1.12,
              boxShadow: darkMode
                ? "0 0 25px rgba(16,185,129,0.9)"
                : "0 0 25px rgba(16,185,129,0.6)",
            }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                : "bg-white/20 hover:bg-white/30 text-white"
            }`}
          >
            <FaBook className="text-lg" />
            Read Guide
          </motion.a>

        </div>
      </div>
    </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SINGLE SEARCH PAGE
      ═══════════════════════════════════════════════════════════════════ */}
      {activePage === "single" && (
        <div className="px-6 md:px-10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">

            {/* Hero Card */}
            <div className={`rounded-2xl overflow-hidden shadow-sm border ${card} mb-12 transition-colors duration-300`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">

                {/* Left — always teal gradient */}
                <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 px-8 md:px-12 py-12 md:py-16 text-white flex flex-col justify-center">
                  <div className="mb-6">
                    <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      🔍 Domain Search
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                      Find Targeted Leads by Domain
                    </h1>
                    <p className="text-white/90 text-base md:text-lg max-w-md leading-relaxed">
                      Discover verified email addresses, job titles, and contact information from any company domain in seconds.
                    </p>
                  </div>

                  {/* Search Box */}
                  <div className={`rounded-xl p-1 flex flex-col sm:flex-row gap-2 mt-8 ${darkMode ? "bg-slate-800/80" : "bg-white"}`}>
                    <input
                      type="text"
                      className={`flex-1 px-6 py-3 focus:outline-none rounded-lg text-base font-medium transition-colors ${inputBg}`}
                      placeholder="example.com"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap disabled:opacity-75"
                    >
                      {isSearching ? "Searching..." : "Search Domain"}
                      <FaArrowRight className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Right Image */}
                <div className={`hidden lg:flex items-center justify-center px-8 transition-colors ${darkMode ? "bg-slate-900" : "bg-gradient-to-br from-white to-blue-50"}`}>
                  <div className="relative">
                    <img
                      src={image}
                      alt="Domain search illustration"
                      className={`w-full max-w-lg drop-shadow-lg ${darkMode ? "opacity-80" : ""}`}
                    />
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-teal-200/30 rounded-full blur-3xl"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features + Recent Searches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Features */}
              <div className={`rounded-2xl p-8 md:p-10 shadow-sm border transition-colors duration-300 ${card}`}>
                <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${heading}`}>
                  Search in Bulk
                </h2>
                <p className={`mb-8 ${muted}`}>
                  Generate thousands of verified leads instantly with our powerful bulk search feature.
                </p>

                <ul className="space-y-4">
                  {[
                    { title: "100,000+ prospects daily",       sub: "Gather unlimited new leads every day" },
                    { title: "Filter by job title & location", sub: "Find decision makers in your target market" },
                    { title: "20,000 domains at once",         sub: "Search multiple companies simultaneously" },
                    { title: "Verified email addresses",       sub: "High deliverability rates guaranteed" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FaCheckCircle className="text-teal-500 mt-1 flex-shrink-0" />
                      <div>
                        <div className={`font-semibold ${heading}`}>{item.title}</div>
                        <p className={`text-sm ${muted}`}>{item.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleSearch}
                  className="mt-10 w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 group"
                >
                  Start Bulk Search
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Recent Searches */}
              <div className={`rounded-2xl p-8 md:p-10 shadow-sm border transition-colors duration-300 ${card}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${heading}`}>
                  <FaStar className="text-yellow-500" /> Recent Searches
                </h3>

                <div className="space-y-4">
                  {[
                    { name: "Tech Founders",   date: "Jan 15, 2025", status: "Completed", found: 1243, success: 92 },
                    { name: "Fortune 500 CEOs",date: "Jan 12, 2025", status: "Completed", found: 487,  success: 85 },
                    { name: "Startup CTOs",    date: "Jan 10, 2025", status: "Completed", found: 856,  success: 88 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer group ${recentCard}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className={`font-semibold ${heading}`}>{item.name}</p>
                          <p className={`text-xs ${muted}`}>{item.date}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? "bg-teal-900/50 text-teal-300" : "bg-green-100 text-green-700"}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={muted}>
                          <strong className={darkMode ? "text-slate-200" : "text-gray-900"}>{item.found}</strong> prospects found
                        </span>
                        <span className="text-teal-500 font-semibold group-hover:underline">
                          View Results →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BULK SEARCH PAGE
      ═══════════════════════════════════════════════════════════════════ */}
      {activePage === "bulk" && (
        <div className="px-6 md:px-10 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-12">
              <button
                onClick={() => setActivePage("single")}
                className="text-teal-500 hover:text-teal-400 font-medium text-sm flex items-center gap-1 mb-4 transition-colors"
              >
                ← Back to Domain Search
              </button>
              <h1 className={`text-4xl md:text-5xl font-bold mb-3 ${heading}`}>
                Bulk Domain Search
              </h1>
              <p className={`text-lg ${muted}`}>
                Upload a CSV file or choose from pre-built company lists to search multiple domains at once.
              </p>
            </div>

            {/* Upload Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* Upload File */}
              <div
                onClick={() => setSelectedUpload("upload")}
                className={`relative p-8 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedUpload === "upload" ? uploadCardActive : uploadCardIdle
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`text-lg font-bold ${heading}`}>Upload CSV File</h3>
                  {selectedUpload === "upload" && (
                    <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white">
                      <FaCheck className="text-sm" />
                    </div>
                  )}
                </div>
                <p className={`text-sm mb-5 ${muted}`}>
                  Upload a CSV, Excel, or text file with domain names or company URLs
                </p>
                <label className="inline-flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors">
                  <FaFileUpload className="text-lg" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Preset Lists */}
              <div
                onClick={() => setSelectedUpload("company")}
                className={`relative p-8 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedUpload === "company" ? uploadCardActive : uploadCardIdle
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`text-lg font-bold ${heading}`}>Preset Lists</h3>
                  {selectedUpload === "company" && (
                    <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white">
                      <FaCheck className="text-sm" />
                    </div>
                  )}
                </div>
                <p className={`text-sm mb-5 ${muted}`}>
                  Choose from our curated lists of verified companies
                </p>
                <div className="relative">
                  <select className={`w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:border-teal-500 appearance-none cursor-pointer transition-colors ${selectBg}`}>
                    {companyLists.map((list) => (
                      <option key={list} value={list} className={optionsBg}>
                        {list}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? "text-slate-400" : "text-gray-400"}`} />
                </div>
              </div>
            </div>

            {/* Customize Search */}
            <div className={`rounded-xl border-2 p-6 md:p-8 mb-8 transition-colors duration-300 cursor-pointer ${settingsCard}`}>
              <div className="flex items-start gap-4">
                <div className="text-2xl">⚙️</div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${heading}`}>
                    Customize Your Search
                  </h3>
                  <p className={`text-sm ${muted}`}>
                    Filter by job title, department, location, and company size for more targeted results
                  </p>
                </div>
                <FaChevronDown className={darkMode ? "text-slate-500 flex-shrink-0 mt-1" : "text-gray-400 flex-shrink-0 mt-1"} />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 text-lg group shadow-sm hover:shadow-md">
                Start Bulk Search
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className={`px-8 py-4 border-2 rounded-lg font-bold transition-colors ${
                darkMode
                  ? "border-slate-700 hover:border-teal-600 text-slate-200 bg-slate-900"
                  : "border-gray-200 hover:border-teal-300 text-gray-900 bg-white"
              }`}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainSearchApp;