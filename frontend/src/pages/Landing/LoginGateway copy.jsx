import { Shield, TrendingUp, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { ThemeToggle } from "../../context/ThemeToggle";
import AnimatedBackground from "@/components/AnimatedBackground";

const LoginGateway = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500 relative ${darkMode ? "bg-slate-950 text-gray-100" : "bg-white text-gray-900"}`}>
      <AnimatedBackground />

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="text-center max-w-2xl mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-4"
        >
          <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl shadow-lg shadow-teal-500/30">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/">
            <img src="/UptoSkillsLogo.webp" alt="UptoSkill Logo" className="h-16 w-auto my-4 mx-auto" />
          </Link>
          <p className={`text-lg font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Lead Generation & CRM Platform
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => navigate("/login")}
          className={`p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border group relative overflow-hidden ${
            darkMode ? "bg-slate-900/50 border-slate-700/50 hover:border-violet-500/30" : "bg-white/80 border-gray-200/50 hover:border-violet-300"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${
              darkMode ? "bg-violet-950/50 group-hover:bg-violet-900/50 text-violet-400" : "bg-violet-50 group-hover:bg-violet-100 text-violet-600"
            }`}>
              <User className="w-8 h-8" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
              User Portal
            </h2>
            <p className={`mb-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Access your personal dashboard and tools.
            </p>
            <div className="font-medium flex items-center gap-2 text-violet-500 group-hover:gap-3 transition-all">
              Login as User
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => navigate("/admin-login")}
          className={`p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border group relative overflow-hidden ${
            darkMode ? "bg-slate-900/50 border-slate-700/50 hover:border-violet-500/30" : "bg-white/80 border-gray-200/50 hover:border-violet-300"
          }`}
        >
          <div className={`absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg ${
            darkMode ? "bg-violet-600 text-white" : "bg-slate-900 text-white"
          }`}>
            MANAGEMENT
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${
              darkMode ? "bg-slate-800/50 group-hover:bg-slate-700/50 text-slate-400" : "bg-slate-100 group-hover:bg-slate-200 text-slate-800"
            }`}>
              <Shield className="w-8 h-8" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
              Admin Console
            </h2>
            <p className={`mb-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Manage users and settings.
            </p>
            <div className="font-medium flex items-center gap-2 text-violet-500 group-hover:gap-3 transition-all">
              Login as Admin
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 relative z-10"
      >
        <Link
          to="/"
          className={`font-medium transition-colors inline-flex items-center gap-1 group ${
            darkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default LoginGateway;
