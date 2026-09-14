'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Scale, 
  FileText, 
  PlusCircle, 
  BookOpen, 
  UserCheck, 
  ChevronDown, 
  ExternalLink,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { UserRole } from '@/types';
import { getActiveRole, setActiveRole, resetToMockData } from '@/lib/storage';
import SmartSearchModal from '@/components/search/SmartSearchModal';

export const ALLOWED_ROLES: UserRole[] = [
  'drafter',
  'pimpinan_satker',
  'dhuk_legal',
  'dmr_reviewer',
  'dai_auditor'
];

export const ROLE_DEFINITIONS: Record<UserRole, { label: string; badge: string; color: string; desc: string }> = {
  drafter: {
    label: 'Satker Pemrakarsa',
    badge: 'Satker Pemrakarsa',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Penyusunan naskah petunjuk teknis/perubahan awal'
  },
  pimpinan_satker: {
    label: 'Pimpinan Satker',
    badge: 'Pimpinan Satker',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Persetujuan naskah sebelum diajukan ke telaah terpadu'
  },
  dhuk_legal: {
    label: 'Legal DHk',
    badge: 'Legal DHk',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Reviu aspek hukum, hierarki peraturan, dan publikasi'
  },
  dmr_reviewer: {
    label: 'DMR',
    badge: 'DMR',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Analisis profil risiko operasional dan rencana mitigasi'
  },
  dai_auditor: {
    label: 'DAI',
    badge: 'DAI',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Evaluasi sistem pengendalian intern dan kelayakan audit'
  },
  // Fallbacks for existing review items
  kemenkum_kemenkeu: {
    label: 'Kemenkum & Kemenkeu',
    badge: 'Kemenkum & Kemenkeu',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Harmonisasi kementerian'
  },
  dmst_governance: {
    label: 'DMST',
    badge: 'DMST',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Evaluasi tata kelola'
  },
  sekretariat_rdg: {
    label: 'Sekretariat RDG',
    badge: 'RDG',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Rapat Dewan Gubernur'
  },
  adg_pembina: {
    label: 'ADG Pembina',
    badge: 'ADG Pembina',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Persetujuan ADG Pembina'
  },
  gubernur_bi: {
    label: 'Gubernur BI',
    badge: 'Gubernur BI',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Penetapan resmi'
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRoleState] = useState<UserRole>('drafter');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setRoleState(getActiveRole());
    const handleRoleChange = () => setRoleState(getActiveRole());
    window.addEventListener('juknis_role_changed', handleRoleChange);
    return () => window.removeEventListener('juknis_role_changed', handleRoleChange);
  }, []);

  // Global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setRoleState(newRole);
    setDropdownOpen(false);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data alur ke data sampel resmi?')) {
      resetToMockData();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white shadow-xs">
                <Scale className="w-4.5 h-4.5 text-amber-300" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-700 transition">
                  SI-JUKNIS
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  Bank Indonesia
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                pathname === '/' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Monitoring</span>
            </Link>

            <Link
              href="/draft/new"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                pathname === '/draft/new' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Draft Baru</span>
            </Link>

            <Link
              href="/search"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                pathname === '/search' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Pencarian</span>
            </Link>

            <Link
              href="/regulations"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                pathname === '/regulations' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Repositori</span>
            </Link>
          </nav>

          {/* Right Side: Quick Search & Role Switcher */}
          <div className="flex items-center space-x-2">
            {/* Quick Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 transition"
              title="Cari aturan (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-500">Cari aturan...</span>
              <kbd className="hidden sm:inline font-mono bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded text-slate-400">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={handleResetData}
              title="Reset data demo ke alur standar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-left transition"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-800">
                    {ROLE_DEFINITIONS[role]?.label || 'Satker Pemrakarsa'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">
                      Pilih Peran Pengguna
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Simulasikan approval tata kelola dari unit terkait
                    </p>
                  </div>

                  <div className="py-1">
                    {ALLOWED_ROLES.map((r) => {
                      const def = ROLE_DEFINITIONS[r];
                      const isSelected = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => handleSelectRole(r)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-50 last:border-b-0 ${
                            isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          <div className="pr-2">
                            <div className="font-bold text-slate-900">{def.label}</div>
                            <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{def.desc}</div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Smart Search GenAI Modal */}
      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
