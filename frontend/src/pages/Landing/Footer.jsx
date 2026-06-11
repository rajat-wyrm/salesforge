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

// ---------- Footer ----------
function Footer() {
  const { theme } = useTheme();
      const darkMode = theme === "dark";

  const footerLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  const socialLinks = [
    { icon: <FaTwitter size={18} />, label: "Twitter" },
    { icon: <FaLinkedin size={18} />, label: "LinkedIn" },
    { icon: <FaFacebook size={18} />, label: "Facebook" },
  ];

  return (
    <footer
      className={`border-t ${
        darkMode
          ? "bg-slate-950 border-slate-800"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <img src={logoMainImg} alt="UptoSkills" className="h-8 w-auto mb-4" />
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Generate leads and grow your business with verified data.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4
              className={`font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Product
            </h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "Security", "Roadmap"].map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className={`text-sm transition-colors ${
                      darkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4
              className={`font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className={`text-sm transition-colors ${
                      darkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4
              className={`font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Legal
            </h4>
            <ul className="space-y-3">
              {["Privacy", "Terms", "Data Policy", "Compliance"].map((link, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className={`text-sm transition-colors ${
                      darkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div
          className={`h-px mb-8 ${
            darkMode ? "bg-slate-800" : "bg-gray-200"
          }`}
        ></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            © {new Date().getFullYear()} UptoSkills. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href="#"
                aria-label={social.label}
                className={`p-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700"
                    : "bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300"
                }`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
