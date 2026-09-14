'use client';

import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';

export default function RegulationsCatalogPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedRegId, setExpandedRegId] = useState<string | null>('reg-pbi-23-6');

  const filtered = MOCK_REGULATIONS.filter(reg => {
    const matchesSearch = 
      reg.number.toLowerCase().includes(search.toLowerCase()) ||
      reg.title.toLowerCase().includes(search.toLowerCase()) ||
      reg.summary.toLowerCase().includes(search.toLowerCase()) ||
      reg.articles.some(a => a.content.toLowerCase().includes(search.toLowerCase()) || a.articleNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'all' || reg.type === selectedType;

    return matchesSearch && matchesType;
  });

  const toggleExpand = (id: string) => {
    setExpandedRegId(expandedRegId === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Repositori Regulasi
          </h1>
        </div>

        <div>
          <a
            href="https://jdih.bi.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>Buka JDIH BI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor aturan, kata kunci pasal..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedType === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedType('PBI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedType === 'PBI' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              PBI
            </button>
            <button
              onClick={() => setSelectedType('PADG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedType === 'PADG' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              PADG
            </button>
            <button
              onClick={() => setSelectedType('PADG_INTERN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedType === 'PADG_INTERN' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              PADG Intern
            </button>
          </div>
        </div>
      </div>

      {/* Regulation List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ditemukan regulasi yang sesuai dengan pencarian.
          </div>
        ) : (
          filtered.map((reg) => {
            const isExpanded = expandedRegId === reg.id;
            const accent = 
              reg.type === 'PBI' 
                ? { border: 'border-l-4 border-l-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' }
                : reg.type === 'PADG'
                ? { border: 'border-l-4 border-l-teal-600', badge: 'bg-teal-50 text-teal-700 border-teal-200' }
                : { border: 'border-l-4 border-l-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };

            return (
              <div
                key={reg.id}
                className={`bg-white border border-slate-200 ${accent.border} rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition`}
              >
                <div
                  onClick={() => toggleExpand(reg.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    {/* Aligned Document Label with subtle color accent */}
                    <div className="w-24 shrink-0">
                      <span className={`inline-block w-full text-center text-xs font-semibold py-1 rounded-md border font-mono ${accent.badge}`}>
                        {reg.type === 'PADG_INTERN' ? 'PADG Intern' : reg.type}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {reg.number}
                        </span>
                        <span className="text-slate-300 text-xs">&bull;</span>
                        <span className="text-xs text-slate-500 truncate">
                          {reg.sector} ({reg.year})
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 ml-auto hidden sm:inline font-medium">
                          {reg.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                        {reg.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {reg.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {reg.articles.length} Pasal
                    </span>
                    <button className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                      <span className="font-semibold text-slate-700">
                        Pasal Terkait ({reg.articles.length} Pasal)
                      </span>
                      <a
                        href={reg.jdihUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        <span>Lihat Dokumen di JDIH BI</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
