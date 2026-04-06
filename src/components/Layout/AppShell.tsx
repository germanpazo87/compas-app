import React from "react";
import { AppHeader } from "./AppHeader"; // Assegura't que la ruta és correcta
import type { StudentModel } from "../../studentModel/types";

interface Props {
  student: StudentModel;
  breadcrumbs: string[];
  onLogout: () => void;
  sidebar: React.ReactNode; 
  children: React.ReactNode;
}

export function AppShell({ student, breadcrumbs, onLogout, sidebar, children }: Props) {
  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden fixed inset-0">
      
      {/* 1. HEADER */}
      <div className="shrink-0">
        <AppHeader 
          student={student} 
          breadcrumbs={breadcrumbs} 
          onLogout={onLogout} 
        />
      </div>

      {/* 2. COS PRINCIPAL (Flex Row indispensable) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 2A. CENTRE (Exercici) */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/50 relative w-full">
           <div className="max-w-5xl mx-auto p-6 pb-32">
              {children}
           </div>
        </main>

        {/* 2B. SIDEBAR DRET (Tutor IA) */}
        <aside className="w-[400px] bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col h-full shrink-0">
          {sidebar}
        </aside>

      </div>
    </div>
  );
}