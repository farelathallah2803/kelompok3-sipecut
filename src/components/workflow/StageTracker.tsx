'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FileEdit, 
  SearchCheck, 
  PenTool, 
  Scale,
  ShieldAlert,
  ChevronDown, 
  ChevronUp, 
  Layers,
  ArrowRight,
  Users,
  Building,
  Gavel,
  Landmark,
  FileCheck,
  Send,
  Stamp
} from 'lucide-react';
import { WorkflowStage, WorkflowStatus, ReviewNote, WorkflowRegulationType } from '@/types';

interface StageTrackerProps {
  workflowType?: WorkflowRegulationType;
  currentStage: WorkflowStage;
  status: WorkflowStatus;
  officialNumber?: string;
  reviewNotes?: ReviewNote[];
}

interface StepDetail {
  key: WorkflowStage;
  code: string;
  title: string;
  actor: string;
  desc: string;
  icon: React.ReactNode;
}

const PBI_STEPS: StepDetail[] = [
  {
    key: 'pbi_legal_review',
    code: '1',
    title: 'Legal Review',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Penelaahan aspek legal drafting dan keselarasan kewenangan BI',
    icon: <Scale className="w-5 h-5" />
  },
  {
    key: 'pbi_harmonisasi',
    code: '2',
    title: 'Harmonisasi Bersama',
    actor: 'Kemenkum & Kemenkeu',
    desc: 'Harmonisasi eksternal bersama Kemenkumham dan Kementerian Keuangan',
    icon: <Building className="w-5 h-5" />
  },
  {
    key: 'pbi_legal_closing',
    code: '3',
    title: 'Legal Closing',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Penyelarasan hasil harmonisasi dan penutupan pembahasan aspek hukum',
    icon: <FileCheck className="w-5 h-5" />
  },
  {
    key: 'pbi_finalisasi',
    code: '4',
    title: 'Clean / Finalisasi',
    actor: 'Tim Perumus & DHk',
    desc: 'Finalisasi naskah otentik dan pengecekan tata naskah akhir',
    icon: <FileEdit className="w-5 h-5" />
  },
  {
    key: 'pbi_ttd_gub',
    code: '5',
    title: 'TTD Gubernur BI',
    actor: 'Gubernur Bank Indonesia',
    desc: 'Penetapan dan penandatanganan resmi naskah PBI oleh Gubernur',
    icon: <Stamp className="w-5 h-5" />
  },
  {
    key: 'pbi_publish',
    code: '6',
    title: 'DHk Publish',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Pengundangan dan publikasi resmi di JDIH Bank Indonesia',
    icon: <Send className="w-5 h-5" />
  }
];

const PADG_STEPS: StepDetail[] = [
  {
    key: 'padg_legal_review',
    code: '1',
    title: 'Legal Review',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Penelaahan substansi hukum operasional dan hierarki PADG',
    icon: <Scale className="w-5 h-5" />
  },
  {
    key: 'padg_legal_closing',
    code: '2',
    title: 'Legal Closing',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Penutupan aspek hukum dan legal clearance naskah PADG',
    icon: <FileCheck className="w-5 h-5" />
  },
  {
    key: 'padg_finalisasi',
    code: '3',
    title: 'Clean / Finalisasi',
    actor: 'Tim Perumus & DHk',
    desc: 'Pembersihan draf naskah final tanpa catatan revisi',
    icon: <FileEdit className="w-5 h-5" />
  },
  {
    key: 'padg_ttd_gub',
    code: '4',
    title: 'TTD Gubernur / Penetapan',
    actor: 'Gubernur / Dewan Gubernur',
    desc: 'Penandatanganan penetapan PADG oleh Gubernur Bank Indonesia',
    icon: <Stamp className="w-5 h-5" />
  },
  {
    key: 'padg_publish',
    code: '5',
    title: 'DHk Publish',
    actor: 'Departemen Hukum (DHk)',
    desc: 'Penerbitan dan pengarsipan resmi pada repositori JDIH BI',
    icon: <Send className="w-5 h-5" />
  }
];

const JUKNIS_STEPS: StepDetail[] = [
  {
    key: 'juknis_penyusunan',
    code: '1',
    title: 'Penyusunan Satker',
    actor: 'Satker Pemrakarsa',
    desc: 'Penyusunan draft juknis & kelengkapan Lampiran X PADG Intern 66/2025',
    icon: <FileEdit className="w-5 h-5" />
  },
  {
    key: 'juknis_reviu_teknis',
    code: '2',
    title: 'Reviu Teknis Bersama',
    actor: 'DHk, DMR, DAI',
    desc: 'Reviu terpadu aspek Hukum (DHk), Risiko (DMR), dan Audit Intern (DAI)',
    icon: <ShieldAlert className="w-5 h-5" />
  },
  {
    key: 'juknis_evaluasi_dmst',
    code: '3',
    title: 'Evaluasi Tata Kelola',
    actor: 'DMST',
    desc: 'Evaluasi tata kelola & keselarasan rencana strategis oleh Dept. Manajemen Strategis',
    icon: <Building className="w-5 h-5" />
  },
  {
    key: 'juknis_pembahasan_rdg',
    code: '4',
    title: 'Pembahasan di RDG',
    actor: 'Rapat Dewan Gubernur',
    desc: 'Pembahasan kebijakan dalam RDG (auto-disetujui pada simulasi prototype)',
    icon: <Landmark className="w-5 h-5" />
  },
  {
    key: 'juknis_persetujuan_adg',
    code: '5',
    title: 'Persetujuan ADG',
    actor: 'ADG Pembina Satker',
    desc: 'Persetujuan ADG Pembina (auto-disetujui pada simulasi prototype)',
    icon: <Gavel className="w-5 h-5" />
  },
  {
    key: 'juknis_publikasi_dhk',
    code: '6',
    title: 'Publikasi oleh DHk',
    actor: 'Departemen Hukum (Legal DHk)',
    desc: 'Penomoran naskah resmi, registrasi, dan publikasi internal BI oleh Legal DHk',
    icon: <Send className="w-5 h-5" />
  }
];

const LEGACY_STEPS: StepDetail[] = [
  {
    key: 'unit_kerja',
    code: '1',
    title: 'Unit Kerja Pemrakarsa',
    actor: 'Drafter Unit Kerja',
    desc: 'Inisiasi & penyusunan draft juknis',
    icon: <FileEdit className="w-5 h-5" />
  },
  {
    key: 'satuan_kerja',
    code: '2',
    title: 'Satuan Kerja Pemrakarsa',
    actor: 'Pimpinan Satker',
    desc: 'Persetujuan pimpinan satuan kerja',
    icon: <Users className="w-5 h-5" />
  },
  {
    key: 'dmr',
    code: '3',
    title: 'Manajemen Risiko (DMR)',
    actor: 'Reviewer DMR',
    desc: 'Analisis profil risiko & mitigasi',
    icon: <ShieldAlert className="w-5 h-5" />
  },
  {
    key: 'dai',
    code: '4',
    title: 'Audit Intern (DAI)',
    actor: 'Auditor DAI',
    desc: 'Evaluasi pengendalian intern',
    icon: <SearchCheck className="w-5 h-5" />
  },
  {
    key: 'dhuk',
    code: '5',
    title: 'Departemen Hukum (DHUK)',
    actor: 'Legal DHUK',
    desc: 'Harmonisasi hierarki regulasi',
    icon: <Scale className="w-5 h-5" />
  },
  {
    key: 'ditetapkan',
    code: '6',
    title: 'Ditetapkan & Berlaku',
    actor: 'Pemimpin Pemrakarsa',
    desc: 'Pengesahan tanda tangan naskah resmi',
    icon: <PenTool className="w-5 h-5" />
  }
];

export default function StageTracker({ 
  workflowType,
  currentStage, 
  status, 
  officialNumber,
  reviewNotes = [] 
}: StageTrackerProps) {
  const [showNotes, setShowNotes] = useState(false);

  // Determine active workflow
  const detectedType: WorkflowRegulationType = (() => {
    if (workflowType) return workflowType;
    if (typeof currentStage === 'string' && currentStage.startsWith('pbi_')) return 'pbi';
    if (typeof currentStage === 'string' && currentStage.startsWith('padg_')) return 'padg';
    if (typeof currentStage === 'string' && currentStage.startsWith('juknis_')) return 'juknis';
    return 'juknis';
  })();

  const steps = (() => {
    if (detectedType === 'pbi') return PBI_STEPS;
    if (detectedType === 'padg') return PADG_STEPS;
    if (typeof currentStage === 'string' && (
      currentStage === 'unit_kerja' || 
      currentStage === 'satuan_kerja' || 
      currentStage === 'dmr' || 
      currentStage === 'dai' || 
      currentStage === 'dhuk' || 
      currentStage === 'ditetapkan'
    )) {
      return LEGACY_STEPS;
    }
    return JUKNIS_STEPS;
  })();

  const currentIndex = steps.findIndex(s => s.key === currentStage);

  const getWorkflowBadge = () => {
    switch (detectedType) {
      case 'pbi':
        return {
          label: 'Peraturan Bank Indonesia (PBI)',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'padg':
        return {
          label: 'Peraturan Anggota Dewan Gubernur (PADG)',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      case 'juknis':
      default:
        return {
          label: 'Petunjuk Teknis (Juknis)',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const wfInfo = getWorkflowBadge();

  return (
    <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-900">Alur Persetujuan:</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${wfInfo.color}`}>
            {wfInfo.label}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Tahap {currentIndex >= 0 ? currentIndex + 1 : 1} dari {steps.length}
        </div>
      </div>

      {/* Sleek Horizontal Stepper */}
      <div className="relative pt-2 pb-2">
        {/* Connector Line */}
        <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-slate-200 z-0">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ 
              width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' 
            }}
          />
        </div>

        {/* Step Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex > idx || status === 'approved';
            const isCurrent = currentIndex === idx && status !== 'approved';
            const isRevision = isCurrent && status === 'revision_requested';
            const isRejected = isCurrent && status === 'rejected';

            return (
              <div key={step.key} className="flex md:flex-col items-center text-left md:text-center space-x-3 md:space-x-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : isRevision 
                    ? 'bg-amber-500 text-white' 
                    : isRejected 
                    ? 'bg-rose-600 text-white' 
                    : isCurrent 
                    ? 'bg-blue-600 text-white shadow-xs ring-4 ring-blue-100' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isRevision ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isRejected ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="md:mt-2 flex-1 md:flex-initial">
                  <div className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {step.actor}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Notes History Toggle */}
      {reviewNotes.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            <div className="flex items-center space-x-2">
              <span>Catatan Persetujuan &amp; Telaah ({reviewNotes.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk melihat</span>
            </div>
            {showNotes ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {showNotes && (
            <div className="space-y-2.5 max-h-56 overflow-y-auto mt-2.5 pr-1">
              {reviewNotes.map((note, idx) => (
                <div key={note.id || idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-800">{note.reviewerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 font-medium border border-slate-200">
                        {note.department}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      note.decision === 'approve' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : note.decision === 'request_revision'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {note.decision === 'approve' ? 'Disetujui' : note.decision === 'request_revision' ? 'Minta Revisi' : 'Ditolak'}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed italic">
                    &ldquo;{note.notes}&rdquo;
                  </p>

                  {note.kemenkumKemenkeuAssessment && (
                    <div className="text-[11px] bg-teal-50 border border-teal-200 p-2 rounded text-teal-900 mt-1">
                      <span className="font-bold block">Berita Acara Harmonisasi Kemenkum &amp; Kemenkeu:</span>
                      <div>Nomor: <span className="font-mono font-bold">{note.kemenkumKemenkeuAssessment.beritaAcaraNumber}</span> | Status: <span className="font-bold">{note.kemenkumKemenkeuAssessment.syncStatus}</span></div>
                      {note.kemenkumKemenkeuAssessment.notes && <div className="text-[10px] text-teal-700 mt-0.5">{note.kemenkumKemenkeuAssessment.notes}</div>}
                    </div>
                  )}

                  {note.dmstAssessment && (
                    <div className="text-[11px] bg-cyan-50 border border-cyan-200 p-2 rounded text-cyan-900 mt-1">
                      <span className="font-bold block">Hasil Evaluasi Tata Kelola DMST:</span>
                      <div>Rating: <span className="font-bold">{note.dmstAssessment.strategicAlignmentRating}</span> | Skor: <span className="font-mono font-bold">{note.dmstAssessment.governanceScore}/100</span></div>
                      {note.dmstAssessment.recommendations && <div className="text-[10px] text-cyan-700 mt-0.5">{note.dmstAssessment.recommendations}</div>}
                    </div>
                  )}

                  {note.rdgAssessment && (
                    <div className="text-[11px] bg-purple-50 border border-purple-200 p-2 rounded text-purple-900 mt-1">
                      <span className="font-bold block">Risalah Keputusan Rapat Dewan Gubernur (RDG):</span>
                      <div>Tanggal: {note.rdgAssessment.meetingDate} | Nomor Risalah: <span className="font-mono font-bold">{note.rdgAssessment.resolutionNumber}</span></div>
                      {note.rdgAssessment.decisions && <div className="text-[10px] text-purple-700 mt-0.5">{note.rdgAssessment.decisions}</div>}
                    </div>
                  )}

                  {note.adgApproval && (
                    <div className="text-[11px] bg-violet-50 border border-violet-200 p-2 rounded text-violet-900 mt-1">
                      <span className="font-bold block">Lembar Persetujuan ADG Pembina:</span>
                      <div>Pejabat: <span className="font-bold">{note.adgApproval.adgName}</span> ({note.adgApproval.portfolioSector}) | Keputusan: <span className="font-bold text-violet-900">{note.adgApproval.approvalStatus}</span></div>
                    </div>
                  )}

                  {note.gubernurSignature && (
                    <div className="text-[11px] bg-amber-50 border border-amber-200 p-2 rounded text-amber-900 mt-1">
                      <span className="font-bold block">Penetapan &amp; Penandatanganan Gubernur BI:</span>
                      <div>Tanggal TTD: {note.gubernurSignature.signedDate} | SK/Lembaran: <span className="font-mono font-bold">{note.gubernurSignature.decreeNumber}</span></div>
                    </div>
                  )}

                  {note.publicationDetails && (
                    <div className="text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded text-emerald-900 mt-1">
                      <span className="font-bold block">Dokumen Resmi Diundangkan &amp; Dipublikasikan oleh Departemen Hukum (DHk):</span>
                      <div>No. Reg: <span className="font-mono font-bold">{note.publicationDetails.registrationNumber}</span> | Tanggal: <span className="font-bold">{note.publicationDetails.publishedDate}</span></div>
                      {note.publicationDetails.jdihUrl && (
                        <div className="mt-0.5">
                          <a href={note.publicationDetails.jdihUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-mono text-[10px]">
                            {note.publicationDetails.jdihUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {note.riskAssessment && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      Tingkat Risiko: <strong>{note.riskAssessment.level}</strong> | Mitigasi: {note.riskAssessment.mitigationPlan}
                    </div>
                  )}

                  {note.auditAssessment && (
                    <div className="text-[10px] text-rose-800 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                      Pengendalian Intern: <strong>{note.auditAssessment.internalControlRating}</strong> | Skor: {note.auditAssessment.complianceScore}%
                    </div>
                  )}

                  {note.legalAssessment && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      Status Hierarki: <strong>{note.legalAssessment.hierarchyStatus}</strong>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 text-right">
                    {new Date(note.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
