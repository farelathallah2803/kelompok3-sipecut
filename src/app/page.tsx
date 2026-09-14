'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
} from 'lucide-react';
import { PetunjukTeknisDraft } from '@/types';
import { getStageLabel } from '@/lib/storage';
import { getActiveProject } from '@/lib/auth';
import { listDrafts } from '@/lib/draftsApi';

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<PetunjukTeknisDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [error, setError] = useState('');

  const loadData = () => {
    const project = getActiveProject();
    if (!project) {
      setDrafts([]);
      return;
    }
    listDrafts(project.hierarchyId)
      .then(setDrafts)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('projectSelected', loadData);
    return () => window.removeEventListener('projectSelected', loadData);
  }, []);

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch =
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.unitKerja.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'all' || draft.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = drafts.length;
  const inReviewCount = drafts.filter(d => d.status === 'in_review').length;
  const approvedCount = drafts.filter(d => d.status === 'approved').length;
  const needRevisionCount = drafts.filter(d => d.status === 'revision_requested').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Alur Petunjuk Teknis
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
            <span>Buat Draft Baru</span>
          </Link>
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Clean Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Berkas</div>
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
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-end gap-4 bg-slate-50/40">
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
                <th className="py-3 px-4">Naskah Juknis</th>
                <th className="py-3 px-4">Satker Pemrakarsa</th>
                <th className="py-3 px-4">Posisi Tahapan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {drafts.length === 0 ? 'Belum ada draft Juknis di project ini.' : 'Tidak ada berkas yang sesuai dengan kriteria filter.'}
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                          JUKNIS
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
                      {draft.status === 'rejected' && (
                        <span className="inline-flex items-center w-28 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span>Ditolak</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
