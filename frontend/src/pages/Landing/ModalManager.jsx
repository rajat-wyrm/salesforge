// src/components/ModalManager.jsx
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext"; // ✅ import hook

export default function ModalManager() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { selectedModal, setSelectedModal } = useModal(); // ✅ state from context

  return (
    <AnimatePresence>
      {selectedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedModal(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl p-8 relative ${
              darkMode
                ? "bg-slate-900 border border-slate-800"
                : "bg-white border border-gray-200"
            }`}
          >
            <button
              onClick={() => setSelectedModal(null)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              <FaTimes size={20} />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              {selectedModal.icon && (
                <div
                  className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl text-white text-2xl bg-gradient-to-r ${selectedModal.color}`}
                >
                  {selectedModal.icon}
                </div>
              )}
              <div className="flex-1">
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {selectedModal.title}
                </h3>
                <p
                  className={`leading-relaxed mb-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {selectedModal.details}
                </p>
                <Link
                  to="/login"
                  onClick={() => setSelectedModal(null)}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}