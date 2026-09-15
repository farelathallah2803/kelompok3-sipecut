'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';
import { PetunjukTeknisDraft, UserRole } from '@/types';
import { getDrafts, getActiveRole, getStageLabel, getWorkflowType } from '@/lib/storage';

export default function DashboardPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<PetunjukTeknisDraft[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('drafter');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const loadData = () => {
    setDrafts(getDrafts());
    setActiveRole(getActiveRole());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('juknis_storage_updated', loadData);
    window.addEventListener('juknis_role_changed', loadData);
    return () => {
      window.removeEventListener('juknis_storage_updated', loadData);
      window.removeEventListener('juknis_role_changed', loadData);
    };
  }, []);

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = 
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.unitKerja.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesScope = selectedScopeFilter === 'all' || (draft.scope || '').toUpperCase() === selectedScopeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || draft.status === selectedStatusFilter;

    return matchesSearch && matchesScope && matchesStatus;
  });

  const totalCount = drafts.length;
  const inReviewCount = drafts.filter(d => d.status === 'in_review').length;
  const approvedCount = drafts.filter(d => d.status === 'approved' || d.currentStage === 'ditetapkan' || d.currentStage === 'juknis_publikasi_dhk').length;
  const needRevisionCount = drafts.filter(d => d.status === 'revision_requested' || (d.complianceSummary && d.complianceSummary.conflictCount > 0)).length;

  const internalCount = drafts.filter(d => (d.scope || '').toUpperCase() === 'INTERNAL').length;
  const eksternalCount = drafts.filter(d => (d.scope || '').toUpperCase() === 'EKSTERNAL').length;

  const getJuknisBadgeInfo = (draft: PetunjukTeknisDraft) => {
    const isInternal = (draft.scope || '').toUpperCase() === 'INTERNAL';
    const templateLabel = draft.templateType === 'templat_2'
      ? 'Templat 2 (Manual)'
      : draft.templateType === 'templat_3'
      ? 'Templat 3 (Eksternal)'
      : 'Templat 1 (Prosedur)';

    return {
      scopeLabel: isInternal ? 'INTERNAL' : 'EKSTERNAL',
      scopeColor: isInternal ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      templateLabel,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Petunjuk Teknis (Juknis)
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            href="/search"
            className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Pencarian</span>
          </Link>

          <Link
            href="/draft/new"
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Draft Juknis</span>
          </Link>
        </div>
      </div>

      {/* Clean Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Berkas Juknis</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-blue-600">Sedang Ditelaah</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{inReviewCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600">Resmi Ditetapkan</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{approvedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600">Perlu Penyesuaian</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{needRevisionCount}</div>
        </div>
      </div>

      {/* Main Content Area: Filter & Drafts Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
          {/* Juknis Scope Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-lg self-start overflow-x-auto shrink-0">
            <button
              onClick={() => setSelectedScopeFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition ${
                selectedScopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Juknis ({totalCount})
            </button>
            <button
              onClick={() => setSelectedScopeFilter('INTERNAL')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition ${
                selectedScopeFilter === 'INTERNAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Juknis Internal ({internalCount})
            </button>
            <button
              onClick={() => setSelectedScopeFilter('EKSTERNAL')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition ${
                selectedScopeFilter === 'EKSTERNAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Juknis Eksternal ({eksternalCount})
            </button>
          </div>

          {/* Search Input & Status Filter */}
          <div className="flex items-center space-x-2.5 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor, judul, satker..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shrink-0"
            >
              <option value="all">Semua Status</option>
              <option value="in_review">Dalam Review</option>
              <option value="approved">Ditetapkan</option>
              <option value="revision_requested">Perlu Revisi</option>
              <option value="draft">Draft Awal</option>
            </select>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-4">Naskah Petunjuk Teknis</th>
                <th className="py-3 px-4">Satker Pemrakarsa</th>
                <th className="py-3 px-4">Posisi Tahapan</th>
                <th className="py-3 px-4">Hasil Harmonisasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada berkas yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((draft) => {
                  const badge = getJuknisBadgeInfo(draft);
                  const summary = draft.complianceSummary;

                  return (
                    <tr key={draft.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.scopeColor}`}>
                            {badge.scopeLabel}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                            {badge.templateLabel}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {draft.code}
                          </span>
                        </div>
                        <Link
                          href={`/draft/${draft.id}`}
                          className="font-bold text-slate-900 group-hover:text-blue-600 transition block line-clamp-1 text-xs"
                        >
                          {draft.title}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800 text-xs">{draft.unitKerja}</div>
                        <div className="text-[10px] text-slate-400">PIC: {draft.proposerName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {getStageLabel(draft.currentStage)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {summary ? (
                          summary.conflictCount > 0 ? (
                            <span className="inline-flex items-center w-36 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 text-rose-600" />
                              <span>{summary.conflictCount} Konflik</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center w-36 px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald-600" />
                              <span>Selaras ({summary.compatibilityScore}%)</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center w-36 px-2.5 py-1 text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {draft.status === 'approved' && (
                          <span className="inline-flex items-center w-28 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 shrink-0"></span>
                            <span>Ditetapkan</span>
                          </span>
                        )}
                        {draft.status === 'in_review' && (
                          <span className="inline-flex items-center w-28 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 shrink-0"></span>
                            <span>Dalam Review</span>
                          </span>
                        )}
                        {draft.status === 'revision_requested' && (
                          <span className="inline-flex items-center w-28 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 shrink-0"></span>
                            <span>Perlu Revisi</span>
                          </span>
                        )}
                        {draft.status === 'draft' && (
                          <span className="inline-flex items-center w-28 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 shrink-0"></span>
                            <span>Draft Awal</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/draft/${draft.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition"
                        >
                          <span>Buka</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
