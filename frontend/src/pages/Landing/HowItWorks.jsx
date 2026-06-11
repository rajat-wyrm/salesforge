import React, { useState, createContext, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/context/ModalContext";
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


// ---------- How It Works ----------
function HowItWorks() {

    // const {setSelectedModal} = useModal();

    // const handleCardClick = (h) =>{
    //     setSelectedModal({
    //         step: h.step,
    //         title: h.title,
    //         desc: h.desc,
    //         color: h.color
    //     })
    // }

    const { theme } = useTheme();
    const darkMode = theme === "dark";
    console.log("DarkMode: ", darkMode);

  const steps = [
    {
      step: "01",
      title: "Set Requirements",
      desc: "Choose your criteria: Job title, Location, Industry, and more.",
      color: "from-violet-500 to-purple-600",
    },
    {
      step: "02",
      title: "Run Search",
      desc: "Our engine scans millions of records to find verified matches.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      step: "03",
      title: "Export Data",
      desc: "Download your leads in CSV format and start your outreach.",
      color: "from-indigo-500 to-blue-600",
    },
  ];

  return (
    <section
      id="how-it-works"
      className={`py-24 ${
        darkMode ? "bg-slate-950" : "bg-white"
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
            Generate Targeted Leads <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600">
              in Bulk
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              // onClick={()=> handleCardClick(step)}
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              className={`relative p-8 rounded-2xl border transition-all duration-300 group ${
                darkMode
                  ? "bg-slate-900 border-slate-800 hover:border-violet-500/30"
                  : "bg-gray-50 border-gray-200 hover:border-violet-300"
              } hover:shadow-lg hover:-translate-y-1`}
            >
              {/* Step Number */}
              <div
                className={`text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${step.color}`}
              >
                {step.step}
              </div>

              {/* Content */}
              <h3
                className={`text-xl font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {step.desc}
              </p>

              {/* Accent line */}
              <div
                className={`h-1 w-12 mt-6 rounded-full bg-gradient-to-r ${step.color} group-hover:w-16 transition-all duration-300`}
              />
            </motion.div>
          ))}
        </div>

        {/* Connector Lines */}
        <div className="hidden md:flex justify-between items-center mt-8 px-12">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
