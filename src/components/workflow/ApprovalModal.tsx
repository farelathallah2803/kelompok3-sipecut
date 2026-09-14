'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  X, 
  Send, 
  ShieldAlert, 
  SearchCheck, 
  Scale, 
  Users,
  Building,
  Landmark,
  Gavel,
  Stamp,
  FileCheck,
  FileText
} from 'lucide-react';
import { 
  PetunjukTeknisDraft, 
  WorkflowStage, 
  WorkflowStatus, 
  UserRole, 
  ReviewNote,
  WorkflowRegulationType 
} from '@/types';
import { 
  updateDraftWorkflow, 
  getStageLabel, 
  getWorkflowType,
  determineNextWorkflowStep 
} from '@/lib/storage';

interface ApprovalModalProps {
  draft: PetunjukTeknisDraft;
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
  onSuccess: (updated: PetunjukTeknisDraft) => void;
}

export default function ApprovalModal({
  draft,
  isOpen,
  onClose,
  activeRole,
  onSuccess
}: ApprovalModalProps) {
  if (!isOpen) return null;

  const workflowType: WorkflowRegulationType = getWorkflowType(draft);

  const [decision, setDecision] = useState<'approve' | 'request_revision' | 'reject'>('approve');
  const [reviewerName, setReviewerName] = useState(() => {
    switch (activeRole) {
      case 'dhuk_legal': return 'Aditya Pratama, S.H., LL.M. (Legal Drafter Senior DHk)';
      case 'kemenkum_kemenkeu': return 'Budi Santoso, S.H. (Kemenkumham) & Tim Fiskal Kemenkeu';
      case 'dmr_reviewer': return 'Irwan Setiadi, CRM (Analis Risiko Utama DMR)';
      case 'dai_auditor': return 'Ratna Kusuma, Ak., CA, CIA (Auditor Madya DAI)';
      case 'dmst_governance': return 'Maya Puspitasari, M.Sc. (Analis Tata Kelola DMST)';
      case 'sekretariat_rdg': return 'Dr. Agus Hariyanto (Sekretariat Dewan Gubernur BI)';
      case 'adg_pembina': return 'Destry Damayanti (Deputi Gubernur Senior / ADG Pembina)';
      case 'gubernur_bi': return 'Perry Warjiyo (Gubernur Bank Indonesia)';
      case 'pimpinan_satker': return 'Dr. Hendra Gunawan, S.E., M.B.A. (Pimpinan Satker)';
      default: return 'Pejabat Penelaah Bank Indonesia';
    }
  });

  const [department, setDepartment] = useState(() => {
    switch (activeRole) {
      case 'dhuk_legal': return 'Departemen Hukum (DHk)';
      case 'kemenkum_kemenkeu': return 'Kementerian Hukum & Kementerian Keuangan RI';
      case 'dmr_reviewer': return 'Departemen Manajemen Risiko (DMR)';
      case 'dai_auditor': return 'Departemen Audit Intern (DAI)';
      case 'dmst_governance': return 'Departemen Manajemen Strategis & Tata Kelola (DMST)';
      case 'sekretariat_rdg': return 'Rapat Dewan Gubernur (RDG)';
      case 'adg_pembina': return 'Dewan Gubernur Bank Indonesia';
      case 'gubernur_bi': return 'Gubernur Bank Indonesia';
      case 'pimpinan_satker': return 'Satuan Kerja Pemrakarsa';
      default: return 'Satker Terkait';
    }
  });

  const [notes, setNotes] = useState('');

  // PBI / PADG specific states
  const [beritaAcaraNumber, setBeritaAcaraNumber] = useState(`BA-HARM/0${new Date().getMonth() + 1}/KUMHAM-KEMENKEU/${new Date().getFullYear()}`);
  const [syncStatus, setSyncStatus] = useState<'Sesuai UU Nasional' | 'Perlu Penyelarasan Fiskal' | 'Harmonis Sempurna'>('Harmonis Sempurna');
  const [harmonisasiNotes, setHarmonisasiNotes] = useState('');

  const [decreeNumber, setDecreeNumber] = useState(`${new Date().getFullYear()}/PBI/GUB/00${new Date().getMonth() + 1}`);
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);

  // Juknis specific states
  const [riskLevel, setRiskLevel] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'>('Sedang');
  const [riskTypes, setRiskTypes] = useState<string[]>(['Risiko Kepatuhan', 'Risiko Operasional']);
  const [mitigationPlan, setMitigationPlan] = useState('');

  const [internalControlRating, setInternalControlRating] = useState<'Memadai' | 'Perlu Perbaikan' | 'Tidak Memadai'>('Memadai');
  const [complianceScore, setComplianceScore] = useState(90);
  const [auditRecs, setAuditRecs] = useState('');

  const [hierarchyStatus, setHierarchyStatus] = useState<'Selaras PBI/PADG' | 'Ada Potensi Benturan' | 'Duplikasi Substansi'>('Selaras PBI/PADG');
  const [legalOpinion, setLegalOpinion] = useState('');

  const [strategicRating, setStrategicRating] = useState<'Sangat Baik' | 'Baik' | 'Perlu Penyesuaian Tata Kelola'>('Sangat Baik');
  const [governanceScore, setGovernanceScore] = useState(92);
  const [dmstNotes, setDmstNotes] = useState('');

  const [rdgResolutionNo, setRdgResolutionNo] = useState(`RDG-BI/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/DEC-01`);
  const [rdgDecisions, setRdgDecisions] = useState('Dewan Gubernur menyetujui substansi regulasi dan mengesahkan untuk dilanjutkan ke tahap persetujuan ADG Pembina.');

  const [adgApprovalStatus, setAdgApprovalStatus] = useState<'Disetujui Penuh' | 'Disetujui Dengan Catatan'>('Disetujui Penuh');

  const determineNextStep = (): { nextStage: WorkflowStage; nextStatus: WorkflowStatus } => {
    return determineNextWorkflowStep(workflowType, draft.currentStage, decision);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      alert('Mohon berikan catatan telaah atau pertimbangan keputusan.');
      return;
    }

    const { nextStage, nextStatus } = determineNextStep();

    const reviewPayload: ReviewNote = {
      id: `rev-${Date.now()}`,
      stage: draft.currentStage,
      reviewerRole: activeRole,
      reviewerName,
      department,
      decision,
      notes,
      createdAt: new Date().toISOString()
    };

    // Stage-specific assessments
    if (draft.currentStage === 'pbi_harmonisasi' || activeRole === 'kemenkum_kemenkeu') {
      reviewPayload.kemenkumKemenkeuAssessment = {
        beritaAcaraNumber,
        syncStatus,
        notes: harmonisasiNotes || 'Hasil harmonisasi menyatakan naskah selaras dengan perundang-undangan nasional dan kaidah fiskal.'
      };
    }

    if (draft.currentStage === 'juknis_reviu_teknis' || activeRole === 'dmr_reviewer') {
      reviewPayload.riskAssessment = {
        level: riskLevel,
        riskTypes,
        mitigationPlan: mitigationPlan || 'Mitigasi berkala melalui evaluasi kuartalan.'
      };
    }

    if (draft.currentStage === 'juknis_reviu_teknis' || activeRole === 'dai_auditor') {
      reviewPayload.auditAssessment = {
        internalControlRating,
        complianceScore,
        auditRecommendations: auditRecs ? [auditRecs] : ['Audit trail sistem otomatis tersimpan minimal 5 tahun.']
      };
    }

    if (draft.currentStage === 'pbi_legal_review' || draft.currentStage === 'padg_legal_review' || draft.currentStage === 'juknis_reviu_teknis' || activeRole === 'dhuk_legal') {
      reviewPayload.legalAssessment = {
        hierarchyStatus,
        legalOpinion: legalOpinion || 'Klausul telah diharmonisasi dengan hierarki peraturan Bank Indonesia.'
      };
    }

    if (draft.currentStage === 'juknis_evaluasi_dmst' || activeRole === 'dmst_governance') {
      reviewPayload.dmstAssessment = {
        strategicAlignmentRating: strategicRating,
        governanceScore,
        recommendations: dmstNotes || 'Telah selaras dengan peta jalan strategis dan kerangka tata kelola Bank Indonesia.'
      };
    }

    if (draft.currentStage === 'juknis_pembahasan_rdg' || activeRole === 'sekretariat_rdg') {
      reviewPayload.rdgAssessment = {
        meetingDate: new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }),
        resolutionNumber: rdgResolutionNo,
        decisions: rdgDecisions
      };
    }

    if (draft.currentStage === 'juknis_persetujuan_adg' || activeRole === 'adg_pembina') {
      reviewPayload.adgApproval = {
        adgName: reviewerName,
        portfolioSector: draft.category,
        approvalStatus: adgApprovalStatus
      };
    }

    if (draft.currentStage === 'pbi_ttd_gub' || draft.currentStage === 'padg_ttd_gub' || activeRole === 'gubernur_bi') {
      reviewPayload.gubernurSignature = {
        signedDate,
        decreeNumber,
        validityNotes: 'Naskah resmi telah ditetapkan dan ditandatangani oleh Gubernur Bank Indonesia.'
      };
    }

    const updated = updateDraftWorkflow(
      draft.id,
      nextStage,
      nextStatus,
      reviewPayload,
      reviewerName,
      department
    );

    if (updated) {
      if (nextStatus === 'approved') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      onSuccess(updated);
      onClose();
    }
  };

  const getStageHeaderInfo = () => {
    switch (draft.currentStage) {
      // PBI
      case 'pbi_legal_review':
        return {
          title: 'Legal Review Peraturan Bank Indonesia (DHk)',
          desc: 'Penelaahan awal landasan kewenangan, asas legal drafting, dan konsistensi regulasi.',
          icon: <Scale className="w-5 h-5 text-emerald-600" />
        };
      case 'pbi_harmonisasi':
        return {
          title: 'Harmonisasi Bersama Kemenkumham & Kemenkeu',
          desc: 'Penyelarasan peraturan dengan ketentuan perundang-undangan nasional dan dampak fiskal.',
          icon: <Building className="w-5 h-5 text-teal-600" />
        };
      case 'pbi_legal_closing':
        return {
          title: 'Legal Closing PBI (Departemen Hukum)',
          desc: 'Penutupan proses penelaahan hukum dan penyesuaian materi masukan kementerian.',
          icon: <FileCheck className="w-5 h-5 text-blue-600" />
        };
      case 'pbi_finalisasi':
        return {
          title: 'Clean / Finalisasi Naskah PBI',
          desc: 'Pembersihan draf dan penyiapan berkas naskah otentik siap tanda tangan.',
          icon: <FileText className="w-5 h-5 text-indigo-600" />
        };
      case 'pbi_ttd_gub':
        return {
          title: 'Penetapan & Tanda Tangan Gubernur Bank Indonesia',
          desc: 'Pengesahan dan penandatanganan resmi Peraturan Bank Indonesia oleh Gubernur.',
          icon: <Stamp className="w-5 h-5 text-amber-600" />
        };
      case 'pbi_publish':
        return {
          title: 'Publikasi Resmi PBI oleh Departemen Hukum',
          desc: 'Pengundangan dalam Lembaran Negara RI dan publikasi di JDIH Bank Indonesia.',
          icon: <Send className="w-5 h-5 text-emerald-600" />
        };

      // PADG
      case 'padg_legal_review':
        return {
          title: 'Legal Review PADG (Departemen Hukum)',
          desc: 'Penelaahan substansi teknis operasional dan keselarasan hierarki PADG.',
          icon: <Scale className="w-5 h-5 text-indigo-600" />
        };
      case 'padg_legal_closing':
        return {
          title: 'Legal Closing PADG (Departemen Hukum)',
          desc: 'Penutupan aspek hukum sebelum finalisasi draf peraturan anggota dewan gubernur.',
          icon: <FileCheck className="w-5 h-5 text-blue-600" />
        };
      case 'padg_finalisasi':
        return {
          title: 'Clean / Finalisasi Naskah PADG',
          desc: 'Pemeriksaan tata naskah akhir dan penyiapan berkas penetapan.',
          icon: <FileText className="w-5 h-5 text-indigo-600" />
        };
      case 'padg_ttd_gub':
        return {
          title: 'Tanda Tangan Gubernur / Penetapan PADG',
          desc: 'Penetapan resmi PADG oleh Gubernur / Dewan Gubernur Bank Indonesia.',
          icon: <Stamp className="w-5 h-5 text-amber-600" />
        };
      case 'padg_publish':
        return {
          title: 'Publikasi Resmi PADG oleh Departemen Hukum',
          desc: 'Pengarsipan dan publikasi resmi pada repositori JDIH Bank Indonesia.',
          icon: <Send className="w-5 h-5 text-emerald-600" />
        };

      // Juknis / Perubahan Peraturan
      case 'juknis_penyusunan':
      case 'unit_kerja':
        return {
          title: 'Pengajuan Rancangan oleh Satuan Kerja Pemrakarsa',
          desc: 'Persetujuan internal satuan kerja pemrakarsa sebelum diajukan ke reviu teknis terpadu.',
          icon: <Users className="w-5 h-5 text-blue-600" />
        };
      case 'juknis_reviu_teknis':
        return {
          title: 'Reviu Teknis Terpadu (DHk, DMR, DAI)',
          desc: 'Penilaian bersama aspek hukum (DHk), profil risiko (DMR), dan pengendalian intern (DAI).',
          icon: <ShieldAlert className="w-5 h-5 text-amber-600" />
        };
      case 'juknis_evaluasi_dmst':
        return {
          title: 'Evaluasi Tata Kelola (Dept. Manajemen Strategis / DMST)',
          desc: 'Evaluasi kepatuhan tata kelola kelembagaan dan keselarasan rencana strategis BI.',
          icon: <Building className="w-5 h-5 text-cyan-600" />
        };
      case 'juknis_pembahasan_rdg':
        return {
          title: 'Pembahasan & Finalisasi di Rapat Dewan Gubernur (RDG)',
          desc: 'Pembahasan tingkat Dewan Gubernur untuk memutuskan persetujuan substansi perubahan.',
          icon: <Landmark className="w-5 h-5 text-purple-600" />
        };
      case 'juknis_persetujuan_adg':
        return {
          title: 'Persetujuan oleh Anggota Dewan Gubernur (ADG) Pembina',
          desc: 'Persetujuan formal oleh ADG yang membawahi Satuan Kerja Pemrakarsa.',
          icon: <Gavel className="w-5 h-5 text-violet-600" />
        };
      case 'juknis_publikasi_dhk':
      case 'ditetapkan':
        return {
          title: 'Publikasi & Pengundangan Resmi oleh Departemen Hukum (DHk)',
          desc: 'Pemberian nomor resmi juknis, registrasi dokumen, dan pengunggahan ke portal BI.',
          icon: <Send className="w-5 h-5 text-emerald-600" />
        };

      default:
        return {
          title: 'Penelaahan Naskah Regulasi',
          desc: 'Evaluasi dan persetujuan naskah peraturan/juknis Bank Indonesia.',
          icon: <FileText className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const headerInfo = getStageHeaderInfo();
  const nextInfo = determineNextStep();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
              {headerInfo.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {headerInfo.title}
              </h3>
              <p className="text-xs text-slate-500">
                {headerInfo.desc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Target Draft Information Ribbon */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Dokumen Regulasi yang Ditelaah:</span>
              <span className="font-bold text-slate-800 text-xs font-mono">{draft.code}</span>
              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{draft.title}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-900">
                {workflowType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Decision Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Keputusan Penelaahan / Approval: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${
                decision === 'approve' 
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={() => setDecision('approve')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Setujui (Lanjut)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Lolos kriteria telaah dan berhak maju ke tahapan selanjutnya.
                  </p>
                </div>
              </label>

              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${
                decision === 'request_revision' 
                  ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-semibold' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="request_revision"
                  checked={decision === 'request_revision'}
                  onChange={() => setDecision('request_revision')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Minta Revisi</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Kembalikan ke Satker Pemrakarsa untuk perbaikan materi/klausul.
                  </p>
                </div>
              </label>

              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${
                decision === 'reject' 
                  ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={() => setDecision('reject')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tolak Naskah</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Tolak rancangan regulasi secara definitif karena tidak layak.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Reviewer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Nama Pejabat Penelaah:
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Satuan Kerja / Institusi:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
                required
              />
            </div>
          </div>

          {/* 1. Specialized Stage: Harmonisasi Kemenkum & Kemenkeu (Khusus PBI) */}
          {(draft.currentStage === 'pbi_harmonisasi' || activeRole === 'kemenkum_kemenkeu') && (
            <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-3">
              <div className="flex items-center space-x-2 text-teal-900 font-bold">
                <Building className="w-4 h-4 text-teal-700" />
                <span>Instrumen Harmonisasi Kementerian Hukum &amp; Kementerian Keuangan:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Berita Acara Harmonisasi:</label>
                  <input
                    type="text"
                    value={beritaAcaraNumber}
                    onChange={(e) => setBeritaAcaraNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-teal-300 bg-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Keselarasan Regulasi Nasional:</label>
                  <select
                    value={syncStatus}
                    onChange={(e) => setSyncStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded border border-teal-300 bg-white text-xs font-semibold"
                  >
                    <option value="Harmonis Sempurna">Harmonis Sempurna (Siap Lanjut)</option>
                    <option value="Sesuai UU Nasional">Sesuai UU Nasional (Ada Catatan)</option>
                    <option value="Perlu Penyelarasan Fiskal">Perlu Penyelarasan Fiskal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Pokok Harmonisasi Bersama:</label>
                <input
                  type="text"
                  value={harmonisasiNotes}
                  onChange={(e) => setHarmonisasiNotes(e.target.value)}
                  placeholder="Klausul telah disesuaikan dengan UU P2SK dan kaidah APBN..."
                  className="w-full px-3 py-1.5 rounded border border-teal-300 bg-white text-xs"
                />
              </div>
            </div>
          )}

          {/* 2. Specialized Stage: Evaluasi Tata Kelola DMST (Khusus Juknis/Perubahan Peraturan) */}
          {(draft.currentStage === 'juknis_evaluasi_dmst' || activeRole === 'dmst_governance') && (
            <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-200 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-900 font-bold">
                <Building className="w-4 h-4 text-cyan-700" />
                <span>Instrumen Evaluasi Tata Kelola (DMST):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Peringkat Keselarasan Strategis:</label>
                  <select
                    value={strategicRating}
                    onChange={(e) => setStrategicRating(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white text-xs font-semibold"
                  >
                    <option value="Sangat Baik">Sangat Baik (Sesuai Renstra BI)</option>
                    <option value="Baik">Baik (Dapat Dilanjutkan)</option>
                    <option value="Perlu Penyesuaian Tata Kelola">Perlu Penyesuaian Tata Kelola</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Skor Kepatuhan Tata Kelola (0-100):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={governanceScore}
                    onChange={(e) => setGovernanceScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rekomendasi Tata Kelola DMST:</label>
                <input
                  type="text"
                  value={dmstNotes}
                  onChange={(e) => setDmstNotes(e.target.value)}
                  placeholder="Rancangan selaras dengan arsitektur tata kelola dan SLA operasional BI..."
                  className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white text-xs"
                />
              </div>
            </div>
          )}

          {/* 3. Specialized Stage: Pembahasan & Finalisasi di RDG */}
          {(draft.currentStage === 'juknis_pembahasan_rdg' || activeRole === 'sekretariat_rdg') && (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold">
                <Landmark className="w-4 h-4 text-purple-700" />
                <span>Hasil Pembahasan &amp; Risalah Keputusan RDG:</span>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nomor Risalah Keputusan RDG:</label>
                <input
                  type="text"
                  value={rdgResolutionNo}
                  onChange={(e) => setRdgResolutionNo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Risalah Keputusan Dewan Gubernur:</label>
                <textarea
                  rows={2}
                  value={rdgDecisions}
                  onChange={(e) => setRdgDecisions(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white text-xs"
                />
              </div>
            </div>
          )}

          {/* 4. Specialized Stage: Persetujuan ADG Pembina */}
          {(draft.currentStage === 'juknis_persetujuan_adg' || activeRole === 'adg_pembina') && (
            <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-200 space-y-3">
              <div className="flex items-center space-x-2 text-violet-900 font-bold">
                <Gavel className="w-4 h-4 text-violet-700" />
                <span>Persetujuan Anggota Dewan Gubernur (ADG) Pembina:</span>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Persetujuan ADG:</label>
                <select
                  value={adgApprovalStatus}
                  onChange={(e) => setAdgApprovalStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded border border-violet-300 bg-white text-xs font-semibold"
                >
                  <option value="Disetujui Penuh">Disetujui Penuh (Siap Diterbitkan)</option>
                  <option value="Disetujui Dengan Catatan">Disetujui Dengan Catatan Operasional</option>
                </select>
              </div>
            </div>
          )}

          {/* 5. Specialized Stage: TTD Gubernur Bank Indonesia (Khusus PBI & PADG) */}
          {(draft.currentStage === 'pbi_ttd_gub' || draft.currentStage === 'padg_ttd_gub' || activeRole === 'gubernur_bi') && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <Stamp className="w-4 h-4 text-amber-700" />
                <span>Penetapan &amp; Pengesahan Tanda Tangan Gubernur BI:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal TTD Gubernur:</label>
                  <input
                    type="date"
                    value={signedDate}
                    onChange={(e) => setSignedDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-amber-300 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Penetapan / Lembaran:</label>
                  <input
                    type="text"
                    value={decreeNumber}
                    onChange={(e) => setDecreeNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-amber-300 bg-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* General Review Notes / Pertimbangan */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Catatan Telaah / Pertimbangan Putusan: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan rekomendasi teknis, catatan harmonisasi, atau dasar pertimbangan persetujuan/pengembalian..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          {/* Next Step Preview Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Implikasi Keputusan:</span>
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span>Tahap Berikutnya:</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  nextInfo.nextStatus === 'approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : nextInfo.nextStatus === 'revision_requested'
                    ? 'bg-amber-100 text-amber-800'
                    : nextInfo.nextStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {getStageLabel(nextInfo.nextStage)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-bold uppercase ${
                nextInfo.nextStatus === 'approved' ? 'text-emerald-700' :
                nextInfo.nextStatus === 'revision_requested' ? 'text-amber-700' :
                nextInfo.nextStatus === 'rejected' ? 'text-rose-700' :
                'text-blue-700'
              }`}>
                Status: {nextInfo.nextStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-white font-bold transition shadow-xs ${
                decision === 'approve' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : decision === 'request_revision'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan &amp; Proses Keputusan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
