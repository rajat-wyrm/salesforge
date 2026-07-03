import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext";
import GlowButton from "@/components/GlowButton";

export default function ModalManager() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { selectedModal, setSelectedModal } = useModal();

  return (
    <AnimatePresence>
      {selectedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedModal(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl p-8 relative overflow-hidden ${
              darkMode
                ? "bg-slate-900 border border-slate-700/50"
                : "bg-white border border-gray-200"
            } shadow-2xl`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600`} />

            <button
              onClick={() => setSelectedModal(null)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-all hover:rotate-90 ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              <FaTimes size={20} />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 mt-2">
              {selectedModal.icon && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl text-white text-2xl bg-gradient-to-r ${selectedModal.color} shadow-lg`}
                >
                  {selectedModal.icon}
                </motion.div>
              )}
              <div className="flex-1">
                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {selectedModal.title}
                </h3>
                <p className={`leading-relaxed mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {selectedModal.details}
                </p>
                <GlowButton
                  href="/signup"
                  onClick={() => setSelectedModal(null)}
                >
                  Get Started
                </GlowButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
