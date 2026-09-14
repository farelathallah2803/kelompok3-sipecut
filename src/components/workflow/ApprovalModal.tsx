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
  Scale,
  Users,
  Building,
  Gavel,
  Landmark,
  FileCheck,
  FileText
} from 'lucide-react';
import { PetunjukTeknisDraft, WorkflowStage, UserRole } from '@/types';
import { submitReview } from '@/lib/draftsApi';

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

  const [decision, setDecision] = useState<'approve' | 'request_revision' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Juknis-specific assessment states (one section shows depending on stage/role)
  const [riskLevel, setRiskLevel] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis'>('Sedang');
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

  const buildAssessment = (): Record<string, unknown> | undefined => {
    if (draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dmr_reviewer') {
      return { riskAssessment: { level: riskLevel, riskTypes: ['Risiko Kepatuhan', 'Risiko Operasional'], mitigationPlan: mitigationPlan || 'Mitigasi berkala melalui evaluasi kuartalan.' } };
    }
    if (draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dai_auditor') {
      return { auditAssessment: { internalControlRating, complianceScore, auditRecommendations: auditRecs ? [auditRecs] : ['Audit trail sistem otomatis tersimpan minimal 5 tahun.'] } };
    }
    if (draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dhuk_legal') {
      return { legalAssessment: { hierarchyStatus, legalOpinion: legalOpinion || 'Klausul telah diharmonisasi dengan hierarki peraturan Bank Indonesia.' } };
    }
    if (draft.currentStage === 'juknis_evaluasi_dmst') {
      return { dmstAssessment: { strategicAlignmentRating: strategicRating, governanceScore, recommendations: dmstNotes || 'Telah selaras dengan peta jalan strategis dan kerangka tata kelola Bank Indonesia.' } };
    }
    if (draft.currentStage === 'juknis_pembahasan_rdg') {
      return { rdgAssessment: { meetingDate: new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }), resolutionNumber: rdgResolutionNo, decisions: rdgDecisions } };
    }
    if (draft.currentStage === 'juknis_persetujuan_adg') {
      return { adgApproval: { adgName: activeRole, portfolioSector: draft.category, approvalStatus: adgApprovalStatus } };
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Mohon berikan catatan telaah atau pertimbangan keputusan.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await submitReview(draft.id, decision, notes, buildAssessment());
      if (updated.status === 'approved') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim keputusan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageHeaderInfo = (): { title: string; desc: string; icon: React.ReactNode } => {
    switch (draft.currentStage as WorkflowStage) {
      case 'juknis_penyusunan':
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
      default:
        return {
          title: 'Penelaahan Naskah Juknis',
          desc: 'Evaluasi dan persetujuan naskah petunjuk teknis Bank Indonesia.',
          icon: <FileText className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const headerInfo = getStageHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
              {headerInfo.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{headerInfo.title}</h3>
              <p className="text-xs text-slate-500">{headerInfo.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Dokumen yang Ditelaah:</span>
              <span className="font-bold text-slate-800 text-xs font-mono">{draft.code}</span>
              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{draft.title}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-900">
              Peran Anda: {activeRole}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Keputusan Penelaahan / Approval: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${decision === 'approve' ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                <input type="radio" name="decision" value="approve" checked={decision === 'approve'} onChange={() => setDecision('approve')} className="mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Setujui (Lanjut)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Lolos kriteria telaah dan berhak maju ke tahapan selanjutnya.</p>
                </div>
              </label>
              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${decision === 'request_revision' ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                <input type="radio" name="decision" value="request_revision" checked={decision === 'request_revision'} onChange={() => setDecision('request_revision')} className="mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Minta Revisi</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Kembalikan ke Satker Pemrakarsa untuk perbaikan materi/klausul.</p>
                </div>
              </label>
              <label className={`flex items-start space-x-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${decision === 'reject' ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                <input type="radio" name="decision" value="reject" checked={decision === 'reject'} onChange={() => setDecision('reject')} className="mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tolak Naskah</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Tolak rancangan regulasi secara definitif karena tidak layak.</p>
                </div>
              </label>
            </div>
          </div>

          {draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dmr_reviewer' && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Penilaian Risiko (DMR):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tingkat Risiko:</label>
                  <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as any)} className="w-full px-3 py-1.5 rounded border border-amber-300 bg-white text-xs font-semibold">
                    <option>Rendah</option><option>Sedang</option><option>Tinggi</option><option>Kritis</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rencana Mitigasi:</label>
                <input type="text" value={mitigationPlan} onChange={(e) => setMitigationPlan(e.target.value)} className="w-full px-3 py-1.5 rounded border border-amber-300 bg-white text-xs" />
              </div>
            </div>
          )}

          {draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dai_auditor' && (
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center space-x-2 text-rose-900 font-bold">
                <FileCheck className="w-4 h-4 text-rose-700" />
                <span>Penilaian Pengendalian Intern (DAI):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Peringkat Pengendalian:</label>
                  <select value={internalControlRating} onChange={(e) => setInternalControlRating(e.target.value as any)} className="w-full px-3 py-1.5 rounded border border-rose-300 bg-white text-xs font-semibold">
                    <option>Memadai</option><option>Perlu Perbaikan</option><option>Tidak Memadai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Skor Kepatuhan (0-100):</label>
                  <input type="number" min="0" max="100" value={complianceScore} onChange={(e) => setComplianceScore(Number(e.target.value))} className="w-full px-3 py-1.5 rounded border border-rose-300 bg-white font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rekomendasi Audit:</label>
                <input type="text" value={auditRecs} onChange={(e) => setAuditRecs(e.target.value)} className="w-full px-3 py-1.5 rounded border border-rose-300 bg-white text-xs" />
              </div>
            </div>
          )}

          {draft.currentStage === 'juknis_reviu_teknis' && activeRole === 'dhuk_legal' && (
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>Penilaian Hukum (DHk):</span>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Hierarki Norma:</label>
                <select value={hierarchyStatus} onChange={(e) => setHierarchyStatus(e.target.value as any)} className="w-full px-3 py-1.5 rounded border border-emerald-300 bg-white text-xs font-semibold">
                  <option>Selaras PBI/PADG</option><option>Ada Potensi Benturan</option><option>Duplikasi Substansi</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Legal Opinion:</label>
                <input type="text" value={legalOpinion} onChange={(e) => setLegalOpinion(e.target.value)} className="w-full px-3 py-1.5 rounded border border-emerald-300 bg-white text-xs" />
              </div>
            </div>
          )}

          {draft.currentStage === 'juknis_evaluasi_dmst' && (
            <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-200 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-900 font-bold">
                <Building className="w-4 h-4 text-cyan-700" />
                <span>Instrumen Evaluasi Tata Kelola (DMST):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Peringkat Keselarasan Strategis:</label>
                  <select value={strategicRating} onChange={(e) => setStrategicRating(e.target.value as any)} className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white text-xs font-semibold">
                    <option>Sangat Baik</option><option>Baik</option><option>Perlu Penyesuaian Tata Kelola</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Skor Tata Kelola (0-100):</label>
                  <input type="number" min="0" max="100" value={governanceScore} onChange={(e) => setGovernanceScore(Number(e.target.value))} className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rekomendasi DMST:</label>
                <input type="text" value={dmstNotes} onChange={(e) => setDmstNotes(e.target.value)} className="w-full px-3 py-1.5 rounded border border-cyan-300 bg-white text-xs" />
              </div>
            </div>
          )}

          {draft.currentStage === 'juknis_pembahasan_rdg' && (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold">
                <Landmark className="w-4 h-4 text-purple-700" />
                <span>Risalah Keputusan RDG:</span>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nomor Risalah:</label>
                <input type="text" value={rdgResolutionNo} onChange={(e) => setRdgResolutionNo(e.target.value)} className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white font-mono text-xs" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Risalah Keputusan:</label>
                <textarea rows={2} value={rdgDecisions} onChange={(e) => setRdgDecisions(e.target.value)} className="w-full px-3 py-1.5 rounded border border-purple-300 bg-white text-xs" />
              </div>
            </div>
          )}

          {draft.currentStage === 'juknis_persetujuan_adg' && (
            <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-200 space-y-3">
              <div className="flex items-center space-x-2 text-violet-900 font-bold">
                <Gavel className="w-4 h-4 text-violet-700" />
                <span>Persetujuan ADG Pembina:</span>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Persetujuan:</label>
                <select value={adgApprovalStatus} onChange={(e) => setAdgApprovalStatus(e.target.value as any)} className="w-full px-3 py-1.5 rounded border border-violet-300 bg-white text-xs font-semibold">
                  <option>Disetujui Penuh</option><option>Disetujui Dengan Catatan</option>
                </select>
              </div>
            </div>
          )}

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

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-white font-bold transition shadow-xs disabled:opacity-50 ${
                decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : decision === 'request_revision' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Simpan & Proses Keputusan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
