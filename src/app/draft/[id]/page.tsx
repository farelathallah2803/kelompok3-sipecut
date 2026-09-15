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
  ShieldCheck,
  Edit3,
  Save,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { 
  PetunjukTeknisDraft, 
  UserRole, 
  DraftChapter, 
  DraftArticle, 
  JuknisDefinitionItem 
} from '@/types';
import { 
  getDraftById, 
  getActiveRole, 
  getStageLabel, 
  saveDraft, 
  canRoleActOnStage, 
  getWorkflowType 
} from '@/lib/storage';
import { ROLE_DEFINITIONS } from '@/components/layout/Navbar';
import { runHarmonizationAnalysis } from '@/lib/harmonizationEngine';
import StageTracker from '@/components/workflow/StageTracker';
import HarmonizationChecker from '@/components/compliance/HarmonizationChecker';
import ApprovalModal from '@/components/workflow/ApprovalModal';

function safeClone<T>(val: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(val);
    } catch {
      // Fallback
    }
  }
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return val;
  }
}

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<PetunjukTeknisDraft | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('drafter');
  const [activeTab, setActiveTab] = useState<'file' | 'compliance' | 'reviews' | 'history'>('file');
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  // In-Place Editing States
  const [isEditingSubstance, setIsEditingSubstance] = useState(false);
  const [editableChapters, setEditableChapters] = useState<DraftChapter[]>([]);
  const [editableDefs, setEditableDefs] = useState<JuknisDefinitionItem[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadDraft = () => {
    if (!draftId) return;
    const found = getDraftById(draftId);
    if (found) {
      setDraft({ ...found });
      setEditableChapters(found.chapters ? safeClone(found.chapters) : []);
      setEditableDefs(found.generalProvisions?.definitions ? safeClone(found.generalProvisions.definitions) : []);
    }
    setActiveRole(getActiveRole());
  };

  useEffect(() => {
    loadDraft();
    window.addEventListener('juknis_storage_updated', loadDraft);
    window.addEventListener('juknis_role_changed', loadDraft);
    return () => {
      window.removeEventListener('juknis_storage_updated', loadDraft);
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
    if (draft.status === 'approved' || draft.currentStage === 'pbi_publish' || draft.currentStage === 'padg_publish' || draft.currentStage === 'juknis_publikasi_dhk' || draft.currentStage === 'ditetapkan') return false;
    return canRoleActOnStage(draft.currentStage, activeRole, draft.workflowType || getWorkflowType(draft));
  };

  const isMatchingRole = canReviewCurrentStage();

  // In-Place Chapter/Article editing handlers
  const handleArticleChange = (chapId: string, artId: string, field: 'title' | 'content' | 'articleNumber', val: string) => {
    setEditableChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.map(art => art.id === artId ? { ...art, [field]: val } : art)
      };
    }));
  };

  const handleChapterTitleChange = (chapId: string, newTitle: string) => {
    setEditableChapters(prev => prev.map(chap => chap.id === chapId ? { ...chap, title: newTitle } : chap));
  };

  const handleAddArticle = (chapId: string) => {
    setEditableChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      const nextNum = chap.articles.length + 1;
      const newArt: DraftArticle = {
        id: `art-${Date.now()}`,
        articleNumber: `Pasal ${nextNum}`,
        title: `Ketentuan Tambahan ${nextNum}`,
        content: 'Rumusan ketentuan atau standar kepatuhan operasional...'
      };
      return {
        ...chap,
        articles: [...chap.articles, newArt]
      };
    }));
  };

  const handleDeleteArticle = (chapId: string, artId: string) => {
    setEditableChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.filter(art => art.id !== artId)
      };
    }));
  };

  const handleAddChapter = () => {
    const nextChapNum = editableChapters.length + 1;
    const newChap: DraftChapter = {
      id: `chap-${Date.now()}`,
      chapterNumber: `BAB ${nextChapNum}`,
      title: `KETENTUAN KHUSUS ${nextChapNum}`,
      articles: [
        {
          id: `art-${Date.now()}-1`,
          articleNumber: `Pasal ${editableChapters.reduce((acc, c) => acc + c.articles.length, 0) + 1}`,
          title: 'Ketentuan Pelaksanaan',
          content: 'Isi ketentuan baru...'
        }
      ]
    };
    setEditableChapters(prev => [...prev, newChap]);
  };

  const handleDefChange = (id: string, field: 'term' | 'meaning', val: string) => {
    setEditableDefs(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const handleAddDef = () => {
    setEditableDefs(prev => [...prev, {
      id: `def-${Date.now()}`,
      term: 'Istilah Baru',
      meaning: 'Pengertian istilah...'
    }]);
  };

  const handleDeleteDef = (id: string) => {
    setEditableDefs(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveSubstanceChanges = () => {
    if (!draft) return;

    // Run Harmonization analysis automatically with updated text
    const updatedDraftWithNewArticles: PetunjukTeknisDraft = {
      ...draft,
      chapters: editableChapters,
      generalProvisions: {
        ...(draft.generalProvisions || {
          background: '',
          legalBases: [],
          purpose: '',
          definitions: [],
          scope: ''
        }),
        definitions: editableDefs
      }
    };

    const newSummary = runHarmonizationAnalysis(updatedDraftWithNewArticles);

    const savedDraft: PetunjukTeknisDraft = {
      ...updatedDraftWithNewArticles,
      complianceSummary: newSummary,
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: draft.proposerName || 'Drafter',
          role: ROLE_DEFINITIONS[activeRole]?.label || 'Drafter',
          action: 'Penyuntingan Substansi Naskah di Website',
          stage: draft.currentStage,
          details: `Memperbarui pasal dan bab naskah juknis (${editableChapters.length} Bab, ${editableChapters.reduce((acc, c) => acc + c.articles.length, 0)} Pasal). Harmonisasi kepatuhan otomatis diperbarui (${newSummary.compatibilityScore}%).`
        },
        ...(draft.history || [])
      ]
    };

    saveDraft(savedDraft);
    setDraft(savedDraft);
    setIsEditingSubstance(false);
    setSaveSuccessMsg('Perubahan naskah berhasil disimpan! Analisis uji harmonisasi telah diperbarui otomatis.');

    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  const handleCancelSubstanceChanges = () => {
    if (draft) {
      setEditableChapters(draft.chapters ? safeClone(draft.chapters) : []);
      setEditableDefs(draft.generalProvisions?.definitions ? safeClone(draft.generalProvisions.definitions) : []);
    }
    setIsEditingSubstance(false);
  };

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

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {draft.scope || 'INTERNAL'}
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
        workflowType={draft.workflowType || getWorkflowType(draft)}
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
          <span>Berkas &amp; Naskah Juknis</span>
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

      {/* TAB CONTENT: 1. BERKAS NASKAH DOKUMEN & IN-PLACE EDITABLE ARTICLES */}
      {activeTab === 'file' && (
        <div className="space-y-6">
          {/* Metadata Card */}
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
                  <div>Format Naskah: <strong className="text-slate-800">{draft.templateType === 'templat_2' ? 'Templat 2 (Manual Operasional)' : draft.templateType === 'templat_3' ? 'Templat 3 (Ketentuan Eksternal)' : 'Templat 1 (Prosedur Kerja)'}</strong></div>
                  <div>Sifat Dokumen: <strong className="text-slate-800">{draft.isConfidential ? 'Rahasia (Internal Satker)' : 'Biasa / Terbuka'}</strong></div>
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

          {/* INTERACTIVE IN-PLACE DOCUMENT SUBSTANCE & ARTICLE EDITOR */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Substansi Naskah &amp; Bedah Dokumen Juknis</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {editableChapters.length} Bab &bull; {editableChapters.reduce((acc, c) => acc + c.articles.length, 0)} Pasal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isEditingSubstance 
                    ? 'Mode Edit Naskah Aktif. Anda dapat menyunting judul, isi pasal, menambah pasal, atau memperbarui definisi.'
                    : 'Substansi materiil rancangan Petunjuk Teknis hasil ekstraksi & telaah resmi. Klik tombol Edit untuk melakukan perubahan.'}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {isEditingSubstance ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelSubstanceChanges}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSubstanceChanges}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSubstance(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Naskah di Website</span>
                  </button>
                )}
              </div>
            </div>

            {/* Definitions Block */}
            {editableDefs.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Definisi &amp; Pengertian Umum ({editableDefs.length})
                  </span>
                  {isEditingSubstance && (
                    <button
                      type="button"
                      onClick={handleAddDef}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Istilah</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {editableDefs.map((def) => (
                    <div key={def.id} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      {isEditingSubstance ? (
                        <>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={def.term}
                              onChange={(e) => handleDefChange(def.id, 'term', e.target.value)}
                              className="text-xs font-bold text-blue-900 border border-slate-200 px-2 py-0.5 rounded w-2/3"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteDef(def.id)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={def.meaning}
                            onChange={(e) => handleDefChange(def.id, 'meaning', e.target.value)}
                            rows={2}
                            className="w-full text-xs text-slate-700 border border-slate-200 p-1.5 rounded mt-1"
                          />
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-xs text-blue-950 block">{def.term}</span>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{def.meaning}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters & Articles List */}
            <div className="space-y-4">
              {editableChapters.map((chap) => (
                <div key={chap.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Chapter Header */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="font-mono text-xs font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                        {chap.chapterNumber}
                      </span>
                      {isEditingSubstance ? (
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleChapterTitleChange(chap.id, e.target.value)}
                          className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 w-2/3 bg-white"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-900">
                          {chap.title}
                        </span>
                      )}
                    </div>

                    {isEditingSubstance && (
                      <button
                        type="button"
                        onClick={() => handleAddArticle(chap.id)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-blue-700 transition flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pasal</span>
                      </button>
                    )}
                  </div>

                  {/* Articles Content */}
                  <div className="p-4 bg-white space-y-3.5">
                    {chap.articles.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        Tidak ada pasal dalam bab ini.
                      </div>
                    ) : (
                      chap.articles.map((art) => (
                        <div key={art.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                          {isEditingSubstance ? (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={art.articleNumber}
                                    onChange={(e) => handleArticleChange(chap.id, art.id, 'articleNumber', e.target.value)}
                                    className="font-mono text-xs font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 w-24 bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={art.title}
                                    onChange={(e) => handleArticleChange(chap.id, art.id, 'title', e.target.value)}
                                    placeholder="Judul Pasal"
                                    className="text-xs font-semibold text-slate-800 border border-slate-300 rounded px-2 py-0.5 flex-1 bg-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArticle(chap.id, art.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Hapus pasal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <textarea
                                value={art.content}
                                onChange={(e) => handleArticleChange(chap.id, art.id, 'content', e.target.value)}
                                rows={3}
                                className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 bg-white font-mono leading-relaxed"
                              />
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {art.articleNumber}
                                </span>
                                <span className="font-bold text-xs text-slate-800">
                                  {art.title}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 font-mono leading-relaxed pl-1 whitespace-pre-wrap">
                                {art.content}
                              </p>
                              {art.explanation && (
                                <div className="text-[11px] text-slate-500 italic pl-1 pt-1 border-t border-slate-100">
                                  Penjelasan: {art.explanation}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {isEditingSubstance && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-bold text-slate-600 hover:text-blue-700 transition flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Bab Baru</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. HARMONIZATION COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div>
          <HarmonizationChecker
            draft={draft}
            onAnalysisUpdated={(newSummary) => {
              const updated = { ...draft, complianceSummary: newSummary };
              saveDraft(updated);
              setDraft(updated);
            }}
          />
        </div>
      )}

      {/* TAB CONTENT: 3. REVIEW NOTES */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Catatan &amp; Opini Telaah Lintas Departemen
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Total: {draft.reviewNotes?.length || 0} catatan
            </span>
          </div>

          {draft.reviewNotes?.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Belum ada catatan telaah untuk naskah ini.
            </div>
          ) : (
            <div className="space-y-4">
              {draft.reviewNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {note.reviewerName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {note.department}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {note.notes}
                  </p>

                  {note.riskAssessment && (
                    <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Asesmen Risiko ({note.riskAssessment.level}):</span>
                      </div>
                      <p className="text-[11px] text-slate-700">{note.riskAssessment.mitigationPlan}</p>
                    </div>
                  )}

                  {note.legalAssessment && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Opini Hukum DHk ({note.legalAssessment.hierarchyStatus}):</span>
                      </div>
                      <p className="text-[11px] text-slate-700">{note.legalAssessment.legalOpinion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. ACTIVITY HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Audit Trail &amp; Riwayat Alur Naskah
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Total: {draft.history?.length || 0} entri
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {draft.history?.map((item) => (
              <div key={item.id} className="relative space-y-1 text-xs">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 shadow-2xs" />
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{item.action}</span>
                  <span className="text-[10px] text-slate-400">
                    &bull; {new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Oleh: <strong>{item.actor}</strong> ({item.role}) &bull; Posisi: <span className="font-semibold text-blue-700">{getStageLabel(item.stage)}</span>
                </div>
                {item.details && (
                  <p className="text-[11px] text-slate-500 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                    {item.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal Dialog */}
      {isApprovalOpen && (
        <ApprovalModal
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          draft={draft}
          activeRole={activeRole}
          onSuccess={(updatedDraft) => {
            setDraft({ ...updatedDraft });
            setIsApprovalOpen(false);
          }}
        />
      )}
    </div>
  );
}
