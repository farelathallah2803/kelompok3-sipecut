'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  ArrowRight, 
  X, 
  FileText, 
  BookOpen, 
  CheckCircle2,
  ShieldCheck,
  Building
} from 'lucide-react';
import { SATUAN_KERJA_LIST, SatuanKerja, SatkerSector } from '@/data/satkerData';

export default function SatkerDirectoryPage() {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalSatker, setActiveModalSatker] = useState<SatuanKerja | null>(null);

  const sectors: SatkerSector[] = [
    'Moneter',
    'Makroprudensial',
    'Sistem Pembayaran',
    'Pendukung Kebijakan',
    'Pendukung Organisasi',
    'Jaringan Kantor'
  ];

  const filteredSatker = SATUAN_KERJA_LIST.filter(satker => {
    const matchesSector = selectedSector === 'all' || satker.sector === selectedSector;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      satker.code.toLowerCase().includes(q) ||
      satker.no.toLowerCase().includes(q) ||
      satker.name.toLowerCase().includes(q) ||
      satker.description.toLowerCase().includes(q) ||
      satker.sector.toLowerCase().includes(q);
    return matchesSector && matchesSearch;
  });

  const getSectorBadgeStyle = (sector: SatkerSector) => {
    switch (sector) {
      case 'Moneter':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Makroprudensial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sistem Pembayaran':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pendukung Kebijakan':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Pendukung Organisasi':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Jaringan Kantor':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTopBorderColor = (sector: SatkerSector) => {
    switch (sector) {
      case 'Moneter':
        return 'border-t-blue-600';
      case 'Makroprudensial':
        return 'border-t-emerald-500';
      case 'Sistem Pembayaran':
        return 'border-t-purple-600';
      case 'Pendukung Kebijakan':
        return 'border-t-amber-500';
      case 'Pendukung Organisasi':
        return 'border-t-indigo-600';
      case 'Jaringan Kantor':
        return 'border-t-rose-600';
      default:
        return 'border-t-slate-500';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Direktori Satuan Kerja Bank Indonesia
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar 33 Satker pemrakarsa dan penelaah Petunjuk Teknis di lingkungan Bank Indonesia.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            href="/draft/new"
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Draft Juknis</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
        {/* Sector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap transition ${
              selectedSector === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({SATUAN_KERJA_LIST.length})
          </button>
          {sectors.map(sec => {
            const count = SATUAN_KERJA_LIST.filter(s => s.sector === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedSector === sec
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rubrik (DKSP, DKEM, DHK...), nama departemen, atau tugas pokok..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Satuan Kerja Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSatker.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80">
            <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            Tidak ada satuan kerja yang sesuai dengan kata kunci pencarian.
          </div>
        ) : (
          filteredSatker.map((satker) => {
            const topBorder = getTopBorderColor(satker.sector);
            const badgeStyle = getSectorBadgeStyle(satker.sector);

            return (
              <div
                key={satker.code}
                className={`bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden border-t-4 ${topBorder} hover:shadow-md transition-shadow group`}
              >
                {/* Card Top */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-black text-[#003366] tracking-tight group-hover:text-blue-600 transition">
                        {satker.code}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {satker.no}
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                      {satker.sector.toUpperCase()}
                    </span>
                  </div>

                  <div className="h-0.5 w-12 bg-blue-500/80 rounded-full" />

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {satker.name}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {satker.description}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Detail Button */}
                <div className="p-4 pt-0">
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveModalSatker(satker)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition inline-flex items-center space-x-1"
                    >
                      <span>DETAIL</span>
                      <span>&rarr;</span>
                    </button>

                    <Link
                      href={`/draft/new?satker=${satker.code}`}
                      className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      title="Buat Draft Juknis baru atas nama satuan kerja ini"
                    >
                      + Draft Juknis
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Satker */}
      {activeModalSatker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black text-[#003366]">
                    {activeModalSatker.code}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({activeModalSatker.no})
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSectorBadgeStyle(activeModalSatker.sector)}`}>
                    {activeModalSatker.sector}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {activeModalSatker.name}
                </h2>
              </div>

              <button
                onClick={() => setActiveModalSatker(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tugas Pokok &amp; Wewenang Satuan Kerja
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {activeModalSatker.description}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Peran dalam Tata Kelola Petunjuk Teknis (Juknis)
                </label>
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950 leading-relaxed space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Satuan Kerja Pemrakarsa / Pelaksana Resmi</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Berwenang menyusun berkas rancangan Petunjuk Teknis (Juknis) format baku (Templat 1, 2, atau 3) dengan kode rubrik <strong className="font-mono">{activeModalSatker.code}</strong>, mengajukan telaah terpadu (DHk, DMR, DAI), hingga tahap penetapan ADG Pembina dan publikasi resmi.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                href={`/regulations?q=${encodeURIComponent(activeModalSatker.code)}`}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-blue-700 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lihat Regulasi Acuan Terkait</span>
              </Link>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModalSatker(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Tutup
                </button>
                <Link
                  href={`/draft/new?satker=${activeModalSatker.code}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Buat Draft Juknis</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
