import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalProvider } from "@/context/ModalContext";
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
import { Link } from "react-router-dom";

//import the components
import ModalManager from "./ModalManager";
import Navbar from "./Navbar";
import Pricing from "./Pricing";
import UseCases from "./UseCases";
import CTA from "./CTA";
import Footer from "./Footer";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import Hero from "./Hero";

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

import { useTheme } from "../../context/ThemeContext";
import { ThemeToggle } from "../../context/ThemeToggle";

export default function LandingPage() {

  const {Theme} = useTheme();
  const darkMode = Theme =="dark";
  console.log("Checking imports:", { Pricing, Navbar, Footer, UseCases, ModalManager, LandingPage, HowItWorks, Hero, Features, CTA });

  return (
    
      <div
        className={`w-full min-h-screen antialiased transition-colors duration-500 ${
          darkMode
            ? "bg-slate-950 text-gray-100"
            : "bg-white text-gray-900"
        }`}
      >
        <ModalProvider>

        <Navbar />
        <ChatBotButton />

        <main className="pt-16">
          <Hero />
          <Features />
          <HowItWorks />
          <UseCases />
          <Pricing />
          <CTA />
        </main>

        <Footer />

          {/* Global Modal */}
        
          <ModalManager />
        </ModalProvider>
      </div>
  );
}

// ---------- ChatBot Button ----------
function ChatBotButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200"
      aria-label="Open Chatbot"
    >
      <FaComments size={24} />
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-white animate-pulse"></span>
    </motion.button>
  );
}
