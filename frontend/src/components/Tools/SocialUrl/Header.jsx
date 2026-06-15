import React from "react";
import { Bell, Settings, Menu } from "lucide-react";

const Header = ({ onSettingsClick, onMenuClick }) => (
  <div className="h-16 bg-white flex items-center px-4 md:px-8 border-b border-gray-50/50 sticky top-0 z-30">
    <button
      onClick={onMenuClick}
      className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Menu size={24} />
    </button>

    
    <div className="flex-1"></div>

   
    <div className="flex items-center gap-2 md:gap-4 text-gray-600">
      <button
        className="p-2 hover:bg-gray-50 rounded-full relative transition-colors"
        onClick={() => alert("No new notifications")}
      >
        <Bell size={20} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>
      <button
        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        onClick={onSettingsClick}
      >
        <Settings size={20} />
      </button>
    </div>
  </div>
);

export default Header;
