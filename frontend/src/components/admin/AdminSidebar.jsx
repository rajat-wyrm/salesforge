import {
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "System Overview", icon: LayoutDashboard, to: "/admin/dashboard" },
    { name: "User Management", icon: Users, to: "/admin/users" },
    { name: "Server Health", icon: Server, to: "/admin/server-health" },
    { name: "Audit Logs", icon: FileText, to: "/admin/audit-logs" },
    { name: "Global Settings", icon: Settings, to: "/admin/settings" },
  ];

  const adminName = user?.name || "Administrator";
  const userEmail = user?.email || "";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        className={`md:hidden fixed top-4 z-20 p-2 bg-slate-900 text-white rounded-md transition-all duration-300 shadow-md ${
          isSidebarOpen ? "left-[200px]" : "left-4"
        }`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed md:static inset-y-0 left-0 z-10 flex flex-col bg-white text-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-0 md:w-20 md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-200">
          <div
            className={`transition-all duration-300 overflow-hidden ${
              isSidebarOpen ? "opacity-100 w-32" : "opacity-0 w-0"
            } ${!isSidebarOpen && "hidden"}`}
          >
            <img
              src="/image 2.jpg"
              alt="Logo"
              className="w-full h-auto object-contain"
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-1 rounded-full text-slate-400 hover:bg-slate-100"
          >
            {isSidebarOpen ? (
              <ChevronsLeft size={20} />
            ) : (
              <ChevronsRight size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 mt-4 border-b border-slate-200 mx-2">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-900/20 shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div
            className={`transition-opacity duration-300 overflow-hidden ${
              isSidebarOpen ? "opacity-100" : "opacity-0"
            } ${!isSidebarOpen && "hidden"}`}
          >
            <span className="block font-semibold text-sm text-slate-900 truncate w-40">
              {adminName}
            </span>
            <span
              className="block text-xs text-slate-500 truncate w-40"
              title={userEmail}
            >
              {userEmail}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                } ${isSidebarOpen ? "justify-start" : "justify-center"}`
              }
            >
              <item.icon
                size={20}
                className={`shrink-0 ${isSidebarOpen ? "mr-3" : "mr-0"}`}
              />
              <span
                className={`transition-opacity duration-300 whitespace-nowrap ${
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                } ${!isSidebarOpen && "hidden"}`}
              >
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ${
              isSidebarOpen ? "justify-start" : "justify-center"
            }`}
          >
            <LogOut
              size={20}
              className={`shrink-0 ${
                isSidebarOpen ? "mr-3" : "hidden md:block"
              }`}
            />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0"
              } ${!isSidebarOpen && "hidden"}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default AdminSidebar;
