import { authFetch } from './api';
import { PetunjukTeknisDraft, ReviewNote, ActivityLogItem, WorkflowStage, UserRole } from '@/types';

function mapReview(r: any): ReviewNote {
  return {
    id: String(r.id),
    stage: r.stage as WorkflowStage,
    reviewerRole: '' as UserRole, // not stored per-note server-side; unused by any renderer today
    reviewerName: r.reviewer?.username || 'Sistem',
    department: r.stage_display,
    decision: r.decision,
    notes: r.notes,
    createdAt: r.created_at,
    ...(r.assessment || {}),
  };
}

function mapActivity(a: any): ActivityLogItem {
  return {
    id: String(a.id),
    timestamp: a.created_at,
    actor: a.actor?.username || 'Sistem',
    role: a.stage_display,
    action: a.action,
    stage: a.stage as WorkflowStage,
    details: a.details,
  };
}

/** Maps the backend's snake_case JuknisDraft payload into the frontend's PetunjukTeknisDraft shape. */
function mapDraft(d: any): PetunjukTeknisDraft {
  return {
    id: String(d.id),
    hierarchyId: String(d.hierarchy_id),
    code: d.code,
    title: d.title,
    workflowType: 'juknis',
    templateType: d.template_type,
    isConfidential: d.is_confidential,
    scope: d.scope,
    rubrikSatker: d.rubrik_satker,
    year: d.year,
    category: d.category,
    unitKerja: d.unit_kerja,
    proposerName: d.proposer?.username || '',
    currentStage: d.current_stage as WorkflowStage,
    status: d.status,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    foreword: d.foreword,
    validation: d.validation,
    revocations: d.revocations || [],
    generalProvisions: d.general_provisions || {},
    chapters: d.chapters || [],
    attachments: d.attachments || [],
    reviewNotes: (d.reviews || []).map(mapReview),
    history: (d.history || []).map(mapActivity),
  };
}

export async function listDrafts(hierarchyId: string): Promise<PetunjukTeknisDraft[]> {
  const res = await authFetch(`/drafts/?hierarchy_id=${hierarchyId}`);
  if (!res.ok) throw new Error('Gagal memuat daftar draft.');
  const data = await res.json();
  return (data.drafts || []).map(mapDraft);
}

export async function getDraft(id: string): Promise<PetunjukTeknisDraft> {
  const res = await authFetch(`/drafts/${id}/`);
  if (!res.ok) throw new Error('Draft tidak ditemukan.');
  return mapDraft(await res.json());
}

export interface CreateDraftPayload {
  hierarchyId: string;
  code: string;
  title: string;
  templateType: string;
  isConfidential: boolean;
  scope: string;
  rubrikSatker: string;
  year: number;
  category: string;
  unitKerja: string;
  foreword?: string;
  generalProvisions: Record<string, unknown>;
  chapters?: unknown[];
}

export async function createDraft(payload: CreateDraftPayload, file?: File | null): Promise<PetunjukTeknisDraft> {
  const res = await authFetch('/drafts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hierarchy_id: payload.hierarchyId,
      code: payload.code,
      title: payload.title,
      template_type: payload.templateType,
      is_confidential: payload.isConfidential,
      scope: payload.scope,
      rubrik_satker: payload.rubrikSatker,
      year: payload.year,
      category: payload.category,
      unit_kerja: payload.unitKerja,
      foreword: payload.foreword || '',
      general_provisions: payload.generalProvisions,
      chapters: payload.chapters || [],
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal membuat draft.');
  }
  let draft = mapDraft(await res.json());

  if (file) {
    const form = new FormData();
    form.append('file', file);
    const fileRes = await authFetch(`/drafts/${draft.id}/file/`, { method: 'PUT', body: form });
    if (fileRes.ok) draft = mapDraft(await fileRes.json());
  }
  return draft;
}

export async function submitReview(
  id: string,
  decision: 'approve' | 'request_revision' | 'reject',
  notes: string,
  assessment?: Record<string, unknown>
): Promise<PetunjukTeknisDraft> {
  const res = await authFetch(`/drafts/${id}/review/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, notes, assessment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengirim keputusan telaah.');
  }
  return mapDraft(await res.json());
}
