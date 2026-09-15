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

export interface ProjectDocument {
  id: number;
  title: string;
  ai_title: string;
  is_placeholder: boolean;
  doc_type: string;
  doc_type_display: string;
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

/** Mock approval — tidak ada pengecekan role/IAM, siapa pun dapat menyetujui tahap saat ini. */
export async function approveDocument(id: number, notes?: string): Promise<ProjectDocument> {
  const res = await authFetch(`/documents/${id}/approve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || '' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyetujui dokumen.');
  }
  return res.json();
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
