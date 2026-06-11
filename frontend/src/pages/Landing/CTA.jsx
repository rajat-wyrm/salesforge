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

// ---------- CTA Section ----------
function CTA() {
  const { theme } = useTheme();
      const darkMode = theme === "dark";

  return (
    <section
      className={`py-20 ${
        darkMode
          ? "bg-gradient-to-r from-slate-900 to-slate-950"
          : "bg-gradient-to-r from-violet-50 to-purple-50"
      }`}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`text-4xl md:text-5xl font-bold mb-6 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Ready to Transform Your Lead Generation?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`text-lg mb-8 ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Join hundreds of sales teams and founders already using UptoSkills to
          build their ideal customer lists.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/signup"
            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105"
          >
            Start for Free
          </Link>
          <button
            className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 border ${
              darkMode
                ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                : "border-violet-300 bg-white hover:bg-violet-50 text-gray-900"
            }`}
          ><Link to="/login">
            Schedule Demo
          </Link>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
