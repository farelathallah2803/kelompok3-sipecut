'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  X, 
  Scale, 
  ExternalLink, 
  Copy, 
  Check, 
  BookOpen, 
  AlertTriangle, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { searchAllRegulations, SmartSearchResponse, SearchResultArticle } from '@/lib/smartSearchEngine';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const QUICK_PROMPTS = [
  'Larangan surcharge',
  'Sanksi denda di Juknis',
  'Batas settlement T+1',
  'Retensi log 5 tahun'
];

export default function SmartSearchModal({ isOpen, onClose, initialQuery = '' }: SmartSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchResult, setSearchResult] = useState<SmartSearchResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (initialQuery) {
        handleSearch(initialQuery);
      } else {
        handleSearch('surcharge');
      }
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = (q: string) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in zoom-in-95 duration-150">
        
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Search className="w-5 h-5" />
          </div>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Ketik kata kunci atau topik (contoh: 'larangan surcharge', 'sanksi juknis', 'retensi log')..."
              className="w-full text-sm font-medium pr-8 pl-1 py-1.5 bg-transparent border-none focus:outline-hidden text-slate-900 placeholder:text-slate-400"
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 overflow-x-auto flex items-center space-x-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Contoh Cepat:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(prompt)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Modal Body / Results Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {searchResult && (
            <>
              {/* Summary Card */}
              <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-200/80 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-blue-950 font-bold">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ringkasan Ketentuan:</span>
                </div>
                <div className="text-slate-800 leading-relaxed">
                  {searchResult.aiExecutiveAnswer}
                </div>
                <div className="pt-1.5 border-t border-blue-200/60 text-[11px] font-semibold text-blue-900">
                  Kesimpulan: {searchResult.keyTakeaway}
                </div>
              </div>

              {/* Matched Articles Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">Pasal Terkait ({searchResult.totalMatched}):</span>
                </div>

                {searchResult.articles.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Tidak ditemukan pasal yang relevan dengan kueri tersebut.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {searchResult.articles.map((art) => (
                      <div 
                        key={art.id} 
                        className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-3.5 transition space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                              {art.regulationType}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {art.regulationNumber} &bull; {art.articleNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{art.sector}</span>
                        </div>

                        <div className="text-xs">
                          <strong className="text-slate-800 block mb-0.5">{art.articleTitle}</strong>
                          <p className="text-slate-600 text-xs italic leading-relaxed line-clamp-3">
                            &ldquo;{art.content}&rdquo;
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleCopyCitation(art)}
                            className="flex items-center space-x-1 text-slate-500 hover:text-blue-700 font-semibold text-[11px]"
                          >
                            {copiedId === art.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin Rujukan</span>
                              </>
                            )}
                          </button>

                          {art.source === 'regulation' ? (
                            <a
                              href={art.jdihUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                            >
                              <span>Buka di JDIH</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <Link
                              href={art.jdihUrl}
                              onClick={onClose}
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                            >
                              <span>Buka Dokumen</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tekan <kbd className="font-mono bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700 shadow-2xs">ESC</kbd> untuk menutup
          </span>
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onClose}
            className="font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>Buka di Halaman Eksplorasi Penuh &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
