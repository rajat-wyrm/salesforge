import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Settings, Plus } from "lucide-react";
import ThemeToggle from "@/context/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Header = () => {
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const [shortcut, setShortcut] = useState(false);

  useEffect(() => {
    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    setShortcut(isMac);
  }, []);

  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-gray-800/50 dark:bg-gray-900/80 dark:shadow-black/10 md:px-8">
      <motion.img
        whileHover={{ scale: 1.03 }}
        src="/UptoSkillsLogo.webp"
        alt="UptoSkills Logo"
        className="h-11 w-auto object-contain"
      />

      <div className="flex items-center gap-3">
        {isMember && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/leads")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:shadow-teal-500/40"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New lead</span>
          </motion.button>
        )}

        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search... ${shortcut ? "⌘K" : "Ctrl+K"}`}
              className="w-48 lg:w-64 rounded-xl border border-gray-200 bg-white/50 px-9 py-2 text-sm text-gray-900 placeholder:text-gray-400 backdrop-blur-sm transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
            />
          </div>
        </div>

        <ThemeToggle />

        <motion.button
          type="button"
          whileHover={{ scale: 1.05, rotate: 45 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/settings")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/80 bg-white/50 text-gray-600 shadow-sm backdrop-blur-sm transition hover:bg-gray-100 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </motion.button>

        <NotificationBell />

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="hidden items-center gap-3 rounded-full border border-gray-200/80 bg-white/50 px-2 py-1.5 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/50 sm:flex"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white shadow-sm">
            {userInitial}
          </div>
          <div className="pr-2 text-left">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || "You"}</p>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
