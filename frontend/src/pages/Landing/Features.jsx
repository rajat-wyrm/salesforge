import React, { useState, createContext, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext"; 
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

// ---------- Features Section ----------
function Features() {
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
    const { theme } = useTheme();
    const darkMode = theme === "dark";
    console.log("DarkMode: ", darkMode);

  const features = [
    {
      id: "lead-management",
      title: "Lead Management",
      desc: "Create, edit, tag, and track leads with clear status stages.",
      icon: <FaUsers size={24} />,
      color: "from-violet-500 to-purple-600",
      details:
        "Organize your entire lead pipeline with our intuitive management system. Set custom stages, automate workflows, and track every interaction to ensure no opportunity is missed.",
    },
    {
      id: "org-management",
      title: "Organization Management",
      desc: "Manage companies and accounts by linking multiple leads together.",
      icon: <FaBuilding size={24} />,
      color: "from-purple-500 to-indigo-600",
      details:
        "Group leads by organization and unlock company-level insights. Track organizational details, relationships, and aggregate metrics across all linked leads and contacts.",
    },
    {
      id: "data-enrichment",
      title: "Data Enrichment Tools",
      desc: "Enrich leads using email search, domain lookup, and social data.",
      icon: <FaSearch size={24} />,
      color: "from-indigo-500 to-blue-600",
      details:
        "Instantly enrich incomplete data with verified emails, social profiles, and company information. Our AI-powered enrichment ensures your database stays fresh and accurate.",
    },
    {
      id: "analytics",
      title: "Analytics & Insights",
      desc: "Track lead funnels, activities, and conversion metrics.",
      icon: <FaChartLine size={24} />,
      color: "from-blue-500 to-cyan-600",
      details:
        "Visualize your sales pipeline and conversion metrics in real-time. Build custom dashboards to monitor what matters most to your team's success.",
    },
  ];

  return (
    <section
      id="features"
      className={`py-24 relative ${
        darkMode ? "bg-slate-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
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
            Powerful Features
          </h2>
          <p
            className={`text-lg ${
              darkMode ? "text-gray-400" : "text-gray-600"
            } max-w-2xl mx-auto`}
          >
            Everything you need to manage leads, organizations, and outreach in one
            simple platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              onClick={() => handleCardClick(feature)}
              className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                darkMode
                  ? "bg-slate-800 border-slate-700 hover:border-violet-500/30 hover:bg-slate-800/80"
                  : "bg-white border-gray-200 hover:border-violet-300 hover:bg-white"
              } hover:shadow-xl hover:-translate-y-1`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-xl mb-4 text-white bg-gradient-to-r ${feature.color}`}
              >
                {feature.icon}
              </div>

              {/* Content */}
              <h3
                className={`text-lg font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {feature.desc}
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

export default Features;
