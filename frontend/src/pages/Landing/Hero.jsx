import React, { useState, createContext, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTags,
  FaLinkedin,
  FaRocket,
  FaUserTie,
  FaUserGraduate,
  FaTwitter,
  FaFacebook,
  FaComments,
  FaSearch,
  FaDatabase,
  FaGlobe,
  FaLink,
  FaTimes,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaLock,
  FaBolt,
  FaArrowRight,
} from "react-icons/fa";


// Public assets should be referenced by URL strings in Vite.
import { dashboardImg } from "./landingAssets";

const LOGO_TEXT = "UptoSkills";

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const scaleInUp = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { ThemeToggle } from "../../context/ThemeToggle";


function Hero() {
  const { theme } = useTheme();
  const darkMode = theme =="dark";
  console.log("DarkMode : ", darkMode);

  return (
    <section
      className={`relative min-h-screen flex items-center overflow-hidden pt-20 ${
        darkMode ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-br from-white via-gray-50 to-white"
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-violet-500" : "bg-violet-200"
          }`}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ top: "10%", right: "10%" }}
        />
        <motion.div
          className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-purple-500" : "bg-purple-200"
          }`}
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ bottom: "10%", left: "5%" }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-auto  lg:gap-20 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="relative">
              {/* Decorative elements */}
              <div
                className={`absolute inset-0 rounded-2xl blur-2xl opacity-30 ${
                  darkMode
                    ? "bg-gradient-to-r from-violet-500 to-purple-600"
                    : "bg-gradient-to-r from-violet-300 to-purple-300"
                }`}
              />
              <img
                src={dashboardImg}
                alt="Dashboard"
                className="relative rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                darkMode
                  ? " bg-violet-50 border border-violet-200"
                  : "bg-violet-50 border border-violet-200"
              }`}
            >
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              <span className="text-sm font-medium">Powered by Real-time Data</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className={`text-5xl md:text-6xl lg:text-6xl font-bold leading-tight mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600">
                Unlock Your Best
              </span>
              <br />
              <span>Leads in Seconds</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className={`text-lg leading-relaxed mb-8 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Discover verified email addresses, social profiles, and enriched company data. 
              Apply smart filters and build your perfect customer list in moments.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started Free
                <FaArrowRight size={16} />
              </Link>
              
              <button
                className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 border ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                    : "border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-900"
                }`}
              >
                <Link to="/login">
                Watch Demo
                </Link>
                
              </button>
              
            </motion.div>

            {/* Features List */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-gray-200 dark:border-slate-800"
            >
              {[
                { label: "Verified Data", icon: "✓" },
                { label: "Instant Export", icon: "⚡" },
                { label: "No Credit Card", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
