'use client';

import React, { useState } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { createDocument, ProjectDocument } from '@/lib/documentsApi';

const DOC_TYPES = [
  { value: 'PBI', label: 'PBI' },
  { value: 'PDG', label: 'PDG' },
  { value: 'PADG', label: 'PADG' },
  { value: 'PADGI', label: 'PADGI' },
  { value: 'TECHNICAL', label: 'Petunjuk Teknis' },
];

interface UploadDocumentModalProps {
  hierarchyId: string;
  onClose: () => void;
  onUploaded: (doc: ProjectDocument) => void;
}

export default function UploadDocumentModal({ hierarchyId, onClose, onUploaded }: UploadDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !docType || !file) {
      setError('Nama dokumen, tipe, dan file PDF wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const doc = await createDocument({ title: title.trim(), docType, hierarchyId, file });
      onUploaded(doc);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah dokumen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Unggah Dokumen</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Dokumen *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: PADG No.1 Tahun 2026"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Dokumen *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="" disabled>Pilih tipe...</option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">File PDF *</label>
            <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-slate-300 rounded-lg py-4 cursor-pointer hover:border-blue-400 hover:bg-slate-50/50 transition">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-600">{file ? file.name : 'Pilih file PDF'}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Mengunggah...' : 'Unggah & Proses'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
