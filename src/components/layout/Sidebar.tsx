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
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Menu,
  X,
  PanelLeftClose,
  Building2
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
    desc: 'Penyusunan naskah petunjuk teknis / perubahan awal'
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

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRoleState] = useState<UserRole>('drafter');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setRoleState(getActiveRole());
    const handleRoleChange = () => setRoleState(getActiveRole());
    window.addEventListener('juknis_role_changed', handleRoleChange);
    return () => window.removeEventListener('juknis_role_changed', handleRoleChange);
  }, []);

  // Global shortcut Ctrl+K
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

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  const navLinks = [
    {
      group: 'Workflow & Monitoring',
      items: [
        {
          name: 'Monitoring Alur',
          href: '/',
          icon: FileText,
          badge: null
        },
        {
          name: 'Draft Juknis Baru',
          href: '/draft/new',
          icon: PlusCircle,
          badge: 'Form'
        }
      ]
    },
    {
      group: 'Kepatuhan & Regulasi',
      items: [
        {
          name: 'Pencarian Cerdas AI',
          href: '/search',
          icon: Sparkles,
          badge: 'AI'
        },
        {
          name: 'Katalog Regulasi',
          href: '/regulations',
          icon: BookOpen,
          badge: '1.550+'
        },
        {
          name: 'Satuan Kerja BI',
          href: '/satker',
          icon: Building2,
          badge: '33 Satker'
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header with Hide Button */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#003366] flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition">
              <Scale className="w-4.5 h-4.5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 group-hover:text-blue-700 transition">
                  SI-JUKNIS
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  BI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate font-medium">
                Bank Indonesia Compliance
              </p>
            </div>
          </Link>

          {/* Hide Sidebar Button for Desktop */}
          {onToggle && (
            <button
              onClick={onToggle}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Sembunyikan Menu Samping"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="mt-3.5 w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-600 transition shadow-2xs group"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            <span className="text-slate-500">Cari regulasi / pasal...</span>
          </div>
          <kbd className="font-mono bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navLinks.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.group}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Role Switcher Section */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Akun
            </span>
            <button
              onClick={handleResetData}
              title="Reset data demo ke alur standar"
              className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-xl text-left transition shadow-2xs"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {ROLE_DEFINITIONS[role]?.label || 'Satker Pemrakarsa'}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-80 overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">
                  Simulasi Peran Pengguna
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Uji alur persetujuan dari perspektif unit kerja
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-50 last:border-b-0 ${
                        isSelected ? 'bg-blue-50/70 text-blue-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="pr-2 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{def.label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{def.desc}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className={`hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-200 bg-white shadow-2xs transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white shadow-xs">
            <Scale className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              SI-JUKNIS
            </span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              BI
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            title="Cari"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition border border-slate-200"
            title="Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Global Smart Search Modal */}
      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
