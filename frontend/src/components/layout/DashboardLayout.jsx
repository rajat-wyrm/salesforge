import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "@/components/CommandPalette";
import AnimatedBackground from "@/components/AnimatedBackground";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
      <AnimatedBackground />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

export default DashboardLayout;
