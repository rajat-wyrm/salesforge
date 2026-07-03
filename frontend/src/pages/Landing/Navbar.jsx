import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { ThemeToggle } from "../../context/ThemeToggle";
import GlowButton from "@/components/GlowButton";
import { logoMainImg } from "./landingAssets";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#usecases" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-500 ${
        darkMode
          ? "bg-slate-950/60 border-slate-800/50"
          : "bg-white/60 border-gray-200/50"
      } border-b backdrop-blur-xl`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={logoMainImg}
              alt="UptoSkills Logo"
              className="h-14 w-auto transition-transform duration-300"
            />
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-10">
          {navLinks.map((link, i) => (
            <motion.a
              key={i}
              href={link.href}
              whileHover={{ y: -1 }}
              className={`relative text-sm font-semibold tracking-wide transition-all duration-300 group ${
                darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="inline-block transition-transform duration-300 group-hover:scale-105">
                {link.label}
              </span>
              <span
                className={`absolute left-0 -bottom-1 h-[2px] w-0 transition-all duration-300 group-hover:w-full rounded-full ${
                  darkMode ? "bg-gradient-to-r from-violet-400 to-purple-400" : "bg-gradient-to-r from-violet-500 to-purple-500"
                }`}
              />
            </motion.a>
          ))}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-4">
          <ThemeToggle />

          <Link
            to="/login"
            className={`hidden md:block text-sm font-medium transition-colors ${
              darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Log in
          </Link>

          <GlowButton href="/signup" size="sm">
            Sign Up
          </GlowButton>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden px-6 py-4 space-y-3 border-t ${
              darkMode ? "border-slate-800 bg-slate-900/80 backdrop-blur-xl" : "border-gray-200 bg-white/80 backdrop-blur-xl"
            }`}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={i}
                href={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block text-sm font-medium py-2 hover:text-violet-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
            <div className="pt-2 flex gap-3">
              <Link
                to="/login"
                className="flex-1 text-center px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
