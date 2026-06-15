import React from 'react';
import {
  Search,
  Mail,
  Globe,
  Database,
  Link as LinkIcon,
  LogOut,
  X,
} from 'lucide-react';

const Sidebar = ({ activeItem, setActiveItem, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { name: 'All tools', icon: Search, bold: true },
    { name: 'Email Search', icon: Mail },
    { name: 'Domain Search', icon: Globe },
    { name: 'Database Search', icon: Database },
    { name: 'Social URL Search', icon: LinkIcon },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}
      >
        {/* Logo Area */}
        <div
          className="p-4 md:p-6 cursor-pointer flex justify-between items-center"
          onClick={() => setActiveItem('All tools')}
        >
          <div class="inline-flex items-baseline font-sans font-black tracking-tighter select-none text-2xl md:text-3xl">

            <div class="relative group mr-[0.05em]">

              <svg class="absolute -top-[0.55em] -left-[0.15em] w-[0.65em] h-[0.65em] z-10 transform -rotate-12 drop-shadow-sm group-hover:-translate-y-0.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1e293b" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M6 10V15C6 15 8 17 12 17C16 17 18 15 18 15V10" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M22 7V11" stroke="#F86E24" stroke-width="2" stroke-linecap="round" />
                <circle cx="22" cy="12" r="1.5" fill="#F86E24" />
              </svg>

              <span class="bg-linear-to-br from-[#FF8C42] to-[#F86E24] bg-clip-text text-transparent drop-shadow-sm">UPTO</span>
            </div>

            <div class="relative flex items-baseline">
              <span class="bg-linear-to-br from-[#2DD4BF] to-[#0ACeb1] bg-clip-text text-transparent drop-shadow-sm">S</span>
              <div class="relative mx-[0.02em]">
                <span class="bg-linear-to-br from-[#2DD4BF] to-[#0ACeb1] bg-clip-text text-transparent drop-shadow-sm">K</span>

                <svg class="absolute -top-[0.45em] -right-[0.35em] w-[0.75em] h-[0.75em] text-[#0ACeb1] drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17 L11 13 L15 17 L21 7" />
                  <path d="M17 7H21V11" />
                </svg>
              </div>

              <span class="bg-linear-to-br from-[#2DD4BF] to-[#0ACeb1] bg-clip-text text-transparent drop-shadow-sm">ILLS</span>
            </div>

          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveItem(item.name);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all duration-200 ${activeItem === item.name
                  ? 'bg-teal-50 text-teal-500 font-medium translate-x-1'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                } ${item.bold ? 'font-semibold text-gray-800' : ''}`}
            >
              <item.icon
                size={18}
                className={
                  activeItem === item.name ? 'text-teal-500' : 'text-gray-400'
                }
              />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 mt-auto border-t md:border-t-0 border-gray-100">
          <div className="bg-blue-50/50 rounded-xl p-3 flex items-center justify-between group hover:bg-blue-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-gray-800 truncate">
                  Eliza Chris
                </span>
                <span className="text-xs text-gray-500 truncate">
                  elizachris@gmail.com
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="text-xs font-medium text-gray-500 hover:text-red-500 bg-gray-200/50 hover:bg-red-50 px-2 py-1 rounded transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
