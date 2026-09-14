'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Filter, 
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { HarmonizationSummary, HarmonizationIssue, PetunjukTeknisDraft } from '@/types';
import { runHarmonizationAnalysis } from '@/lib/harmonizationEngine';

interface HarmonizationCheckerProps {
  draft: PetunjukTeknisDraft;
  onAnalysisUpdated?: (newSummary: HarmonizationSummary) => void;
}

export default function HarmonizationChecker({ draft, onAnalysisUpdated }: HarmonizationCheckerProps) {
  const [summary, setSummary] = useState<HarmonizationSummary>(
    draft.complianceSummary || runHarmonizationAnalysis(draft)
  );
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = runHarmonizationAnalysis(draft);
      setSummary(res);
      setIsAnalyzing(false);
      if (onAnalysisUpdated) {
        onAnalysisUpdated(res);
      }
    }, 500);
  };

  const filteredIssues = summary.issues.filter(issue => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const getSeverityBadge = (sev: HarmonizationIssue['severity']) => {
    switch (sev) {
      case 'conflict':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> BERTENTANGAN (KONFLIK)
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Copy className="w-3.5 h-3.5 mr-1" /> DUPLIKASI NORMA
          </span>
        );
      case 'hierarchy_violation':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> PELANGGARAN HIERARKI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
            <Info className="w-3.5 h-3.5 mr-1" /> CATATAN KEPATUHAN
          </span>
        );
    }
  };

  const getRegulationTypeBadge = (type: string) => {
    switch (type) {
      case 'PBI':
        return <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">PBI</span>;
      case 'PADG':
        return <span className="bg-blue-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">PADG</span>;
      case 'PADG_INTERN':
        return <span className="bg-indigo-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">PADG Intern</span>;
      default:
        return <span className="bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Score & Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-slate-900">
                Uji Harmonisasi Regulasi
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReAnalyze}
              disabled={isAnalyzing}
              className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Menganalisis...' : 'Uji Ulang Harmonisasi'}</span>
            </button>
          </div>
        </div>

        {/* Score & Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Skor Keselarasan Norma</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {summary.compatibilityScore}%
              </div>
              <div className="text-[11px] mt-0.5">
                {summary.compatibilityScore >= 80 ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sangat Selaras
                  </span>
                ) : summary.compatibilityScore >= 60 ? (
                  <span className="text-amber-700 font-semibold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Perlu Penyesuaian
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold flex items-center">
                    <AlertOctagon className="w-3 h-3 mr-1" /> Potensi Konflik Hukum
                  </span>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
              summary.compatibilityScore >= 80 
                ? 'bg-emerald-100 text-emerald-800' 
                : summary.compatibilityScore >= 60 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {summary.compatibilityScore}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="text-xs text-rose-700 font-medium flex items-center">
              <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Pertentangan Klausul
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1">
              {summary.conflictCount}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="text-xs text-purple-700 font-medium flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Pelanggaran Hierarki
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1">
              {summary.hierarchyViolations}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-xs text-amber-700 font-medium flex items-center">
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplikasi Norma
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {summary.duplicateCount}
            </div>
          </div>
        </div>

        <div className="mt-5 p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start space-x-3">
          <div className="mt-0.5 text-blue-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-blue-900">
            <strong className="font-semibold block mb-0.5">Prinsip Asas Hierarki Hukum Bank Indonesia:</strong>
            Petunjuk Teknis (Juknis) berstatus sebagai pedoman teknis operasional dan <strong>tidak boleh bertentangan</strong> atau mengurangi daya laku norma dalam <strong>Peraturan Bank Indonesia (PBI)</strong>, <strong>Peraturan Anggota Dewan Gubernur (PADG)</strong>, maupun <strong>PADG Intern</strong>.
          </div>
        </div>
      </div>

      {/* Filter and Issues List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-bold text-slate-800">
              Matriks Komparasi &amp; Temuan Harmonisasi ({filteredIssues.length} temuan)
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterSeverity === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({summary.totalIssues})
            </button>
            <button
              onClick={() => setFilterSeverity('conflict')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterSeverity === 'conflict' 
                  ? 'bg-rose-700 text-white' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Pertentangan ({summary.conflictCount})
            </button>
            <button
              onClick={() => setFilterSeverity('hierarchy_violation')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterSeverity === 'hierarchy_violation' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Hierarki ({summary.hierarchyViolations})
            </button>
            <button
              onClick={() => setFilterSeverity('duplicate')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterSeverity === 'duplicate' 
                  ? 'bg-amber-700 text-white' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Duplikasi ({summary.duplicateCount})
            </button>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h5 className="text-sm font-bold text-slate-800">Tidak Ditemukan Isu Harmonisasi</h5>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Draft petunjuk teknis telah selaras dengan seluruh aturan dalam repositori PBI, PADG, dan PADG Intern yang dipilih.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-4 space-y-4">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="pt-4 first:pt-0">
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-xs font-bold text-slate-900">
                        {issue.draftArticle}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Berhadapan dengan:</span>
                      {getRegulationTypeBadge(issue.matchedRegulationType)}
                      <span className="text-xs font-bold text-slate-800">
                        {issue.matchedRegulationNumber} ({issue.matchedArticle})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Isi Draft Petunjuk Teknis ({issue.draftArticle})</span>
                        <span className="text-rose-600 font-semibold text-[10px]">Teks Rancangan</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-mono bg-rose-50/50 p-2 rounded border border-rose-100">
                        &quot;{issue.draftText}&quot;
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Ketentuan Acuan Lebih Kuat ({issue.matchedArticle})</span>
                        <span className="text-blue-700 font-semibold text-[10px]">{issue.matchedRegulationType}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-mono bg-blue-50/50 p-2 rounded border border-blue-100">
                        &quot;{issue.matchedText}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80 text-xs text-amber-900">
                      <strong className="font-semibold text-amber-950 block mb-0.5">Analisis Pertentangan / Duplikasi:</strong>
                      {issue.explanation}
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 text-xs text-emerald-900 flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-emerald-950 block mb-0.5">Rekomendasi Perbaikan Redaksi:</strong>
                        {issue.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
