import { Bell } from "lucide-react";
import React from "react";

const AdminHeader = () => (
  <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm z-10">
    <h2 className="text-xl font-bold text-slate-800">System Overview</h2>
    <div className="flex items-center space-x-4">
      <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>Systems Operational</span>
      </div>
      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
        <Bell size={20} />
      </button>
    </div>
  </header>
);
export default AdminHeader;
