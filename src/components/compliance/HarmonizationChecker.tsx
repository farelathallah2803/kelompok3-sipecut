'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Filter,
  Play,
  Square,
  Scale,
  ShieldCheck,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { HarmonizationSummary, HarmonizationIssue, PetunjukTeknisDraft } from '@/types';
import { getActiveProject } from '@/lib/auth';
import { runRealHarmonization, submitHarmonizationFeedback, PipelineStep, PipelineStepState } from '@/lib/harmonizationApi';
import PipelineProgress from './PipelineProgress';

interface HarmonizationCheckerProps {
  draft: PetunjukTeknisDraft;
  onAnalysisUpdated?: (newSummary: HarmonizationSummary) => void;
}

function defaultQueryText(draft: PetunjukTeknisDraft): string {
  const articleText = (draft.chapters || [])
    .flatMap((c) => c.articles || [])
    .map((a) => a.content)
    .filter(Boolean)
    .join('\n\n');
  if (articleText) return articleText;
  return draft.rawContent || draft.generalProvisions?.background || '';
}

export default function HarmonizationChecker({ draft, onAnalysisUpdated }: HarmonizationCheckerProps) {
  const activeProject = getActiveProject();
  const hierarchyId = draft.hierarchyId || activeProject?.hierarchyId;

  const [queryText, setQueryText] = useState(() => defaultQueryText(draft));
  const [summary, setSummary] = useState<HarmonizationSummary | null>(
    draft.complianceSummary?.mode === 'real' ? draft.complianceSummary : null
  );
  const [pipelineState, setPipelineState] = useState<Partial<Record<PipelineStep, PipelineStepState>>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [feedbackTarget, setFeedbackTarget] = useState<HarmonizationIssue | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    if (!hierarchyId || !queryText.trim()) return;
    setError('');
    setIsRunning(true);
    setPipelineState({});
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await runRealHarmonization(
        hierarchyId,
        queryText.trim(),
        { onStep: (step, state) => setPipelineState((prev) => ({ ...prev, [step]: state })) },
        controller.signal
      );
      setSummary(result);
      onAnalysisUpdated?.(result);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Analisis gagal dijalankan.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const handleSubmitFeedback = async (correctedGroup: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT', reason: string) => {
    if (!feedbackTarget || !summary?.sessionId || feedbackTarget.rank == null) return;
    try {
      await submitHarmonizationFeedback(summary.sessionId, feedbackTarget.rank, correctedGroup, reason);
      const updated: HarmonizationSummary = {
        ...summary,
        issues: summary.issues.map((it) =>
          it.id === feedbackTarget.id ? { ...it, correctedGroup } : it
        ),
      };
      setSummary(updated);
      onAnalysisUpdated?.(updated);
      setFeedbackTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim koreksi.');
    }
  };

  const filteredIssues = useMemo(() => {
    if (!summary) return [];
    if (filterSeverity === 'all') return summary.issues;
    return summary.issues.filter((issue) => issue.severity === filterSeverity);
  }, [summary, filterSeverity]);

  if (!hierarchyId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center space-y-2">
        <Briefcase className="w-9 h-9 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Belum Ada Project Dipilih</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Uji Harmonisasi membandingkan teks ini terhadap dokumen yang sudah diproses dalam satu project.
          Pilih project aktif terlebih dahulu dari menu samping.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (sev: HarmonizationIssue['severity']) => {
    switch (sev) {
      case 'conflict':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> BERTENTANGAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
            CATATAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Query input + run controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">Uji Harmonisasi Regulasi</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Project: <strong className="text-slate-700">{activeProject?.hierarchyName}</strong>
          </span>
        </div>
        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Masukkan teks pasal/perubahan yang ingin diuji keselarasannya..."
          className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono leading-relaxed"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleRun}
              disabled={!queryText.trim()}
              className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Jalankan Uji Harmonisasi</span>
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Batalkan</span>
            </button>
          )}
        </div>
      </div>

      {isRunning && <PipelineProgress state={pipelineState} />}

      {summary && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Skor Keselarasan</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{summary.compatibilityScore}%</div>
                  <div className="text-[11px] mt-0.5">
                    {summary.isSafeToProceed ? (
                      <span className="text-emerald-700 font-semibold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aman Dilanjutkan
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold flex items-center">
                        <AlertOctagon className="w-3 h-3 mr-1" /> Ada Pertentangan
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-xs text-rose-700 font-medium flex items-center">
                  <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Bertentangan
                </div>
                <div className="text-2xl font-black text-rose-900 mt-1">{summary.conflictCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selaras
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-1">{summary.alignedCount ?? 0}</div>
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                Hasil dihasilkan oleh pipeline AI backend (pencarian semantik &rarr; pemeriksaan konteks &rarr;
                klasifikasi hubungan) terhadap seluruh dokumen berstatus siap dalam project ini.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-800">
                  Temuan Pertentangan ({filteredIssues.length})
                </h4>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h5 className="text-sm font-bold text-slate-800">Tidak Ditemukan Pertentangan</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Teks yang diuji selaras dengan seluruh dokumen dalam project ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-4 space-y-4">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="pt-4 first:pt-0">
                    <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(issue.severity)}
                          {issue.similarity != null && (
                            <span className="text-[11px] text-slate-500">
                              Relevansi {(issue.similarity * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {issue.matchedRegulationType} &bull; {issue.matchedRegulationNumber} ({issue.matchedArticle})
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-mono bg-white p-2.5 rounded border border-slate-200 mt-3">
                        &quot;{issue.matchedText}&quot;
                      </p>

                      <div className="mt-3 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80 text-xs text-amber-900">
                        <strong className="font-semibold text-amber-950 block mb-0.5">Alasan AI:</strong>
                        {issue.explanation}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {issue.correctedGroup ? (
                          <span className="text-[11px] text-slate-500 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Dikoreksi menjadi: <strong className="ml-1">{issue.correctedGroup}</strong>
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => setFeedbackTarget(issue)}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 transition"
                        >
                          Koreksi Penilaian AI
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {feedbackTarget && (
        <FeedbackDialog
          issue={feedbackTarget}
          onCancel={() => setFeedbackTarget(null)}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  );
}

function FeedbackDialog({
  issue,
  onCancel,
  onSubmit,
}: {
  issue: HarmonizationIssue;
  onCancel: () => void;
  onSubmit: (group: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT', reason: string) => void;
}) {
  const [group, setGroup] = useState<'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT' | ''>('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Koreksi Penilaian AI</h3>
        <p className="text-xs text-slate-500 line-clamp-3 italic">&quot;{issue.matchedText}&quot;</p>

        <div className="space-y-2">
          {(['SELARAS', 'BERTENTANGAN', 'TIDAK TERKAIT'] as const).map((g) => (
            <label
              key={g}
              className="flex items-center space-x-2.5 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition"
            >
              <input type="radio" name="fbGroup" checked={group === g} onChange={() => setGroup(g)} />
              <span className="text-xs font-semibold text-slate-800">{g}</span>
            </label>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Alasan koreksi (opsional)"
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />

        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
            Batal
          </button>
          <button
            onClick={() => group && onSubmit(group, reason)}
            disabled={!group}
            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
          >
            Kirim Koreksi
          </button>
        </div>
      </div>
    </div>
  );
}
