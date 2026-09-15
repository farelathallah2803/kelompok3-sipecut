'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, AlertTriangle, AlertOctagon, CheckCircle2, GitBranch, FileText, ExternalLink,
  ChevronDown, ChevronUp, Plus, Trash2, ThumbsUp, ThumbsDown, Loader2,
} from 'lucide-react';
import {
  ProjectDocument, ComparisonPair, ApprovalCorrections, RelationType, RelationFlag,
  DOC_TYPES, approveDocument, rejectDocument, getComparisonPairs,
} from '@/lib/documentsApi';

const NEXT_STAGE: Record<string, string> = {
  approval_1: 'Kepala Satuan Kerja',
  approval_2: 'Divisi Hukum',
  approval_3: 'Rapat Terbuka',
  approval_4: 'Terbit',
};
const RELATION_TYPES: RelationType[] = ['MENJELASKAN', 'MENGUBAH', 'MENCABUT'];
const RELATION_FLAGS: RelationFlag[] = ['MENGUBAH', 'DIUBAH', 'MENCABUT', 'DICABUT'];

type EdgeRow = { doc_id: number; relation_type: RelationType };

const toRows = (edges: ProjectDocument['parent_edges']): EdgeRow[] =>
  edges.map((e) => ({ doc_id: e.id, relation_type: e.relation_type }));
const sameRows = (a: EdgeRow[], b: EdgeRow[]) => JSON.stringify(a) === JSON.stringify(b);

function EdgeEditor({ label, rows, onChange, options }: {
  label: string;
  rows: EdgeRow[];
  onChange: (rows: EdgeRow[]) => void;
  options: { id: number; title: string }[];
}) {
  const update = (i: number, patch: Partial<EdgeRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-700">{label}</span>
        <button
          type="button"
          disabled={options.length === 0}
          onClick={() => onChange([...rows, { doc_id: options[0].id, relation_type: 'MENJELASKAN' }])}
          className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1 disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>
      {rows.length === 0 && <p className="text-[11px] text-slate-400">Tidak ada.</p>}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <select
            value={row.doc_id}
            onChange={(e) => update(i, { doc_id: Number(e.target.value) })}
            className="flex-1 min-w-0 text-[11px] px-2 py-1 rounded border border-slate-300"
          >
            {!options.some((o) => o.id === row.doc_id) && <option value={row.doc_id}>Dokumen #{row.doc_id}</option>}
            {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <select
            value={row.relation_type}
            onChange={(e) => update(i, { relation_type: e.target.value as RelationType })}
            className="text-[11px] px-2 py-1 rounded border border-slate-300"
          >
            {RELATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="p-1 text-slate-400 hover:text-rose-600"
            aria-label="Hapus relasi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ApprovalReviewModal({ doc, allDocuments, onClose, onDecided }: {
  doc: ProjectDocument;
  allDocuments: ProjectDocument[];
  onClose: () => void;
  onDecided: (updated: ProjectDocument) => void;
}) {
  const amendedParents = doc.parent_edges.filter((e) => e.relation_type === 'MENGUBAH' || e.relation_type === 'MENCABUT');
  const isAmending = amendedParents.length > 0
    || doc.relation_flags.includes('MENGUBAH')
    || doc.relation_flags.includes('MENCABUT');

  const [pairs, setPairs] = useState<ComparisonPair[] | null>(null);
  const [pairsError, setPairsError] = useState('');
  const [onlyConflicts, setOnlyConflicts] = useState(false);

  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  const [showCorrections, setShowCorrections] = useState(false);
  const [aiTitle, setAiTitle] = useState(doc.ai_title);
  const [docType, setDocType] = useState(doc.doc_type);
  const [flags, setFlags] = useState<RelationFlag[]>(doc.relation_flags);
  const [parents, setParents] = useState<EdgeRow[]>(() => toRows(doc.parent_edges));
  const [children, setChildren] = useState<EdgeRow[]>(() => toRows(doc.child_edges));

  useEffect(() => {
    if (!doc.comparison_session_id) return;
    getComparisonPairs(doc.comparison_session_id)
      .then(setPairs)
      .catch((e) => setPairsError(e.message));
  }, [doc.comparison_session_id]);

  const edgeOptions = useMemo(
    () => allDocuments.filter((d) => d.id !== doc.id).map((d) => ({ id: d.id, title: d.ai_title || d.title })),
    [allDocuments, doc.id]
  );

  const conflictCount = pairs?.filter((p) => p.relation_group === 'BERTENTANGAN').length ?? 0;
  const alignedCount = pairs?.filter((p) => p.relation_group === 'SELARAS').length ?? 0;
  const visiblePairs = (pairs || []).filter((p) => !onlyConflicts || p.relation_group === 'BERTENTANGAN');

  // Only send fields the approver actually changed — edge lists replace everything server-side.
  const corrections = (): ApprovalCorrections => {
    const c: ApprovalCorrections = {};
    if (aiTitle.trim() !== doc.ai_title) c.ai_title = aiTitle.trim();
    if (docType && docType !== doc.doc_type) c.doc_type = docType;
    if ([...flags].sort().join() !== [...doc.relation_flags].sort().join()) c.relation_flags = flags;
    if (!sameRows(parents, toRows(doc.parent_edges))) c.parent_edges = parents;
    if (!sameRows(children, toRows(doc.child_edges))) c.child_edges = children;
    return c;
  };
  const correctionCount = Object.keys(corrections()).length;

  const decide = async (kind: 'approve' | 'reject') => {
    setBusy(kind);
    setError('');
    try {
      const updated = kind === 'approve'
        ? await approveDocument(doc.id, notes, corrections())
        : await rejectDocument(doc.id, notes);
      onDecided(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aksi gagal.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 text-left font-normal">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {doc.status_display}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate">{doc.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span>{doc.doc_type_display || 'Tipe belum terdeteksi'}</span>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Lihat PDF <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Amendment context */}
          {isAmending && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs font-bold">Dokumen ini terdeteksi mengubah dokumen lain</span>
              </div>
              {amendedParents.length > 0 ? (
                <ul className="space-y-1">
                  {amendedParents.map((p) => {
                    const parent = allDocuments.find((d) => d.id === p.id);
                    return (
                      <li key={`${p.id}-${p.relation_type}`} className="text-[11px] text-slate-700 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-800">{p.relation_type}</span>
                        <span className="font-semibold">{p.title}</span>
                        {parent && <span className="text-slate-500">({parent.status_display})</span>}
                        {p.is_placeholder && <span className="text-slate-400 italic">placeholder — belum diunggah</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-600">AI menandai relasi perubahan, tetapi dokumen induknya belum teridentifikasi. Periksa & koreksi relasi di bawah.</p>
              )}
            </div>
          )}

          {/* AI comparison results */}
          {doc.comparison_session_id ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-900">Hasil Penilaian AI: Pasal Baru vs Ketentuan Induk</h4>
                {pairs && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-rose-700">{conflictCount} bertentangan</span>
                    <span className="font-bold text-emerald-700">{alignedCount} selaras</span>
                    <label className="flex items-center gap-1 text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={onlyConflicts} onChange={(e) => setOnlyConflicts(e.target.checked)} />
                      Hanya bertentangan
                    </label>
                  </div>
                )}
              </div>
              {pairsError && <p className="text-[11px] text-rose-600">{pairsError}</p>}
              {!pairs && !pairsError && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Memuat hasil perbandingan...</p>
              )}
              {pairs && visiblePairs.length === 0 && (
                <p className="text-[11px] text-slate-400">Tidak ada pasangan untuk ditampilkan.</p>
              )}
              <div className="space-y-2">
                {visiblePairs.map((p) => {
                  const conflict = p.relation_group === 'BERTENTANGAN';
                  return (
                    <div key={p.rank} className={`rounded-lg border p-3 space-y-1.5 ${conflict ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${conflict ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {conflict ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {p.relation_group || 'TIDAK TERKLASIFIKASI'}
                        </span>
                        <span className="text-[10px] text-slate-400">kemiripan {Math.round(p.similarity * 100)}%</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Pasal baru:</span> {p.relation || '—'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">Ketentuan induk:</span> {p.breadcrumb || '—'}
                        {p.page_number != null && <span className="text-slate-400"> (hlm. {p.page_number})</span>}
                      </div>
                      <p className="text-[11px] text-slate-700 bg-white border border-slate-100 rounded p-2 line-clamp-3">{p.text}</p>
                      {p.relation_reason && <p className="text-[11px] text-slate-600 italic">{p.relation_reason}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isAmending && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-[11px] text-slate-600">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              AI tidak menemukan pasal induk yang tumpang-tindih (atau induk belum memiliki corpus). Tinjau perubahan secara manual.
            </div>
          )}

          {/* Corrections */}
          <div className="rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowCorrections((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-800"
            >
              <span>
                Koreksi klasifikasi AI <span className="font-normal text-slate-500">(opsional)</span>
                {correctionCount > 0 && <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{correctionCount} perubahan</span>}
              </span>
              {showCorrections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCorrections && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-700">Judul resmi (AI)</span>
                    <input value={aiTitle} onChange={(e) => setAiTitle(e.target.value)} className="mt-1 w-full text-xs px-2.5 py-1.5 rounded border border-slate-300" />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-700">Tipe dokumen</span>
                    <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full text-xs px-2.5 py-1.5 rounded border border-slate-300">
                      {!doc.doc_type && <option value="">Belum terdeteksi</option>}
                      {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-700">Tag relasi</span>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {RELATION_FLAGS.map((f) => (
                      <label key={f} className="flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flags.includes(f)}
                          onChange={(e) => setFlags(e.target.checked ? [...flags, f] : flags.filter((x) => x !== f))}
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>
                <EdgeEditor label="Dokumen induk (yang dirujuk dokumen ini)" rows={parents} onChange={setParents} options={edgeOptions} />
                <EdgeEditor label="Dokumen turunan (yang merujuk dokumen ini)" rows={children} onChange={setChildren} options={edgeOptions} />
                <p className="text-[10px] text-slate-400">Koreksi diterapkan saat dokumen disetujui. Penolakan tidak menyimpan koreksi.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-700">Catatan persetujuan / alasan penolakan</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full text-xs px-2.5 py-2 rounded border border-slate-300"
            />
          </label>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">Mock approval — belum ada pengecekan role/IAM.</span>
          <div className="flex items-center gap-2">
            <button
              disabled={busy !== null}
              onClick={() => decide('reject')}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />} Tolak
            </button>
            <button
              disabled={busy !== null}
              onClick={() => decide('approve')}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
              {doc.status === 'approval_4' ? 'Setujui & Terbitkan' : `Setujui → ${NEXT_STAGE[doc.status] ?? 'tahap berikutnya'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
