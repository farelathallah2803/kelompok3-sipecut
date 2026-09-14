'use client';

import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { PipelineStep, PipelineStepState } from '@/lib/harmonizationApi';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'semantic', label: 'Mencari Penggalan Terkait' },
  { key: 'context', label: 'Memeriksa Kesesuaian Konteks' },
  { key: 'relation', label: 'Mengelompokkan Jenis Hubungan' },
];

interface PipelineProgressProps {
  state: Partial<Record<PipelineStep, PipelineStepState>>;
}

export default function PipelineProgress({ state }: PipelineProgressProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-1.5">
      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-2">
        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span>Analisis sedang berjalan...</span>
      </div>
      {STEPS.map(({ key, label }) => {
        const s = state[key];
        return (
          <div
            key={key}
            className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition ${
              s === 'active' ? 'bg-blue-50' : ''
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                s === 'done'
                  ? 'bg-emerald-100 text-emerald-700'
                  : s === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : s === 'active' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                STEPS.findIndex((st) => st.key === key) + 1
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                s === 'done' ? 'text-emerald-700' : s === 'active' ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
