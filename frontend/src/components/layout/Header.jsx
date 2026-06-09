import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Settings, Plus } from "lucide-react";
import ThemeToggle from "@/context/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const [shortcut, setShortcut] = useState(false);

  useEffect(() => {
    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    setShortcut(isMac);
  }, []);

  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-black/20 md:px-8">

        <img
          src="/UptoSkillsLogo.webp"
          alt="UptoSkills Logo"
          className="h-11 w-auto object-contain"
        />


      <div className="flex items-center gap-2">
        {isMember && (
          <button
            type="button"
            onClick={() => navigate("/leads")}
            className="inline-flex items-center gap-1 rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New lead</span>
          </button>
        )}
        <ThemeToggle />
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        <NotificationBell />
        <div className="hidden items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
            {userInitial}
          </div>
          <div className="pr-2 text-left">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || "You"}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
