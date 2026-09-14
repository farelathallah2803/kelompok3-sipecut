import { Membership } from '@/types';
import { authFetch, API_BASE, setToken, getToken } from './api';

const MEMBERSHIPS_KEY = 'sijuknis_memberships';
const ACTIVE_PROJECT_KEY = 'sijuknis_active_project';

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Username atau password salah.');
  }
  const data = await res.json();
  setToken(data.access);
  await fetchMe();
}

export function logout(): void {
  setToken(null);
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MEMBERSHIPS_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
  window.dispatchEvent(new Event('projectSelected'));
  window.dispatchEvent(new Event('juknis_role_changed'));
}

/** GET /auth/me/ — refreshes and caches the logged-in user's project memberships. */
export async function fetchMe(): Promise<{ id: number; username: string; memberships: Membership[] } | null> {
  const res = await authFetch('/auth/me/');
  if (!res.ok) return null;
  const data = await res.json();
  const memberships: Membership[] = (data.memberships || []).map((m: any) => ({
    hierarchyId: String(m.hierarchy_id),
    hierarchyName: m.hierarchy_name,
    role: m.role,
  }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
  }
  return { id: data.id, username: data.username, memberships };
}

export function getMemberships(): Membership[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MEMBERSHIPS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getActiveProject(): Membership | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_PROJECT_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setActiveProject(membership: Membership): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(membership));
  window.dispatchEvent(new CustomEvent('projectSelected', { detail: membership }));
  window.dispatchEvent(new Event('juknis_role_changed'));
}

/** Create a new project (Hierarchy) and self-assign a role on it. */
export async function createProject(name: string, description: string, role = 'drafter'): Promise<Membership> {
  const res = await authFetch('/hierarchies/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.name?.[0] || data.error || 'Gagal membuat project.');
  }
  const hierarchy = await res.json();

  const memRes = await authFetch('/auth/memberships/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hierarchy_id: hierarchy.id, role }),
  });
  if (!memRes.ok) throw new Error('Project dibuat, tetapi gagal menautkan keanggotaan.');
  const membership = await memRes.json();

  const result: Membership = {
    hierarchyId: String(membership.hierarchy_id),
    hierarchyName: membership.hierarchy_name,
    role: membership.role,
  };
  const current = getMemberships();
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify([result, ...current]));
  return result;
}
