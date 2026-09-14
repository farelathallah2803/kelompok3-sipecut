import { authFetch } from './api';

export type DocumentStatus = 'draft' | 'pending' | 'processing_l1' | 'processing_embed' | 'ready' | 'error';

export interface ProjectDocument {
  id: number;
  title: string;
  doc_type: string;
  doc_type_display: string;
  status: DocumentStatus;
  status_display: string;
  clause_count: number | null;
  error_message: string;
  original_name: string;
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

export async function createDocument(params: {
  title: string;
  docType: string;
  hierarchyId: string;
  file: File;
}): Promise<ProjectDocument> {
  const form = new FormData();
  form.append('title', params.title);
  form.append('doc_type', params.docType);
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
