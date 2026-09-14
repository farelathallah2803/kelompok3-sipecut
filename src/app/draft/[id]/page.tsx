'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Scale, 
  History, 
  UserCheck, 
  Send,
  Download,
  ExternalLink,
  BookOpen,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { PetunjukTeknisDraft, UserRole } from '@/types';
import { getActiveRole, getStageLabel, canRoleActOnStage } from '@/lib/storage';
import { getDraft } from '@/lib/draftsApi';
import { ROLE_DEFINITIONS } from '@/components/layout/Navbar';
import StageTracker from '@/components/workflow/StageTracker';
import HarmonizationChecker from '@/components/compliance/HarmonizationChecker';
import ApprovalModal from '@/components/workflow/ApprovalModal';

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<PetunjukTeknisDraft | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('drafter');
  const [activeTab, setActiveTab] = useState<'file' | 'compliance' | 'reviews' | 'history'>('file');
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const loadDraft = () => {
    if (!draftId) return;
    getDraft(draftId)
      .then(setDraft)
      .catch(() => setDraft(null));
    setActiveRole(getActiveRole());
  };

  useEffect(() => {
    loadDraft();
    window.addEventListener('juknis_role_changed', loadDraft);
    return () => {
      window.removeEventListener('juknis_role_changed', loadDraft);
    };
  }, [draftId]);

  if (!draft) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Berkas Regulasi Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Draft dengan kode atau ID &quot;{draftId}&quot; mungkin telah dihapus atau belum tersimpan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  const canReviewCurrentStage = () => {
    if (draft.status === 'approved' || draft.currentStage === 'juknis_publikasi_dhk') return false;
    return canRoleActOnStage(draft.currentStage, activeRole);
  };

  const isMatchingRole = canReviewCurrentStage();

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Rancangan</span>
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {draft.code}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {draft.category}
            </span>
            {draft.isConfidential && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200">
                RAHASIA
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Pembaruan: {new Date(draft.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
          </div>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {draft.title}
          </h1>
          {draft.generalProvisions?.background && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {draft.generalProvisions.background}
            </p>
          )}
        </div>

        {/* Clean Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Satker Pemrakarsa</span>
            <strong className="text-slate-800 font-semibold">{draft.unitKerja}</strong>
            <div className="text-[10px] text-slate-400">PIC: {draft.proposerName}</div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Aturan Acuan (JDIH BI)</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(draft.generalProvisions?.legalBases || []).slice(0, 3).map((base, idx) => (
                <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600">
                  {base}
                </span>
              ))}
              {(draft.generalProvisions?.legalBases || []).length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{(draft.generalProvisions?.legalBases || []).length - 3} lainnya
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Harmonisasi Regulasi</span>
            <div className="mt-0.5">
              {draft.complianceSummary?.conflictCount ? (
                <span className="text-rose-700 font-bold flex items-center text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {draft.complianceSummary.conflictCount} Isu Pertentangan
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Selaras PBI &amp; PADG ({draft.complianceSummary?.compatibilityScore || 100}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Banner for Role-based Review / Approval */}
      {draft.status !== 'approved' && (
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isMatchingRole ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <span>Tahap Aktif:</span>
                <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                  {getStageLabel(draft.currentStage)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMatchingRole 
                  ? `Peran aktif Anda (${ROLE_DEFINITIONS[activeRole]?.label}) berwenang memproses persetujuan.`
                  : `Menunggu telaah dari ${getStageLabel(draft.currentStage)}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsApprovalOpen(true)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 ${
                isMatchingRole 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isMatchingRole ? 'Input Telaah & Keputusan' : 'Proses Approval (Simulasi)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Tracking Stepper */}
      <StageTracker
        currentStage={draft.currentStage}
        status={draft.status}
        reviewNotes={draft.reviewNotes}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'file' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Berkas Naskah</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'compliance' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Uji Harmonisasi</span>
          {draft.complianceSummary?.totalIssues ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              {draft.complianceSummary.totalIssues}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'reviews' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Catatan Telaah ({draft.reviewNotes?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'history' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Alur ({draft.history?.length || 0})</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. BERKAS NASKAH DOKUMEN */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  PDF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {draft.uploadedFile?.name || `${draft.title.slice(0, 50)}.pdf`}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {draft.uploadedFile ? (draft.uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : '2.14 MB'} &bull; Diunggah pada: {new Date(draft.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert(`Mengunduh berkas naskah resmi: ${draft.uploadedFile?.name || draft.title}`)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh Naskah</span>
                </button>
              </div>
            </div>

            {/* Document Details & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5">
                <span className="font-bold text-slate-700 block">Latar Belakang / Catatan Konsiderans:</span>
                <p className="text-slate-600 leading-relaxed">
                  {draft.generalProvisions?.background || draft.foreword || 'Tidak ada catatan pengantar tambahan.'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-2">
                <span className="font-bold text-slate-700 block">Informasi Legalitas &amp; Pengesahan:</span>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div>Satuan Kerja: <strong className="text-slate-800">{draft.unitKerja}</strong></div>
                  <div>Pengusul (PIC): <strong className="text-slate-800">{draft.proposerName}</strong></div>
                  <div>Sifat Dokumen: <strong className="text-slate-800">{draft.isConfidential ? 'Rahasia (Internal Satker)' : 'Biasa / Terbuka'}</strong></div>
                  <div>Kategori Kebijakan: <strong className="text-slate-800">{draft.category}</strong></div>
                </div>
              </div>
            </div>

            {/* Legal bases tags */}
            {draft.generalProvisions?.legalBases && draft.generalProvisions.legalBases.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Dasar Hukum Acuan di JDIH BI:</span>
                <div className="flex flex-wrap gap-1.5">
                  {draft.generalProvisions.legalBases.map((base, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
                      {base}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. HARMONIZATION COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div>
          <HarmonizationChecker
            draft={draft}
            onAnalysisUpdated={(newSummary) => {
              setDraft({ ...draft, complianceSummary: newSummary });
            }}
          />
        </div>
      )}

      {/* TAB CONTENT: 3. UNIFIED REVIEW SHEET */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Lembar Catatan Telaah Terpadu Lintas Departemen
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Ringkasan catatan telaah dari Pimpinan Satker, Departemen Manajemen Risiko (DMR), Departemen Audit Intern (DAI), dan Departemen Hukum (DHUK).
            </p>

            {(!draft.reviewNotes || draft.reviewNotes.length === 0) ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Belum ada catatan telaah yang direkam untuk berkas ini.
              </div>
            ) : (
              <div className="space-y-4">
                {draft.reviewNotes.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center space-x-2">
                          <span>{rev.reviewerName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                            {rev.department}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tahap: {getStageLabel(rev.stage)} &bull; {new Date(rev.createdAt).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div>
                        {rev.decision === 'approve' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui
                          </span>
                        )}
                        {rev.decision === 'request_revision' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Minta Revisi
                          </span>
                        )}
                        {rev.decision === 'reject' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Ditolak
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      <strong>Catatan Disposisi:</strong> {rev.notes}
                    </div>

                    {rev.riskAssessment && (
                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                        <div className="font-bold text-amber-900 flex items-center space-x-1">
                          <ShieldAlert className="w-4 h-4 text-amber-700" />
                          <span>Hasil Penilaian Risiko DMR:</span>
                        </div>
                        <div>Tingkat Risiko Inheren: <strong>{rev.riskAssessment.level}</strong></div>
                        <div>Kategori: {rev.riskAssessment.riskTypes.join(', ')}</div>
                        <div>Rencana Mitigasi: {rev.riskAssessment.mitigationPlan}</div>
                      </div>
                    )}

                    {rev.auditAssessment && (
                      <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1">
                        <div className="font-bold text-purple-900 flex items-center space-x-1">
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span>Hasil Telaah Pengendalian Intern DAI:</span>
                        </div>
                        <div>Peringkat Sistem Pengendalian Intern: <strong>{rev.auditAssessment.internalControlRating}</strong></div>
                        <div>Skor Kepatuhan Tata Kelola: <strong>{rev.auditAssessment.complianceScore}/100</strong></div>
                        <div>Rekomendasi: {rev.auditAssessment.auditRecommendations.join('; ')}</div>
                      </div>
                    )}

                    {rev.legalAssessment && (
                      <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200 text-xs text-rose-950 space-y-1">
                        <div className="font-bold text-rose-900 flex items-center space-x-1">
                          <Scale className="w-4 h-4 text-rose-700" />
                          <span>Hasil Harmonisasi Hukum DHUK:</span>
                        </div>
                        <div>Status Hierarki Norma: <strong>{rev.legalAssessment.hierarchyStatus}</strong></div>
                        <div>Legal Opinion: {rev.legalAssessment.legalOpinion}</div>
                      </div>
                    )}

                    {rev.dmstAssessment && (
                      <div className="bg-cyan-50/70 p-3 rounded-lg border border-cyan-200 text-xs text-cyan-950 space-y-1">
                        <div className="font-bold text-cyan-900">Hasil Evaluasi Tata Kelola DMST:</div>
                        <div>Rating: <strong>{rev.dmstAssessment.strategicAlignmentRating}</strong> | Skor: <strong>{rev.dmstAssessment.governanceScore}/100</strong></div>
                        <div>Rekomendasi: {rev.dmstAssessment.recommendations}</div>
                      </div>
                    )}

                    {rev.rdgAssessment && (
                      <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1">
                        <div className="font-bold text-purple-900">Risalah Keputusan Rapat Dewan Gubernur (RDG):</div>
                        <div>Nomor Risalah: <strong>{rev.rdgAssessment.resolutionNumber}</strong> ({rev.rdgAssessment.meetingDate})</div>
                        <div>Keputusan: {rev.rdgAssessment.decisions}</div>
                      </div>
                    )}

                    {rev.adgApproval && (
                      <div className="bg-violet-50/70 p-3 rounded-lg border border-violet-200 text-xs text-violet-950 space-y-1">
                        <div className="font-bold text-violet-900">Lembar Persetujuan ADG Pembina:</div>
                        <div>Pejabat: <strong>{rev.adgApproval.adgName}</strong> ({rev.adgApproval.portfolioSector}) — {rev.adgApproval.approvalStatus}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. AUDIT TRAIL & HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Rekam Jejak Audit Trail Berkas</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh riwayat aksi, persetujuan, dan perubahan status tercatat secara permanen sesuai standar tata kelola BI.
            </p>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
            {(draft.history || []).map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                <div className="text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{item.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {item.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Oleh <strong>{item.actor}</strong> &bull; {new Date(item.timestamp).toLocaleString('id-ID')}
                  </div>
                  {item.details && (
                    <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal for Decision */}
      {isApprovalOpen && (
        <ApprovalModal
          draft={draft}
          activeRole={activeRole}
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          onSuccess={() => {
            setIsApprovalOpen(false);
            loadDraft();
          }}
        />
      )}
    </div>
  );
}
