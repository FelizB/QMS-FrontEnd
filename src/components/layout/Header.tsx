import { Bell, ChevronDown, Filter, Menu, Plus, Search, Settings, Sun } from "lucide-react";
import React, { useRef, useState } from "react";
import ProfilePopover from "./ProfilePopover";

interface HeaderProps {
  onToggleSidebar: () => void;
}

function Header({onToggleSidebar}: HeaderProps) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* left section */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          onClick={onToggleSidebar}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <h1 className="text-2xl front-black text-slate-800 dark:text-white">
              Dashboard
            </h1>
            <p className=" front-black text-slate-800 dark:text-white">
              Welcome back, Alex! here's is what's happening today
              </p>
          </div>
        </div>
        {/* center section */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
            <input
              type="text"
              placeholder="Search Anything"
              className="w-full pl-10 pr-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Filter className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* right section */}
        <div className="flex items-center space-x-3">

          {/* Quick Action */}
          <button className="hidden lg:flex items-center space-x-2 py-2 px-4 bg-blue-500 text-white rounded-xl hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New</span>
          </button>

          {/* Toggle */}
          <button className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Sun className="w-5 h-5"/>
          </button>

          {/* Notification */}
          <button className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5"/>
            <span className="absolute -top-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button> 

           {/* User Profile */}
          <div className="relative">
          {/* trigger */}
            <button
              id="profile-menu-button"
              ref={btnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex items-center space-x-3 rounded-lg pl-3 pr-2 py-1 border-l border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:hover:bg-slate-800"
            >
                <img
                  src="https://i.pravatar.cc/300"
                  alt="User avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-blue-500"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Feliz B</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

          {/* popover */}
              
             <ProfilePopover open={open} onClose={() => setOpen(false)} anchorRef={btnRef.current} />
       
          
          </div>

           
        </div>
      </div>
    </div>
  );
}

export default Header;