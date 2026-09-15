'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowLeft,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import { searchAllRegulations, SmartSearchResponse, SearchResultArticle } from '@/lib/smartSearchEngine';

const POPULAR_QUERIES = [
  'Larangan surcharge',
  'Sanksi denda di Juknis',
  'Batas settlement T+1',
  'Retensi log 5 tahun'
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [searchResult, setSearchResult] = useState<SmartSearchResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      setSearchResult(searchAllRegulations(initialQ));
    } else {
      setSearchResult(searchAllRegulations('surcharge'));
    }
  }, [initialQ]);

  const handleExecuteSearch = (q: string) => {
    setQuery(q);
    const res = searchAllRegulations(q);
    setSearchResult(res);
  };

  const handleCopyCitation = (art: SearchResultArticle) => {
    const text = `Rujukan: ${art.articleNumber} ${art.regulationNumber} tentang ${art.articleTitle}: "${art.content}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(art.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredArticles = (searchResult?.articles || []).filter(art => {
    const matchesType = selectedTypeFilter === 'ALL' || art.regulationType === selectedTypeFilter;
    const matchesSector = selectedSectorFilter === 'ALL' || art.sector.toLowerCase().includes(selectedSectorFilter.toLowerCase());
    return matchesType && matchesSector;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Back button & Page Title */}
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pencarian Regulasi &amp; Pasal BI
        </h1>
        <p className="text-xs text-slate-500">
          Cari ketentuan, klausul, atau pasal dalam basis data regulasi Bank Indonesia.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleExecuteSearch(e.target.value)}
            placeholder="Ketik kata kunci atau topik (misal: 'larangan surcharge', 'sanksi denda', 'retensi log')..."
            className="w-full text-xs sm:text-sm text-slate-900 pl-9 pr-36 py-2 bg-transparent focus:outline-hidden placeholder:text-slate-400"
          />
          <div className="absolute right-2 flex items-center space-x-1">
            {query && (
              <button
                onClick={() => handleExecuteSearch('')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">Contoh:</span>
          {POPULAR_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleExecuteSearch(p)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {searchResult && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200/80 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-blue-950 font-bold">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Ringkasan Ketentuan</span>
              </div>
              <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                {searchResult.totalMatched} Pasal Ditemukan
              </span>
            </div>

            <div className="text-slate-800 leading-relaxed">
              {searchResult.aiExecutiveAnswer}
            </div>

            <div className="pt-1.5 border-t border-blue-200/60 text-[11px] font-semibold text-blue-900">
              Kesimpulan: {searchResult.keyTakeaway}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 flex items-center space-x-1 text-[11px]">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              <button
                onClick={() => setSelectedTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedTypeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({searchResult.totalMatched})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('PBI')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedTypeFilter === 'PBI' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                PBI ({searchResult.hierarchyBreakdown.pbi})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('PADG')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedTypeFilter === 'PADG' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                PADG ({searchResult.hierarchyBreakdown.padg})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('PADG_INTERN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedTypeFilter === 'PADG_INTERN' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                PADG Intern ({searchResult.hierarchyBreakdown.padgIntern})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('JUKNIS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedTypeFilter === 'JUKNIS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Juknis ({searchResult.hierarchyBreakdown.juknis})
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">Sektor:</span>
              <select
                value={selectedSectorFilter}
                onChange={(e) => setSelectedSectorFilter(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">Semua Sektor</option>
                <option value="Sistem Pembayaran">Sistem Pembayaran</option>
                <option value="Pembentukan Peraturan">Pembentukan Peraturan</option>
                <option value="Manajemen Risiko">Manajemen Risiko &amp; Audit</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                Tidak ditemukan pasal untuk filter yang dipilih.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-4 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          art.regulationType === 'PBI'
                            ? 'bg-blue-100 text-blue-800'
                            : art.regulationType === 'PADG'
                            ? 'bg-cyan-100 text-cyan-800'
                            : art.regulationType === 'PADG_INTERN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {art.regulationType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {art.regulationNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          &bull; {art.regulationTitle}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {art.sector}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <strong className="text-slate-900 block font-semibold">
                        {art.articleNumber}: {art.articleTitle}
                      </strong>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                        &ldquo;{art.content}&rdquo;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => handleCopyCitation(art)}
                        className="flex items-center space-x-1.5 text-slate-500 hover:text-blue-700 font-semibold text-[11px]"
                      >
                        {copiedId === art.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Kutipan</span>
                          </>
                        )}
                      </button>

                      <div>
                        {art.source === 'regulation' ? (
                          <a
                            href={art.jdihUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                          >
                            <span>Lihat di JDIH BI</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Link
                            href={art.jdihUrl}
                            className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-900 font-semibold text-[11px]"
                          >
                            <span>Buka Naskah</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat pencarian...</div>}>
      <SearchContent />
    </Suspense>
  );
}
