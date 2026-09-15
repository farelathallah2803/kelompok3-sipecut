import { authFetch } from './api';

export type DocumentStatus =
  | 'draft' | 'pending' | 'processing_l1' | 'processing_embed' | 'ready' | 'error'
  | 'awaiting_judgment' | 'judgment_running'
  | 'approval_1' | 'approval_2' | 'approval_3' | 'approval_4'
  | 'terbit' | 'rejected';

export interface ApprovalRecord {
  stage: number;
  stage_name: string;
  decision: 'approved' | 'rejected';
  notes: string;
  decided_at: string;
}

export type RelationType = 'MENJELASKAN' | 'MENGUBAH' | 'MENCABUT';
export type RelationFlag = 'MENGUBAH' | 'DIUBAH' | 'MENCABUT' | 'DICABUT';
export const DOC_TYPES = ['TECHNICAL', 'PBI', 'PDG', 'PADG', 'PADGI', 'LEGAL'] as const;

export interface DocumentEdge {
  id: number;
  title: string;
  relation_type: RelationType;
  is_placeholder?: boolean;
}

export interface ProjectDocument {
  id: number;
  title: string;
  ai_title: string;
  is_placeholder: boolean;
  doc_type: string;
  doc_type_display: string;
  parent_edges: DocumentEdge[];
  child_edges: DocumentEdge[];
  relation_flags: RelationFlag[];
  status: DocumentStatus;
  status_display: string;
  clause_count: number | null;
  error_message: string;
  original_name: string;
  file_url: string | null;
  comparison_session_id: string | null;
  approvals: ApprovalRecord[];
  created_at: string;
}

export async function listDocuments(hierarchyId: string): Promise<ProjectDocument[]> {
  const res = await authFetch(`/documents/?hierarchy_id=${hierarchyId}&page_size=100`);
  if (!res.ok) throw new Error('Gagal memuat daftar dokumen.');
  const data = await res.json();
  return data.documents || [];
}

export async function getDocument(id: number): Promise<ProjectDocument> {
  const res = await authFetch(`/documents/${id}/`);
  if (!res.ok) throw new Error('Gagal memuat status dokumen.');
  return res.json();
}

/** doc_type dideteksi otomatis oleh backend (Layer 1) — tidak dikirim dari klien. */
export async function createDocument(params: {
  title: string;
  hierarchyId: string;
  file: File;
}): Promise<ProjectDocument> {
  const form = new FormData();
  form.append('title', params.title);
  form.append('hierarchy_id', params.hierarchyId);
  form.append('file', params.file);

  const res = await authFetch('/documents/', { method: 'POST', body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengunggah dokumen.');
  }
  return res.json();
}

export async function reprocessDocument(id: number): Promise<ProjectDocument> {
  const res = await authFetch(`/documents/${id}/reprocess/`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal memproses ulang dokumen.');
  }
  return res.json();
}

/** Koreksi opsional atas klasifikasi AI; edge list mengganti seluruh daftar (replace all). */
export interface ApprovalCorrections {
  ai_title?: string;
  doc_type?: string;
  relation_flags?: RelationFlag[];
  parent_edges?: { doc_id: number; relation_type: RelationType }[];
  child_edges?: { doc_id: number; relation_type: RelationType }[];
}

/** Mock approval — tidak ada pengecekan role/IAM, siapa pun dapat menyetujui tahap saat ini. */
export async function approveDocument(id: number, notes?: string, corrections: ApprovalCorrections = {}): Promise<ProjectDocument> {
  const res = await authFetch(`/documents/${id}/approve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...corrections, notes: notes || '' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyetujui dokumen.');
  }
  return res.json();
}

/** Satu pasangan hasil penilaian AI: klausul induk yang cocok dengan klausul dokumen yang mengubahnya. */
export interface ComparisonPair {
  rank: number;
  similarity: number;
  doc_id: number | null;
  breadcrumb: string;       // breadcrumb klausul INDUK
  text: string;             // teks klausul INDUK
  page_number: number | null;
  relation: string | null;  // breadcrumb klausul dokumen BARU yang memicu pasangan ini
  relation_group: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT' | null;
  relation_reason: string | null;
}

export async function getComparisonPairs(sessionId: string): Promise<ComparisonPair[]> {
  const res = await authFetch(`/search/?session_id=${encodeURIComponent(sessionId)}&page_size=200`);
  if (!res.ok) throw new Error('Gagal memuat hasil perbandingan AI.');
  const data = await res.json();
  return data.results || [];
}

export async function rejectDocument(id: number, notes?: string): Promise<ProjectDocument> {
  const res = await authFetch(`/documents/${id}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || '' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menolak dokumen.');
  }
  return res.json();
}
