import React from "react";
import { LogOut, UserCircle, ChevronRight, Home } from "lucide-react";
import type { StudentModel } from "../../studentModel/types";

interface Props {
  student: StudentModel;
  breadcrumbs: string[];
  onLogout: () => void;
}

export function AppHeader({ student, breadcrumbs, onLogout }: Props) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20 relative box-border">
      
      {/* ESQUERRA: Logo + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            C
          </div>
          <span className="font-bold tracking-tight hidden md:block">COMPÀS</span>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        <nav className="flex items-center text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Home size={14} />
          </div>
          
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={14} className="mx-1 text-gray-300" />
              <span className={`font-medium whitespace-nowrap ${index === breadcrumbs.length - 1 ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md' : 'hover:text-gray-700'}`}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* DRETA: Perfil */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-700">{student.profile.name}</div>
          <div className="text-xs text-gray-400">Estudiant</div>
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200 shrink-0">
           <UserCircle size={24} />
        </div>
        <button 
          onClick={onLogout} 
          className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}