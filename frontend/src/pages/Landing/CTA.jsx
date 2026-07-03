import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import GlowButton from "@/components/GlowButton";
import { FaArrowRight, FaRocket } from "react-icons/fa";

function CTA() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <section className="relative py-24 overflow-hidden">
      <div className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" : "bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50"}`} />
      <motion.div
        className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-30 ${darkMode ? "bg-violet-600/20" : "bg-violet-300/30"}`}
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{ top: "20%", left: "10%" }}
      />
      <motion.div
        className={`absolute w-[200px] h-[200px] rounded-full blur-[80px] opacity-20 ${darkMode ? "bg-purple-600/20" : "bg-purple-300/30"}`}
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{ bottom: "20%", right: "15%" }}
      />

      <div className="max-w-4xl mx-auto px-6 md:px-10 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50"
        >
          <FaRocket className="text-violet-500" size={14} />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Start your journey today
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Ready to Transform Your{" "}
          <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            Lead Generation
          </span>
          ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-lg mb-10 max-w-2xl mx-auto ${
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
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <GlowButton href="/signup" size="lg" className="gap-2">
            Start for Free
            <FaArrowRight size={16} />
          </GlowButton>
          <GlowButton variant="secondary" size="lg" href="/login">
            Schedule Demo
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
