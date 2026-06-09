import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "@/components/CommandPalette";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
      <Header onToggleSidebar={() => setIsSidebarOpen((p) => !p)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

export default DashboardLayout;
