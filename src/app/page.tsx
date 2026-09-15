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
import { SATUAN_KERJA_LIST } from '@/data/satkerData';

export default function DashboardPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<PetunjukTeknisDraft[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('drafter');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('auto');

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

  // Is active role a central reviewer (DMST, DMR, DHk, DAI, etc)?
  const isGlobalReviewerRole = [
    'dmst_governance',
    'dmr_reviewer',
    'dhuk_legal',
    'dai_auditor',
    'kemenkum_kemenkeu',
    'sekretariat_rdg',
    'adg_pembina',
    'gubernur_bi'
  ].includes(activeRole);

  // Satker Pemrakarsa default for Satker/Pimpinan Satker account
  const defaultSatker = (activeRole === 'drafter' || activeRole === 'pimpinan_satker') ? 'DKSP' : 'all';

  // Effective Satker scope for stats and list
  const activeSatkerScope = selectedSatkerFilter === 'auto' ? defaultSatker : selectedSatkerFilter;

  // Filter drafts based on account role & Satker scope
  const accountDrafts = drafts.filter(draft => {
    if (activeSatkerScope === 'all') return true;
    return (
      (draft.rubrikSatker || '').toUpperCase() === activeSatkerScope.toUpperCase() ||
      (draft.unitKerja || '').toUpperCase().includes(activeSatkerScope.toUpperCase())
    );
  });

  const filteredDrafts = accountDrafts.filter(draft => {
    const matchesSearch = 
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.unitKerja.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesScope = selectedScopeFilter === 'all' || (draft.scope || '').toUpperCase() === selectedScopeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || draft.status === selectedStatusFilter;

    return matchesSearch && matchesScope && matchesStatus;
  });

  // Account-based Statistics
  const totalCount = accountDrafts.length;
  const inReviewCount = accountDrafts.filter(d => d.status === 'in_review').length;
  const approvedCount = accountDrafts.filter(d => d.status === 'approved' || d.currentStage === 'ditetapkan' || d.currentStage === 'juknis_publikasi_dhk').length;
  const needRevisionCount = accountDrafts.filter(d => d.status === 'revision_requested' || (d.complianceSummary && d.complianceSummary.conflictCount > 0)).length;
  const rejectedCount = accountDrafts.filter(d => d.status === 'rejected').length;

  const internalCount = accountDrafts.filter(d => (d.scope || '').toUpperCase() === 'INTERNAL').length;
  const eksternalCount = accountDrafts.filter(d => (d.scope || '').toUpperCase() === 'EKSTERNAL').length;

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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center w-32 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 shrink-0"></span>
            <span>Ditetapkan</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center w-32 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 shrink-0"></span>
            <span>Dalam Review</span>
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center w-32 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 shrink-0"></span>
            <span>Perlu Revisi</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center w-32 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 shrink-0"></span>
            <span>Ditolak</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center w-32 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 shrink-0"></span>
            <span>Draft Awal</span>
          </span>
        );
    }
  };

  // Active Satker Label for display
  const activeSatkerObj = SATUAN_KERJA_LIST.find(s => s.code.toUpperCase() === activeSatkerScope.toUpperCase());
  const activeSatkerLabel = activeSatkerScope === 'all'
    ? 'Semua 33 Satker BI (Global)'
    : (activeSatkerObj ? `${activeSatkerObj.code} - ${activeSatkerObj.name}` : activeSatkerScope);

  return (
    <div className="w-full space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Monitoring &amp; Harmonisasi Juknis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau status alur persetujuan dan penyelarasan regulasi Petunjuk Teknis Bank Indonesia.
          </p>
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

      {/* Account Scope Indicator Banner */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Cakupan Statistik &amp; Berkas:</span>
          {isGlobalReviewerRole ? (
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              Penelaah Central ({activeRole.toUpperCase()}) &bull; {activeSatkerLabel}
            </span>
          ) : (
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              Satker Pemrakarsa: {activeSatkerLabel}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-slate-400">Filter Satker (33 Satker BI):</span>
          <select
            value={activeSatkerScope}
            onChange={(e) => setSelectedSatkerFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-hidden max-w-xs sm:max-w-sm truncate"
          >
            <option value="all">Semua 33 Satker (Global BI)</option>
            {SATUAN_KERJA_LIST.map((satker) => (
              <option key={satker.code} value={satker.code}>
                {satker.code} - {satker.name} ({satker.sector})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clean Stat Strip (5 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Berkas Juknis</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-blue-600">Dalam Review</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{inReviewCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600">Perlu Revisi</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{needRevisionCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-rose-600">Ditolak</div>
          <div className="text-2xl font-black text-rose-900 mt-1">{rejectedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600">Resmi Ditetapkan</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{approvedCount}</div>
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
              <option value="revision_requested">Perlu Revisi</option>
              <option value="rejected">Ditolak</option>
              <option value="approved">Resmi Ditetapkan</option>
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
                        {renderStatusBadge(draft.status)}
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
