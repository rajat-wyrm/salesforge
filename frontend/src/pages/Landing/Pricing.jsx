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


function Pricing() {
    const {setSelectedModal} = useModal();
    const { theme } = useTheme();
    const darkMode = theme === "dark";

    const handleCardClick = (p) =>{
        setSelectedModal({
            id: p.id,
            name: p.name,
            price: p.price,
            desc: p.desc,
            features: p.features,
            cta: p.cta,
            highlighted: p.highlighted,
            details: p.details
        })
    }

  const plans = [
    {
      id: "free-plan",
      name: "Free",
      price: "₹0",
      desc: "Perfect for getting started with lead management.",
      features: ["Up to 100 leads", "Basic enrichment", "Single user"],
      cta: "Get Started",
      highlighted: false,
      details:
        "Start building your lead database for free. Ideal for individuals, interns, and small teams testing out lead management.",
    },
    {
      id: "pro-plan",
      name: "Professional",
      price: "₹999",
      desc: "Advanced features for growing teams.",
      features: [
        "Unlimited leads",
        "Advanced enrichment",
        "Team access (3 users)",
        "Analytics dashboard",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      details:
        "Scale your sales with unlimited leads and team collaboration. Includes all data enrichment tools and advanced analytics.",
    },
    {
      id: "enterprise-plan",
      name: "Enterprise",
      price: "Custom",
      desc: "For organizations with advanced requirements.",
      features: [
        "Custom lead limits",
        "Team & role-based access",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      highlighted: false,
      details:
        "Enterprise-grade solutions with dedicated support, custom integrations, and advanced security features.",
    },
  ];

  return (
    <section
      id="pricing"
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
            Simple, Transparent Pricing
          </h2>
          <p
            className={`text-lg ${
              darkMode ? "text-gray-400" : "text-gray-600"
            } max-w-2xl mx-auto`}
          >
            Choose the plan that fits your team's needs. No credit card required to start.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              onClick={() => setSelectedModal(plan)}
              className={`relative cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden group ${
                plan.highlighted
                  ? darkMode
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border-violet-500/30 hover:border-violet-500/50 shadow-xl"
                    : "bg-gradient-to-br from-white to-gray-50 border-violet-300 hover:border-violet-400 shadow-xl hover:shadow-violet-500/20"
                  : darkMode
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600"></div>
              )}

              {/* Content */}
              <div className="p-8">
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full mb-4">
                    MOST POPULAR
                  </div>
                )}

                <h3
                  className={`text-2xl font-bold mb-2 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>

                <p
                  className={`text-sm mb-6 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {plan.desc}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-600`}
                  >
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {" "}/month
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-6 transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                      : darkMode
                      ? "border border-slate-600 text-white hover:border-violet-500/50"
                      : "border border-gray-300 text-gray-900 hover:border-violet-300"
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-3 text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <span className="text-violet-500 font-bold mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
