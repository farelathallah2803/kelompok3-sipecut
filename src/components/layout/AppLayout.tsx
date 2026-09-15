'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { PanelLeft } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('juknis_sidebar_visible');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('juknis_sidebar_visible', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans antialiased relative">
      {/* Floating Button to Re-open Sidebar when hidden */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="hidden md:flex fixed top-4 left-4 z-50 items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl shadow-md transition text-xs font-semibold hover:border-slate-400 animate-in fade-in duration-150"
          title="Tampilkan Menu Samping"
        >
          <PanelLeft className="w-4 h-4 text-blue-600" />
          <span>Tampilkan Menu</span>
        </button>
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200 ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
      }`}>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <img src="/prisma-icon.png" alt="PRISMA" className="w-4 h-4 object-contain" />
              <span className="font-semibold text-slate-700">PRISMA Bank Indonesia</span> &copy; 2026. Platform Regulasi, Integrasi, Search, Monitoring &amp; Administration.
            </div>
            <div className="text-slate-400">
              Sistem Kepatuhan &amp; Penyelarasan Ketentuan Internal
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
