import { authFetch } from './api';

const HIERARCHY_KEY = 'dmap_hierarchy_id';
const DEFAULT_HIERARCHY_NAME = 'Workspace Utama';

/**
 * Login is disabled for now, so there's no per-user project scoping — every
 * user shares one workspace (Hierarchy). Picks the first existing hierarchy
 * from the backend, or creates one if none exist yet, and caches the id.
 */
export async function getDefaultHierarchyId(): Promise<string> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(HIERARCHY_KEY);
    if (cached) return cached;
  }

  const res = await authFetch('/hierarchies/?page_size=1');
  if (!res.ok) throw new Error('Gagal memuat workspace.');
  const data = await res.json();

  let id: string;
  if (data.hierarchies && data.hierarchies.length > 0) {
    id = String(data.hierarchies[0].id);
  } else {
    const createRes = await authFetch('/hierarchies/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: DEFAULT_HIERARCHY_NAME, description: 'Workspace dokumen internal.' }),
    });
    if (!createRes.ok) throw new Error('Gagal membuat workspace.');
    const created = await createRes.json();
    id = String(created.id);
  }

  if (typeof window !== 'undefined') localStorage.setItem(HIERARCHY_KEY, id);
  return id;
}
