import { motion } from "framer-motion";
import { FaArrowRight, FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { dashboardImg } from "./landingAssets";
import AntigravityParticles from "@/components/AntigravityParticles";
import GlowButton from "@/components/GlowButton";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" },
  }),
};

function Hero() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <section
      className={`relative min-h-screen flex items-center overflow-hidden pt-20 ${
        darkMode
          ? "bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-950"
          : "bg-gradient-to-br from-white via-violet-50/30 to-white"
      }`}
    >
      <AntigravityParticles count={60} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 ${
            darkMode ? "bg-violet-600" : "bg-violet-300"
          }`}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "5%", right: "5%" }}
        />
        <motion.div
          className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-15 ${
            darkMode ? "bg-purple-600" : "bg-purple-300"
          }`}
          animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "5%", left: "5%" }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="group relative">
              <div
                className={`absolute -inset-2 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${
                  darkMode
                    ? "bg-gradient-to-r from-violet-500/30 to-purple-600/30"
                    : "bg-gradient-to-r from-violet-300/40 to-purple-300/40"
                }`}
              />
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={dashboardImg}
                  alt="Dashboard"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                Powered by Real-time Data
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                Unlock Your Best
              </span>
              <br />
              <span>Leads in Seconds</span>
            </motion.h1>

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

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="flex flex-col sm:flex-row gap-4"
            >
              <GlowButton
                href="/signup"
                size="lg"
                className="gap-2"
              >
                Get Started Free
                <FaArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </GlowButton>

              <GlowButton
                variant="secondary"
                size="lg"
                href="/login"
                className="gap-2"
              >
                <FaPlay size={14} />
                Watch Demo
              </GlowButton>
            </motion.div>

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
                { label: "AI-Powered", icon: "🤖" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
