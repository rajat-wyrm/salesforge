import {
  ChevronLeft,
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

const getNameFromEmail = (email) => {
  if (!email) return "Administrator";

  const namePart = email.split("@")[0];
  const cleaned = namePart.replace(/[^a-zA-Z]/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const AdminSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout,
  userEmail,
}) => {
  const navItems = [
    { name: "System Overview", icon: LayoutDashboard, active: true },
    { name: "User Management", icon: Users, active: false },
    { name: "Server Health", icon: Server, active: false },
    { name: "Audit Logs", icon: FileText, active: false },
    { name: "Global Settings", icon: Settings, active: false },
  ];

  // Use email to get name, or fallback to Administrator
  const adminName = userEmail ? getNameFromEmail(userEmail) : "Administrator";

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
        className={`fixed md:static inset-y-0 left-0 z-10 flex flex-col bg-white text-white border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-0 md:w-20 md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
          <div
            className={`transition-all duration-300 overflow-hidden ${
              isSidebarOpen ? "opacity-100 w-32" : "opacity-0 w-0"
            } ${!isSidebarOpen && "hidden"}`}
          >
            <img
              src="/image 2.jpg"
              alt="Logo"
              className="w-full h-auto object-contain bg-slate-900"
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-1 rounded-full text-slate-400 hover:bg-slate-800"
          >
            {isSidebarOpen ? (
              <ChevronsLeft size={20} />
            ) : (
              <ChevronsRight size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 mt-4 border-b border-slate-800 mx-2">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-teal-900/50">
            {adminName.charAt(0)}
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
              className="block text-xs text-slate-900 truncate w-40"
              title={userEmail}
            >
              {userEmail}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                item.active
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              } ${isSidebarOpen ? "justify-start" : "justify-center"}`}
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
            </a>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-900 ${
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
