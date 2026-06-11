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
import { logoMainImg } from "./landingAssets";

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

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { theme } = useTheme();
    const darkMode = theme === "dark";
    console.log("DarkMode: ", darkMode);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#usecases" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        darkMode
          ? "bg-slate-950/80 border-slate-800"
          : "bg-white/80 border-gray-200"
      } border-b backdrop-blur-xl`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        
        {/* LEFT - Logo */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoMainImg}
              alt="UptoSkills Logo"
              className="h-14 w-auto"
            />
          </Link>
        </div>

        {/* CENTER - Nav Links */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-10">
          {navLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className={`relative text-sm font-semibold tracking-wide transition-all duration-300 group ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <span className="group-hover:scale-105 inline-block transition-transform duration-300">
                {link.label}
              </span>

              <span
                className={`absolute left-0 -bottom-1 h-[2px] w-0 transition-all duration-300 group-hover:w-full ${
                  darkMode ? "bg-white" : "bg-gray-900"
                }`}
              ></span>
            </a>
          ))}
        </nav>

        {/* RIGHT - Actions */}
        <div className="flex-1 flex justify-end items-center gap-4">
          
          {/* Theme Toggle */}
          <div>
            <ThemeToggle/>
          </div>

          {/* Login */}
          <Link
            to="/login"
            className={`hidden md:block text-sm font-medium ${
              darkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Log in
          </Link>

          {/* Sign Up */}
          <Link
            to="/signup"
            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:scale-105 transition"
          >
            Sign Up
          </Link>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-xl"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden px-6 py-4 space-y-3 border-t ${
              darkMode ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="block text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
