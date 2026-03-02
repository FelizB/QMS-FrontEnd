import { Menu } from "lucide-react";
import React from "react";
interface HeaderProps {
  onToggleSidebar: () => void;
}
export function ToggleButton({onToggleSidebar}: HeaderProps){
    return(
         <button className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
          onClick={onToggleSidebar}>
            <Menu className="w-5 h-5" />
          </button>
    )
}