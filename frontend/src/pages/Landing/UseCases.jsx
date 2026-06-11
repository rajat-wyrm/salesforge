import { useModal } from "../../context/ModalContext"; 
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


// ---------- Use Cases ----------
function UseCases() {
  const { theme } = useTheme();
      const darkMode = theme === "dark";

      const { setSelectedModal } = useModal();
      
          const handleCardClick = (feature) => {
              setSelectedModal({
                  id: feature.id,
                  title: feature.title,
                  desc: feature.desc,
                  icon: feature.icon,
                  color: feature.color,
                  details: feature.details
              });
          };

  const useCases = [
    {
      id: "sales-teams",
      title: "Sales Teams",
      desc: "Track leads, manage follow-ups, and monitor pipeline status.",
      icon: <FaChartLine size={24} />,
      color: "from-violet-500 to-purple-600",
      details:
        "Close more deals with a complete view of your sales pipeline. Automate follow-ups, track engagement metrics, and prioritize high-value opportunities.",
    },
    {
      id: "founders",
      title: "Startup Founders",
      desc: "Organize early-stage outreach and manage contacts efficiently.",
      icon: <FaRocket size={24} />,
      color: "from-purple-500 to-indigo-600",
      details:
        "Build your customer base from scratch with organized lead management. Perfect for B2B founders doing hands-on outreach during growth stages.",
    },
    {
      id: "recruiters",
      title: "Recruiters & Agencies",
      desc: "Store candidate and client data with enriched profiles.",
      icon: <FaUserTie size={24} />,
      color: "from-indigo-500 to-blue-600",
      details:
        "Manage your entire talent pipeline with enriched candidate profiles. Link candidates to companies and track all interactions in one place.",
    },
    {
      id: "sales-ops",
      title: "Sales Operations",
      desc: "Centralize outreach data and support your sales team.",
      icon: <FaUserGraduate size={24} />,
      color: "from-blue-500 to-cyan-600",
      details:
        "Build CRM workflows that scale. Standardize processes, maintain data quality, and provide actionable insights to your entire organization.",
    },
  ];

  return (
    <section
      id="usecases"
      className={`py-24 ${
        darkMode ? "bg-slate-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Built for Different Teams
          </h2>
          <p
            className={`text-lg ${
              darkMode ? "text-gray-400" : "text-gray-600"
            } max-w-2xl mx-auto`}
          >
            Whether you're a sales team, recruiter, or founder, UptoSkills adapts to your needs.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.id}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              onClick={() => handleCardClick(useCase)}
              className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                darkMode
                  ? "bg-slate-800 border-slate-700 hover:border-violet-500/30 hover:bg-slate-800/80"
                  : "bg-white border-gray-200 hover:border-violet-300 hover:bg-white"
              } hover:shadow-xl hover:-translate-y-1`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-xl mb-4 text-white bg-gradient-to-r ${useCase.color}`}
              >
                {useCase.icon}
              </div>

              {/* Content */}
              <h3
                className={`text-lg font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {useCase.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {useCase.desc}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-2 text-violet-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <FaArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UseCases;
