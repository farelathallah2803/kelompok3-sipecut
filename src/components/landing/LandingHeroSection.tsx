'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Search, 
  FileText, 
  Building, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Stamp, 
  Gavel, 
  Landmark, 
  Sun, 
  Lock, 
  Scale, 
  FileCheck, 
  Activity, 
  Layers, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  BarChart3,
  Award
} from 'lucide-react';
import { UserRole } from '@/types';
import { SATUAN_KERJA_LIST } from '@/data/satkerData';

interface LandingHeroSectionProps {
  activeRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  totalDraftsCount: number;
  inReviewCount: number;
  approvedCount: number;
}

export default function LandingHeroSection({
  activeRole,
  onRoleChange,
  totalDraftsCount,
  inReviewCount,
  approvedCount
}: LandingHeroSectionProps) {
  const router = useRouter();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'drafter': return 'Drafter Unit Kerja';
      case 'pimpinan_satker': return 'Pimpinan Satker Pemrakarsa';
      case 'dhuk_legal': return 'Legal Reviewer DHk';
      case 'dmr_reviewer': return 'Reviewer Risiko DMR';
      case 'dai_auditor': return 'Auditor Intern DAI';
      case 'dmst_governance': return 'Evaluator DMST';
      case 'sekretariat_rdg': return 'Sekretariat RDG';
      case 'adg_pembina': return 'ADG Pembina Sektor';
      case 'gubernur_bi': return 'Gubernur BI';
      default: return r;
    }
  };

  return (
    <div className="w-full bg-[#041226] text-white rounded-2xl shadow-2xl overflow-hidden mb-8 font-sans border border-blue-900/40">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="bg-white text-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <img 
              src="/irama-logo.png" 
              alt="Bank Indonesia" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <div className="hidden sm:block border-l border-slate-300 pl-3">
              <span className="text-xs font-bold text-[#002B5C] block leading-tight tracking-wide">
                BANK INDONESIA
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight font-medium">
                BANK SENTRAL REPUBLIK INDONESIA
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 ml-6 text-xs font-semibold">
            <Link 
              href="/" 
              className="px-3.5 py-1.5 rounded-full bg-[#EAF2FC] text-[#002B5C] font-bold border border-blue-200 shadow-2xs"
            >
              Beranda
            </Link>
            <Link 
              href="/regulations" 
              className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-[#002B5C] hover:bg-slate-100 transition"
            >
              Repositori Regulasi
            </Link>
            <Link 
              href="/draft/new" 
              className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-[#002B5C] hover:bg-slate-100 transition"
            >
              Permohonan Juknis
            </Link>
            <Link 
              href="/search" 
              className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-[#002B5C] hover:bg-slate-100 transition"
            >
              Matriks Harmonisasi
            </Link>
          </nav>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Mode Tampilan BI"
          >
            <Sun className="w-4 h-4 text-amber-500" />
          </button>

          {/* Login / Role Switch Button */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#D99E30] to-[#B88220] hover:from-[#C58E28] hover:to-[#A4731B] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{getRoleLabel(activeRole)}</span>
            </button>

            {showRoleSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Pilih Peran Akun Simulasi BI:
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {[
                    { role: 'drafter', label: 'Drafter Satker Pemrakarsa' },
                    { role: 'pimpinan_satker', label: 'Pimpinan Satker Pemrakarsa' },
                    { role: 'dhuk_legal', label: 'Legal Reviewer DHk' },
                    { role: 'dmr_reviewer', label: 'Reviewer Risiko DMR' },
                    { role: 'dai_auditor', label: 'Auditor Intern DAI' },
                    { role: 'dmst_governance', label: 'Evaluator Tata Kelola DMST' },
                    { role: 'sekretariat_rdg', label: 'Sekretariat RDG' },
                    { role: 'adg_pembina', label: 'ADG Pembina Sektor' },
                    { role: 'gubernur_bi', label: 'Gubernur Bank Indonesia' }
                  ].map(item => (
                    <button
                      key={item.role}
                      onClick={() => {
                        if (onRoleChange) onRoleChange(item.role as UserRole);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        activeRole === item.role 
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeRole === item.role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* 2. HERO BANNER SECTION (NAVY BLUE GRADIENT WITH BI WATERMARK) */}
      <section className="relative px-6 sm:px-12 py-12 sm:py-16 bg-gradient-to-br from-[#061D3D] via-[#0A2D5C] to-[#03152C] overflow-hidden">
        {/* Bank Indonesia HQ Building Watermark Vector Pattern */}
        <div className="absolute right-0 bottom-0 top-0 w-full md:w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-4">
          <svg className="h-full w-auto max-w-none" viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 450H550V430H50V450ZM100 430H500V250H100V430ZM150 250H450V200H150V250ZM200 200H400V150H200V200ZM280 150H320V80H280V150Z" fill="white" />
            <circle cx="300" cy="110" r="25" stroke="white" strokeWidth="4" />
            <path d="M120 280H160V410H120V280ZM200 280H240V410H200V280ZM280 280H320V410H280V280ZM360 280H400V410H360V280ZM440 280H480V410H440V280Z" fill="white" opacity="0.5" />
          </svg>
        </div>

        {/* Ambient Decorative Glow Circles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Brand Badge Icon */}
          <div className="inline-flex items-center space-x-2.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1 shadow-xs">
              <img src="/irama-logo.png" alt="IRAMA" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-extrabold tracking-wider text-white uppercase">IRAMA BANK INDONESIA</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white tracking-tight">
            Platform <span className="text-[#F4C430] font-extrabold">permohonan penyusunan</span> dan <span className="text-[#F4C430] font-extrabold">Monitoring Harmonisasi</span> Petunjuk Teknis
          </h1>

          {/* Description Paragraph */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Ajukan penyusunan dan perubahan Petunjuk Teknis ke Departemen Hukum Bank Indonesia atau pantau proses reviu terpadu 3 Satker (DHk, DMR, DAI), evaluasi tata kelola DMST, pembahasan RDG, sampai publikasi JDIH berjalan dalam satu alur digital yang bisa Anda pantau sendiri.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/draft/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#D99E30] to-[#B88220] hover:from-[#E4A735] hover:to-[#C58B24] text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-amber-500/20 transition transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>Ajukan Draft Juknis Baru</span>
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#112E54]/90 hover:bg-[#183B6B] text-white rounded-xl font-bold text-xs border border-blue-400/30 backdrop-blur-xs transition transform hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4 text-blue-300" />
              <span>Lacak Status &amp; Matriks Harmonisasi</span>
            </Link>
          </div>

          {/* Bottom Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">16</div>
              <div className="text-[11px] text-slate-300 font-medium">Materi Resmi BI</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalDraftsCount || 24}</div>
              <div className="text-[11px] text-slate-300 font-medium">Harmonisasi Tahun Ini</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">1.139</div>
              <div className="text-[11px] text-slate-300 font-medium">Pasal Terbedah AI</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">+16.1</div>
              <div className="text-[11px] text-slate-300 font-medium">Rata-rata Skor Kepatuhan</div>
            </div>
          </div>
        </div>
      </section>


      {/* 3. LAYANAN UNTUK ANDA SECTION (DARK CARDS GRID) */}
      <section className="px-6 sm:px-12 py-10 bg-[#030C1A] border-t border-blue-900/30 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Layanan untuk Anda</h2>
          <p className="text-xs text-slate-400 mt-1">Layanan terstandar di setiap tahap tata kelola regulasi Bank Indonesia.</p>
        </div>

        {/* 5 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1 */}
          <Link href="/regulations" className="group bg-[#0A1A33] hover:bg-[#0E2347] border border-blue-800/40 hover:border-blue-500/60 p-5 rounded-2xl transition duration-200 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition">Repositori Regulasi</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Materi resmi Bank Indonesia yang diklasifikasikan berdasarkan jenis hirarki PBI, PADG, PADG Intern, dan Juknis.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center text-[10px] font-bold text-blue-400 group-hover:translate-x-1 transition">
              <span>Buka Repositori</span> &rarr;
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/draft/new" className="group bg-[#0A1A33] hover:bg-[#0E2347] border border-blue-800/40 hover:border-blue-500/60 p-5 rounded-2xl transition duration-200 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">Permohonan Draft Baru</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Satker Pemrakarsa dapat mengajukan permohonan rancangan Juknis dengan fitur bedah pasal otomatis Gemini AI.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center text-[10px] font-bold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Buat Permohonan</span> &rarr;
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/search" className="group bg-[#0A1A33] hover:bg-[#0E2347] border border-blue-800/40 hover:border-blue-500/60 p-5 rounded-2xl transition duration-200 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition">Reviu Teknis Bersama</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Penelaahan terpadu 3 Satker: Hukum (DHk), Risiko (DMR), dan Audit Intern (DAI) sebelum masuk evaluasi DMST.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center text-[10px] font-bold text-amber-400 group-hover:translate-x-1 transition">
              <span>Lihat Penelaahan</span> &rarr;
            </div>
          </Link>

          {/* Card 4 */}
          <a href="#monitoring-section" className="group bg-[#0A1A33] hover:bg-[#0E2347] border border-blue-800/40 hover:border-blue-500/60 p-5 rounded-2xl transition duration-200 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/20 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF] group-hover:scale-110 transition">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Lacak Status</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dapatkan kepastian informasi secara langsung. Cek dan pantau progres pengajuan melalui sistem pelacakan terintegrasi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center text-[10px] font-bold text-cyan-400 group-hover:translate-x-1 transition">
              <span>Pantau Status</span> &rarr;
            </div>
          </a>

          {/* Card 5 */}
          <Link href="/search" className="group bg-[#0A1A33] hover:bg-[#0E2347] border border-blue-800/40 hover:border-blue-500/60 p-5 rounded-2xl transition duration-200 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition">Matriks Harmonisasi</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ukur tingkat keselarasan naskah terhadap PADG Intern No. 66/2025, PBI, dan UU P2SK melalui mesin komparasi otomatis.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center text-[10px] font-bold text-purple-400 group-hover:translate-x-1 transition">
              <span>Uji Komparasi</span> &rarr;
            </div>
          </Link>

        </div>
      </section>


      {/* 4. ALUR LAYANAN PERMOHONAN SECTION (DARK STEPPER TIMELINE) */}
      <section className="px-6 sm:px-12 py-10 bg-[#020A17] border-t border-blue-900/40">
        <div className="bg-[#05142B] border border-blue-800/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-2 text-white font-bold text-sm sm:text-base">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Alur Layanan Permohonan &amp; Harmonisasi Regulasi</span>
          </div>

          {/* Horizontal Step Timeline Nodes */}
          <div className="relative pt-4 pb-2">
            {/* Background Connector Line */}
            <div className="hidden lg:block absolute top-10 left-12 right-12 h-0.5 bg-blue-900/70 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 group-hover:scale-110 transition">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    1
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ajukan Permohonan</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Satker Pemrakarsa menyusun draf &amp; mengunggah Lampiran X PADG Intern 66/2025
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 group-hover:scale-110 transition">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    2
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Reviu Teknis 3 Satker</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Berkas diperiksa terpadu oleh DHk (Hukum), DMR (Risiko), dan DAI (Audit) (3/3 Wajib)
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 group-hover:scale-110 transition">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    3
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Evaluasi DMST</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Evaluasi tata kelola &amp; keselarasan rencana strategis oleh Dept. Manajemen Strategis
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 group-hover:scale-110 transition">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    4
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Pembahasan RDG</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Pembahasan kebijakan dalam Rapat Dewan Gubernur (disahkan Sekretariat RDG)
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 group-hover:scale-110 transition">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    5
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Persetujuan ADG</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Persetujuan &amp; pengesahan oleh Anggota Dewan Gubernur Pembina Satker
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 group-hover:scale-110 transition">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#05142B]">
                    6
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Publikasi &amp; JDIH</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Penomoran naskah resmi &amp; publikasi repositori JDIH Bank Indonesia oleh DHk
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
