'use client';

import React, { useState } from 'react';
import { Briefcase, X, Plus, CheckCircle2 } from 'lucide-react';
import { Membership } from '@/types';
import { createProject, setActiveProject } from '@/lib/auth';

interface ProjectSelectorProps {
  memberships: Membership[];
  activeProjectId?: string;
  onClose?: () => void;
  dismissible: boolean;
}

export default function ProjectSelector({ memberships, activeProjectId, onClose, dismissible }: ProjectSelectorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (m: Membership) => {
    setActiveProject(m);
    onClose?.();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const membership = await createProject(name.trim(), description.trim());
      setActiveProject(membership);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat project.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pilih Project</h2>
              <p className="text-xs text-slate-500">Project menentukan dokumen & role Anda</p>
            </div>
          </div>
          {dismissible && onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
          {memberships.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-400">
              Anda belum menjadi anggota project manapun. Buat satu di bawah.
            </div>
          ) : (
            memberships.map((m) => (
              <button
                key={m.hierarchyId}
                onClick={() => handleSelect(m)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{m.hierarchyName}</div>
                  <div className="text-[11px] text-slate-500">Role: {m.role}</div>
                </div>
                {activeProjectId === m.hierarchyId && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            ))
          )}
        </div>

        <form onSubmit={handleCreate} className="p-5 border-t border-slate-200 bg-slate-50/60 space-y-2.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Atau buat project baru</p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama project*"
            required
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi (opsional)"
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Membuat...' : 'Buat Project'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
