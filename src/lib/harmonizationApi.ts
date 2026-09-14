import { authFetch, streamSSE } from './api';
import { HarmonizationIssue, HarmonizationSummary } from '@/types';

export type PipelineStep = 'semantic' | 'context' | 'relation';
export type PipelineStepState = 'active' | 'done';

interface RunOptions {
  documentIds?: string[];
  threshold?: number;
  onStep?: (step: PipelineStep, state: PipelineStepState) => void;
}

function cleanSource(src: string): string {
  // Strip leading hex hash + underscore: "abc123_filename.pdf" -> "filename.pdf"
  return (src || '').replace(/^[0-9a-f]{8,}_/i, '');
}

function mapResultsToSummary(items: any[], sessionId: string): HarmonizationSummary {
  const issues: HarmonizationIssue[] = [];
  let conflictCount = 0;
  let alignedCount = 0;

  for (const item of items) {
    const group = item.relation_group;
    if (group === 'SELARAS') {
      alignedCount++;
      continue;
    }
    if (!group || group === 'TIDAK TERKAIT') continue;

    // BERTENTANGAN — the only group the real classifier flags as a genuine issue.
    conflictCount++;
    issues.push({
      id: `real-${sessionId}-${item.rank}`,
      severity: 'conflict',
      draftArticle: 'Teks yang Diuji',
      draftText: '',
      matchedRegulationType: item.doc_type || '—',
      matchedRegulationNumber: cleanSource(item.source) || '—',
      matchedArticle: item.breadcrumb || (item.page_number ? `Halaman ${item.page_number}` : '—'),
      matchedText: item.text,
      explanation: item.relation_reason || 'Model AI menilai penggalan ini bertentangan dengan teks yang diuji.',
      recommendation: 'Tinjau ulang redaksi agar selaras dengan ketentuan acuan ini.',
      rank: item.rank,
      similarity: item.similarity,
      relationGroup: group,
    });
  }

  const analyzed = conflictCount + alignedCount;
  const compatibilityScore = analyzed > 0 ? Math.round((alignedCount / analyzed) * 100) : 100;

  return {
    totalIssues: issues.length,
    conflictCount,
    duplicateCount: 0,
    hierarchyViolations: 0,
    compatibilityScore,
    isSafeToProceed: conflictCount === 0,
    issues,
    mode: 'real',
    sessionId,
    alignedCount,
  };
}

/**
 * Runs the real backend harmonization check (mode EVALUASI) against one project's
 * corpus. Direct port of silebah's jalankanAnalisis()/finishAnalysis() logic
 * (frontend/templates/analisis.html), rendered with sijuknis's card-based UI instead.
 */
export function runRealHarmonization(
  hierarchyId: string,
  queryText: string,
  opts: RunOptions = {},
  signal?: AbortSignal
): Promise<HarmonizationSummary> {
  const params = new URLSearchParams({
    q: queryText,
    hierarchy_id: hierarchyId,
    mode: 'EVALUASI',
    page_size: '50',
  });
  if (opts.threshold != null) params.set('threshold', String(opts.threshold));
  if (opts.documentIds?.length) params.set('document_ids', opts.documentIds.join(','));

  let sessionId = '';

  return new Promise((resolve, reject) => {
    streamSSE(
      `/search/?${params.toString()}`,
      {
        onStart: (data) => {
          sessionId = data.search_id || data.session_id || '';
        },
        onLog: (data) => {
          const ev = data.event;
          if (ev === 'semantic_search_start') opts.onStep?.('semantic', 'active');
          else if (ev === 'semantic_search_end') opts.onStep?.('semantic', 'done');
          else if (ev === 'context_filter_start') opts.onStep?.('context', 'active');
          else if (ev === 'context_filter_end') opts.onStep?.('context', 'done');
          else if (ev === 'relationship_filter_start') opts.onStep?.('relation', 'active');
          else if (ev === 'relationship_filter_end') opts.onStep?.('relation', 'done');
        },
        onResult: (data) => {
          resolve(mapResultsToSummary(data.results || [], sessionId));
        },
        onCancel: () => reject(new Error('Analisis dibatalkan.')),
        onError: (msg) => reject(new Error(msg)),
      },
      signal
    ).catch(reject);
  });
}

/** Same contract silebah already uses: POST /search/{session_id}/feedback/. */
export async function submitHarmonizationFeedback(
  sessionId: string,
  rank: number,
  correctedGroup: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT',
  reason?: string
): Promise<void> {
  const res = await authFetch(`/search/${sessionId}/feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rank, corrected_group: correctedGroup, corrected_reason: reason || undefined }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengirim koreksi.');
  }
}
