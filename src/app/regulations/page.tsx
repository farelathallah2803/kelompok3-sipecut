'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Landmark,
  CreditCard,
  TrendingUp,
  Building2,
  Filter,
  FileText
} from 'lucide-react';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';

export default function RegulationsCatalogPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedRegId, setExpandedRegId] = useState<string | null>('reg-padg-intern-66-2025');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Stats
  const stats = useMemo(() => {
    return {
      total: MOCK_REGULATIONS.length,
      berlaku: MOCK_REGULATIONS.filter(r => r.status === 'Berlaku').length,
      moneter: MOCK_REGULATIONS.filter(r => r.sector === 'Moneter').length,
      sp: MOCK_REGULATIONS.filter(r => r.sector.includes('Sistem Pembayaran')).length,
      makro: MOCK_REGULATIONS.filter(r => r.sector === 'Makroprudensial').length,
    };
  }, []);

  // Filtered Regulations
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_REGULATIONS.filter(reg => {
      const matchesSearch = !q ||
        reg.number.toLowerCase().includes(q) ||
        reg.title.toLowerCase().includes(q) ||
        (reg.summary && reg.summary.toLowerCase().includes(q)) ||
        reg.sector.toLowerCase().includes(q) ||
        reg.articles.some(a => 
          a.content.toLowerCase().includes(q) || 
          a.articleNumber.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q)
        );

      const matchesType = selectedType === 'all' || reg.type === selectedType;

      const matchesSector = selectedSector === 'all' || 
        (selectedSector === 'Sistem Pembayaran & PUR' 
          ? (reg.sector.includes('Sistem Pembayaran') || reg.sector.includes('PUR'))
          : reg.sector === selectedSector);

      const matchesStatus = selectedStatus === 'all' ||
        (selectedStatus === 'Berlaku' ? reg.status === 'Berlaku' : reg.status !== 'Berlaku');

      return matchesSearch && matchesType && matchesSector && matchesStatus;
    });
  }, [search, selectedType, selectedSector, selectedStatus]);

  // Reset page on filter change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const paginatedList = filtered.slice((currentPageClamped - 1) * pageSize, currentPageClamped * pageSize);

  const toggleExpand = (id: string) => {
    setExpandedRegId(expandedRegId === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">
              Repositori Regulasi Bank Indonesia
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Sinkronisasi JDIH BI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog terintegrasi basis data JDIH BI mencakup sektor Moneter, Sistem Pembayaran, Makroprudensial, dan Ketentuan Tata Kelola Intern.
          </p>
        </div>
      </div>

      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Aturan</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Database Resmi JDIH</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Status Berlaku</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.berlaku.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-700/80">Regulasi Aktif</span>
        </div>

        <div 
          onClick={() => handleFilterChange(setSelectedSector, selectedSector === 'Moneter' ? 'all' : 'Moneter')}
          className={`cursor-pointer p-3.5 rounded-xl border transition shadow-2xs ${
            selectedSector === 'Moneter' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Moneter</span>
            <Landmark className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{stats.moneter.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Operasi, Valas & DHE</span>
        </div>

        <div 
          onClick={() => handleFilterChange(setSelectedSector, selectedSector === 'Sistem Pembayaran & PUR' ? 'all' : 'Sistem Pembayaran & PUR')}
          className={`cursor-pointer p-3.5 rounded-xl border transition shadow-2xs ${
            selectedSector === 'Sistem Pembayaran & PUR' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Sistem Pembayaran</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1">{stats.sp.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">PJP, PIP, QRIS, PUR</span>
        </div>

        <div 
          onClick={() => handleFilterChange(setSelectedSector, selectedSector === 'Makroprudensial' ? 'all' : 'Makroprudensial')}
          className={`cursor-pointer p-3.5 rounded-xl border transition shadow-2xs ${
            selectedSector === 'Makroprudensial' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Makroprudensial</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-600 mt-1">{stats.makro.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Likuiditas & RIM</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Search input and Status selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nomor aturan (PBI/PADG), judul, kata kunci..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium mr-1">Status:</span>
              <button
                onClick={() => handleFilterChange(setSelectedStatus, 'all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  selectedStatus === 'all' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleFilterChange(setSelectedStatus, 'Berlaku')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  selectedStatus === 'Berlaku' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Berlaku
              </button>
              <button
                onClick={() => handleFilterChange(setSelectedStatus, 'Dicabut')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  selectedStatus === 'Dicabut' 
                    ? 'bg-slate-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Dicabut/Diubah
              </button>
            </div>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1.5 shrink-0 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Sektor:
          </span>
          {[
            { id: 'all', label: 'Semua Sektor' },
            { id: 'Moneter', label: 'Moneter' },
            { id: 'Sistem Pembayaran & PUR', label: 'Sistem Pembayaran & PUR' },
            { id: 'Makroprudensial', label: 'Makroprudensial' },
            { id: 'Pendukung Kebijakan', label: 'Pendukung Kebijakan' },
            { id: 'Pendukung Organisasi', label: 'Pendukung Organisasi (Intern)' },
            { id: 'Lainnya', label: 'Lainnya' }
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => handleFilterChange(setSelectedSector, sec.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0 ${
                selectedSector === sec.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Document Type Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">
            Tipe:
          </span>
          {[
            { id: 'all', label: 'Semua Jenis' },
            { id: 'PBI', label: 'PBI (Peraturan Bank Indonesia)' },
            { id: 'PADG', label: 'PADG (Peraturan Anggota Dewan Gubernur)' },
            { id: 'PADG_INTERN', label: 'PADG Intern' },
            { id: 'SE', label: 'SE Ekstern BI' },
            { id: 'UU', label: 'Undang-Undang' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleFilterChange(setSelectedType, t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0 ${
                selectedType === t.id
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result Count and Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <strong>{filtered.length > 0 ? (currentPageClamped - 1) * pageSize + 1 : 0} - {Math.min(currentPageClamped * pageSize, filtered.length)}</strong> dari <strong>{filtered.length.toLocaleString()}</strong> regulasi terfilter
        </span>
        <span>Halaman {currentPageClamped} dari {totalPages}</span>
      </div>

      {/* Regulation List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">Tidak ada regulasi yang sesuai dengan kriteria filter.</p>
            <p className="text-slate-400">Coba ubah kata kunci pencarian atau reset filter sektor/tipe.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('all');
                setSelectedSector('all');
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          paginatedList.map((reg) => {
            const isExpanded = expandedRegId === reg.id;
            
            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
            let borderStyle = 'border-l-4 border-l-slate-400';
            
            if (reg.type === 'PBI') {
              badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
              borderStyle = 'border-l-4 border-l-blue-600';
            } else if (reg.type === 'PADG') {
              badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
              borderStyle = 'border-l-4 border-l-teal-600';
            } else if (reg.type === 'PADG_INTERN') {
              badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              borderStyle = 'border-l-4 border-l-indigo-600';
            } else if (reg.type === 'SE') {
              badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
              borderStyle = 'border-l-4 border-l-purple-500';
            } else if (reg.type === 'UU') {
              badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              borderStyle = 'border-l-4 border-l-amber-600';
            }

            return (
              <div
                key={reg.id}
                className={`bg-white border border-slate-200 ${borderStyle} rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition`}
              >
                <div
                  onClick={() => toggleExpand(reg.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    {/* Aligned Document Label */}
                    <div className="w-24 shrink-0">
                      <span className={`inline-block w-full text-center text-xs font-semibold py-1 rounded-md border font-mono ${badgeStyle}`}>
                        {reg.type === 'PADG_INTERN' ? 'PADG Intern' : reg.type}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {reg.number}
                        </span>
                        <span className="text-slate-300 text-xs">&bull;</span>
                        <span className="text-xs font-medium text-slate-600">
                          {reg.sector}
                        </span>
                        <span className="text-slate-300 text-xs">&bull;</span>
                        <span className="text-xs text-slate-400">
                          Tahun {reg.year} {reg.date ? `(${reg.date})` : ''}
                        </span>

                        <span className={`text-[10px] rounded-full px-2 py-0.5 ml-auto font-medium ${
                          reg.status === 'Berlaku'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-slate-500 bg-slate-100 border border-slate-200'
                        }`}>
                          {reg.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 mt-1">
                        {reg.title}
                      </h3>
                      {reg.summary && reg.summary !== reg.title && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {reg.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {reg.articles && reg.articles.length > 0 ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded hidden sm:inline">
                        {reg.articles.length} Pasal Terdaftar
                      </span>
                    ) : null}
                    <button className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-700">Rincian & Ketentuan Kepatuhan</span>
                        {reg.articles && reg.articles.length > 0 && (
                          <span className="text-slate-500">({reg.articles.length} pasal terstruktur)</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {reg.downloadPdfUrl && (
                          <a
                            href={reg.downloadPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 hover:text-slate-900 font-medium flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
                          >
                            <Download className="w-3 h-3 text-slate-600" />
                            <span>Unduh Naskah PDF</span>
                          </a>
                        )}
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                          {reg.sector} &bull; {reg.status}
                        </span>
                      </div>
                    </div>

                    {/* If detailed articles are available */}
                    {reg.articles && reg.articles.length > 0 ? (
                      <div className="space-y-2.5">
                        {reg.articles.map((art, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-900">
                                {art.articleNumber}: {art.title}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                              &ldquo;{art.content}&rdquo;
                            </p>

                            {(art.keyProhibitions?.length || art.thresholds?.length) ? (
                              <div className="space-y-1 text-xs text-slate-600 pt-1">
                                {art.keyProhibitions && art.keyProhibitions.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">Larangan: </span>
                                    <span>{art.keyProhibitions.join(', ')}</span>
                                  </div>
                                )}
                                {art.thresholds && art.thresholds.length > 0 && (
                                  <div>
                                    <span className="font-medium text-slate-700">Ambang Batas: </span>
                                    <span>{art.thresholds.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                        <p className="text-slate-700">
                          <strong>Judul Ketentuan:</strong> {reg.title}
                        </p>
                        <p className="text-slate-600">
                          <strong>Sektor Taksonomi:</strong> {reg.sector} &bull; <strong>Tahun Terbit:</strong> {reg.year} &bull; <strong>Status Keterlakuan:</strong> {reg.status}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Ketentuan ini tersimpan dalam basis data repositori regulasi Bank Indonesia untuk acuan kepatuhan dan harmonisasi penyusunan petunjuk teknis.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-2xs">
          <div className="text-xs text-slate-500">
            Halaman <strong>{currentPageClamped}</strong> dari <strong>{totalPages}</strong> ({filtered.length.toLocaleString()} total aturan)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPageClamped <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Sebelumnya
            </button>

            <div className="hidden sm:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPageClamped > 3) {
                  p = Math.min(totalPages - 4 + i, Math.max(1, currentPageClamped - 2 + i));
                }
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPageClamped === p
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPageClamped >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
