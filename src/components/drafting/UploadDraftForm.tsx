'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  Send, 
  AlertCircle,
  FileCheck,
  Building,
  Scale,
  X,
  Sparkles,
  Search,
  Loader2,
  Wand2,
  Edit3,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Info
} from 'lucide-react';
import { 
  PetunjukTeknisDraft, 
  WorkflowRegulationType, 
  UploadedDraftFile, 
  JuknisTemplateType,
  DraftChapter,
  DraftArticle,
  JuknisDefinitionItem 
} from '@/types';
import { saveDraft, getActiveRole } from '@/lib/storage';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';
import { SATUAN_KERJA_LIST, getSatkerByCode } from '@/data/satkerData';

export default function UploadDraftForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [workflowType, setWorkflowType] = useState<WorkflowRegulationType>('juknis');
  const [templateType, setTemplateType] = useState<JuknisTemplateType>('templat_1');
  const [title, setTitle] = useState('');
  const [unitKerja, setUnitKerja] = useState('Departemen Kebijakan Sistem Pembayaran (DKSP)');
  const [rubrikSatker, setRubrikSatker] = useState('DKSP');
  const [category, setCategory] = useState('Sistem Pembayaran');
  const [proposerName, setProposerName] = useState('Ahmad Fauzi');
  const [isConfidential, setIsConfidential] = useState(false);
  const [scope, setScope] = useState<'INTERNAL' | 'EKSTERNAL'>('INTERNAL');
  const [background, setBackground] = useState('');
  
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>([
    'PADG Intern No. 66 Tahun 2025',
    'PBI No. 23/6/PBI/2021',
    'PADG No. 24/1/PADG/2022'
  ]);
  const [searchRegQuery, setSearchRegQuery] = useState('');
  const [isSearchRegOpen, setIsSearchRegOpen] = useState(false);

  // AI Dissection States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [aiDissectionDone, setAiDissectionDone] = useState(false);
  const [parsedDefinitions, setParsedDefinitions] = useState<JuknisDefinitionItem[]>([]);
  const [parsedChapters, setParsedChapters] = useState<DraftChapter[]>([
    {
      id: 'chap-1',
      chapterNumber: 'BAB I',
      title: 'KETENTUAN UMUM & OPERASIONAL',
      articles: [
        {
          id: 'art-1',
          articleNumber: 'Pasal 1',
          title: 'Ketentuan Umum Pelaksanaan',
          content: 'Penyelenggara dan satuan kerja terkait wajib mematuhi seluruh standar teknis dan batas waktu yang ditetapkan oleh Bank Indonesia.',
          explanation: 'Ketentuan materiil pelaksanaan petunjuk teknis.'
        }
      ]
    }
  ]);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'chap-1': true
  });

  const regSuggestions = MOCK_REGULATIONS.filter(reg => 
    !selectedRegulations.includes(reg.number) && 
    (reg.number.toLowerCase().includes(searchRegQuery.toLowerCase()) || 
     reg.title.toLowerCase().includes(searchRegQuery.toLowerCase()))
  );
  
  // File state
  const [uploadedFile, setUploadedFile] = useState<UploadedDraftFile | null>({
    name: 'Rancangan_Regulasi_Draft_Final.pdf',
    size: 2458200,
    type: 'application/pdf',
    uploadedAt: new Date().toISOString()
  });
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const satkerCode = params.get('satker');
      if (satkerCode) {
        const satker = getSatkerByCode(satkerCode);
        if (satker) {
          setUnitKerja(`${satker.name} (${satker.code})`);
          setRubrikSatker(satker.code);
          setCategory(satker.sector);
        }
      }
    }
  }, []);

  const handleSatkerChange = (val: string) => {
    setUnitKerja(val);
    const match = val.match(/\(([A-Z]+)\)/);
    if (match && match[1]) {
      const code = match[1];
      setRubrikSatker(code);
      const satker = getSatkerByCode(code);
      if (satker) {
        setCategory(satker.sector);
      }
    }
  };

  const toggleRegulation = (regNumber: string) => {
    if (selectedRegulations.includes(regNumber)) {
      setSelectedRegulations(selectedRegulations.filter(r => r !== regNumber));
    } else {
      setSelectedRegulations([...selectedRegulations, regNumber]);
    }
  };

  const removeLegalBase = (regNumber: string) => {
    setSelectedRegulations(selectedRegulations.filter(r => r !== regNumber));
  };

  // AI Bedah Dokumen Handler
  const triggerAiDissection = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisStatus('Membaca berkas dokumen...');
    setErrorMsg('');

    try {
      // Read file as base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      setAnalysisStatus('Gemini AI sedang menelaah & membedah pasal, bab, serta definisi...');

      const response = await fetch('/api/parse-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal membedah dokumen dengan AI.');
      }

      const parsed = result.data;

      if (parsed.title) setTitle(parsed.title);
      if (parsed.scope) setScope(parsed.scope);
      if (parsed.templateType) setTemplateType(parsed.templateType);
      if (parsed.background) setBackground(parsed.background);
      if (parsed.category) setCategory(parsed.category);

      if (parsed.rubrikSatker) {
        setRubrikSatker(parsed.rubrikSatker);
        const satker = getSatkerByCode(parsed.rubrikSatker);
        if (satker) {
          setUnitKerja(`${satker.name} (${satker.code})`);
        }
      }

      if (Array.isArray(parsed.legalBases) && parsed.legalBases.length > 0) {
        setSelectedRegulations(Array.from(new Set([...selectedRegulations, ...parsed.legalBases])));
      }

      if (Array.isArray(parsed.definitions) && parsed.definitions.length > 0) {
        setParsedDefinitions(parsed.definitions);
      }

      if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
        setParsedChapters(parsed.chapters);
        // Expand first 2 chapters
        const exp: Record<string, boolean> = {};
        parsed.chapters.forEach((c: DraftChapter, i: number) => {
          exp[c.id] = i < 3;
        });
        setExpandedChapters(exp);
      }

      setAiDissectionDone(true);
      setAnalysisStatus('');
    } catch (err: any) {
      console.error('Error dissecting document with AI:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat membedah dokumen dengan AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString()
      });
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      if (!title) setTitle(`Rancangan ${cleanName}`);

      // Trigger automatic AI parsing
      triggerAiDissection(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString()
      });
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      if (!title) setTitle(`Rancangan ${cleanName}`);

      // Trigger automatic AI parsing
      triggerAiDissection(file);
    }
  };

  // Chapter & Article Manipulation
  const toggleChapterExpand = (chapId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const handleArticleContentChange = (chapId: string, artId: string, newContent: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.map(art => art.id === artId ? { ...art, content: newContent } : art)
      };
    }));
  };

  const handleArticleTitleChange = (chapId: string, artId: string, newTitle: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.map(art => art.id === artId ? { ...art, title: newTitle } : art)
      };
    }));
  };

  const handleAddArticle = (chapId: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      const nextNum = chap.articles.length + 1;
      const newArt: DraftArticle = {
        id: `art-${Date.now()}`,
        articleNumber: `Pasal ${nextNum}`,
        title: `Ketentuan Tambahan ${nextNum}`,
        content: 'Tuliskan rumusan ketentuan atau kewajiban di sini...'
      };
      return {
        ...chap,
        articles: [...chap.articles, newArt]
      };
    }));
  };

  const handleDeleteArticle = (chapId: string, artId: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.filter(art => art.id !== artId)
      };
    }));
  };

  const handleAddDefinition = () => {
    const newDef: JuknisDefinitionItem = {
      id: `def-${Date.now()}`,
      term: 'Istilah Baru',
      meaning: 'Pengertian atau definisi istilah...'
    };
    setParsedDefinitions(prev => [...prev, newDef]);
  };

  const handleUpdateDefinition = (id: string, field: 'term' | 'meaning', val: string) => {
    setParsedDefinitions(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const handleDeleteDefinition = (id: string) => {
    setParsedDefinitions(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul naskah petunjuk teknis wajib diisi.');
      return;
    }
    if (!uploadedFile) {
      setErrorMsg('Silakan unggah berkas naskah rancangan (PDF/DOCX).');
      return;
    }
    if (selectedRegulations.length === 0) {
      setErrorMsg('Mohon pilih minimal satu dasar hukum / aturan acuan.');
      return;
    }

    setIsSubmitting(true);
    const newId = `draft-${Date.now().toString().slice(-4)}`;
    const currentYear = new Date().getFullYear();

    const computedCode = `NOMOR ${Math.floor(Math.random() * 10) + 1}/JUKNIS/${scope}/${rubrikSatker}/${currentYear}`;
    const startStage = 'juknis_penyusunan';

    const newDraft: PetunjukTeknisDraft = {
      id: newId,
      code: computedCode,
      title: title.trim(),
      workflowType: 'juknis',
      templateType,
      isConfidential,
      scope,
      rubrikSatker,
      year: currentYear,
      category,
      unitKerja,
      proposerName,
      currentStage: startStage,
      status: 'in_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedFile,
      generalProvisions: {
        background: background.trim() || `Rancangan petunjuk teknis diajukan oleh ${unitKerja} untuk penetapan dan evaluasi operasional Bank Indonesia.`,
        legalBases: selectedRegulations,
        purpose: `Menetapkan pedoman dan ketentuan pelaksanaan kebijakan sektor ${category}.`,
        definitions: parsedDefinitions,
        scope: `Ruang lingkup ketentuan berlaku bagi entitas terkait di lingkungan Bank Indonesia dan industri mitra.`
      },
      chapters: parsedChapters,
      attachments: [],
      reviewNotes: [
        {
          id: `rev-${Date.now()}`,
          stage: startStage,
          reviewerRole: 'drafter',
          reviewerName: proposerName,
          department: unitKerja,
          decision: 'approve',
          notes: `Berkas naskah '${uploadedFile.name}' berhasil diunggah, dibedah oleh Gemini AI, dan diajukan ke tahapan penelaahan resmi.`,
          createdAt: new Date().toISOString()
        }
      ],
      history: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: proposerName,
          role: 'Drafter Unit Kerja',
          action: 'Pengajuan Berkas Naskah Dibedah AI',
          stage: startStage,
          details: `Mengunggah berkas ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB) dengan ${parsedChapters.length} Bab dan ${parsedChapters.reduce((acc, c) => acc + c.articles.length, 0)} Pasal dibedah AI`
        }
      ],
      complianceSummary: {
        totalIssues: 0,
        conflictCount: 0,
        duplicateCount: 0,
        hierarchyViolations: 0,
        compatibilityScore: 100,
        isSafeToProceed: true,
        issues: []
      }
    };

    saveDraft(newDraft);
    router.push(`/draft/${newId}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Monitoring</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengajuan &amp; Bedah Dokumen Naskah Juknis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah berkas naskah Juknis. Gemini AI akan otomatis membaca, mengekstrak struktur, dan membedah dokumen ke dalam bab serta pasal yang dapat diedit langsung.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Analyzing Status Indicator */}
      {isAnalyzing && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-400 shadow-md space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-950 flex items-center space-x-2">
                <span>Gemini AI Sedang Membedah &amp; Menganalisis Dokumen...</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-900 rounded-full font-bold">
                  Gemini 3.6 Flash
                </span>
              </h4>
              <p className="text-xs text-blue-800 mt-0.5 font-medium">
                {analysisStatus || 'Mengekstrak teks, bab, pasal, dan klasifikasi satker...'}
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* AI Done Success Banner */}
      {aiDissectionDone && !isAnalyzing && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Dokumen Berhasil Dibedah oleh Gemini AI!</span>
              <span className="text-emerald-700 text-[11px]">
                Terdeteksi: <strong>{parsedChapters.length} Bab</strong>, <strong>{parsedChapters.reduce((acc, c) => acc + c.articles.length, 0)} Pasal</strong>, dan <strong>{parsedDefinitions.length} Definisi Istilah</strong>. Anda dapat langsung mengedit teksnya pada formulir dan editor di bawah ini.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-200/80 text-emerald-800 shrink-0">
            Siap Diedit
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload File Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Unggah Berkas Dokumen (PDF / DOCX)
            </div>
            {uploadedFile && !isAnalyzing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Ganti &amp; Bedah Ulang</span>
              </button>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              isDragging 
                ? 'border-blue-500 bg-blue-50/50' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.docx,.doc,.txt" 
              onChange={handleFileSelect}
              className="hidden" 
            />

            <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              Klik untuk memilih berkas atau seret &amp; lepas berkas naskah di sini
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Mendukung: <strong>PDF, DOCX, TXT</strong> &bull; AI akan langsung membedah pasal dan ketentuan secara otomatis
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  PDF
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{uploadedFile.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Berkas aktif dianalisis
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                className="p-1 text-slate-400 hover:text-rose-600 transition"
                title="Hapus berkas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Format Naskah & Alur Persetujuan Juknis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            2. Klasifikasi &amp; Format Naskah Petunjuk Teknis
          </div>

          {/* Lingkup Juknis: Internal vs Eksternal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Lingkup Sasaran Ketentuan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('INTERNAL')}
                className={`p-3.5 rounded-xl border-2 text-left transition ${
                  scope === 'INTERNAL'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Juknis Internal BI</span>
                  {scope === 'INTERNAL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Petunjuk teknis dan prosedur operasional bagi satuan kerja di lingkungan internal Bank Indonesia.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('EKSTERNAL')}
                className={`p-3.5 rounded-xl border-2 text-left transition ${
                  scope === 'EKSTERNAL'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Juknis Eksternal BI</span>
                  {scope === 'EKSTERNAL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Petunjuk teknis pelaksanaan kebijakan bagi industri, penyelenggara sistem pembayaran, atau publik.
                </p>
              </button>
            </div>
          </div>

          {/* Format Templat Juknis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilihan Format Templat Naskah
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTemplateType('templat_1')}
                className={`p-3 rounded-lg border text-left transition ${
                  templateType === 'templat_1'
                    ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-semibold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Templat 1</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Prosedur Kerja &amp; Tupoksi</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('templat_2')}
                className={`p-3 rounded-lg border text-left transition ${
                  templateType === 'templat_2'
                    ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-semibold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Templat 2</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Manual Operasional / Sistem</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('templat_3')}
                className={`p-3 rounded-lg border text-left transition ${
                  templateType === 'templat_3'
                    ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-semibold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Templat 3</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Penjelasan Ketentuan / Industri</div>
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Document Metadata */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            3. Informasi Naskah &amp; Satuan Kerja Pemrakarsa
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Petunjuk Teknis (Juknis) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Petunjuk Teknis Penyelenggaraan Transaksi Pembayaran Lintas Batas..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Kerja Pemrakarsa (33 Satker BI)
                </label>
                <select
                  value={unitKerja}
                  onChange={(e) => handleSatkerChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                >
                  <optgroup label="1. Sektor Moneter (No. 01 - 05)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Moneter').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="2. Sektor Makroprudensial (No. 06 - 09)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Makroprudensial').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="3. Sektor Sistem Pembayaran (No. 10 - 13)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Sistem Pembayaran').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="4. Sektor Pendukung Kebijakan (No. 14 - 19)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Pendukung Kebijakan').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="5. Sektor Pendukung Organisasi (No. 20 - 32)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Pendukung Organisasi').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="6. Jaringan Kantor (No. 33)">
                    {SATUAN_KERJA_LIST.filter(s => s.sector === 'Jaringan Kantor').map(s => (
                      <option key={s.code} value={`${s.name} (${s.code})`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Kebijakan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Sistem Pembayaran">Sistem Pembayaran</option>
                  <option value="Moneter">Moneter</option>
                  <option value="Makroprudensial">Makroprudensial</option>
                  <option value="Pendukung Kebijakan">Pendukung Kebijakan</option>
                  <option value="Pendukung Organisasi">Pendukung Organisasi</option>
                  <option value="Jaringan Kantor">Jaringan Kantor</option>
                  <option value="Manajemen Risiko & Tata Kelola">Manajemen Risiko &amp; Tata Kelola</option>
                  <option value="Layanan Digital & Keamanan Siber">Layanan Digital &amp; Keamanan Siber</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIC / Nama Pengusul (Drafter)
                </label>
                <input
                  type="text"
                  value={proposerName}
                  onChange={(e) => setProposerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-6 pt-5">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Dokumen Rahasia (Internal Satker)</span>
                </label>
              </div>
            </div>

            {/* Dasar Hukum / Aturan Acuan Selection */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  Dasar Hukum / Aturan Acuan (JDIH BI) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedRegulations.length} regulasi terpilih
                </span>
              </div>

              {/* Selected Regulations Badges */}
              {selectedRegulations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-blue-50/50 border border-blue-200">
                  {selectedRegulations.map((reg) => (
                    <span
                      key={reg}
                      className="inline-flex items-center space-x-1.5 bg-white text-blue-900 font-semibold px-2.5 py-1 rounded-md text-xs border border-blue-200 shadow-2xs"
                    >
                      <span>{reg}</span>
                      <button
                        type="button"
                        onClick={() => removeLegalBase(reg)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search bar for legal bases */}
              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchRegQuery}
                    onChange={(e) => {
                      setSearchRegQuery(e.target.value);
                      setIsSearchRegOpen(true);
                    }}
                    onFocus={() => setIsSearchRegOpen(true)}
                    placeholder="Cari dasar hukum acuan (contoh: PBI 23/6, PADG 24/1)..."
                    className="w-full text-xs pl-9 pr-24 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  {searchRegQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedRegulations.includes(searchRegQuery.trim())) {
                          setSelectedRegulations([...selectedRegulations, searchRegQuery.trim()]);
                        }
                        setSearchRegQuery('');
                        setIsSearchRegOpen(false);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition shadow-xs"
                    >
                      + Tambah
                    </button>
                  )}
                </div>

                {isSearchRegOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSearchRegOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 max-h-52 overflow-y-auto">
                      {regSuggestions.length === 0 ? (
                        <div className="px-3.5 py-2 text-xs text-slate-500">
                          Tekan <strong>+ Tambah</strong> untuk menambahkan rujukan kustom: &ldquo;{searchRegQuery}&rdquo;
                        </div>
                      ) : (
                        regSuggestions.slice(0, 8).map((reg) => (
                          <button
                            key={reg.id}
                            type="button"
                            onClick={() => {
                              setSelectedRegulations([...selectedRegulations, reg.number]);
                              setSearchRegQuery('');
                              setIsSearchRegOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-blue-50/70 transition flex items-center justify-between group border-b border-slate-50 last:border-b-0"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                                {reg.number}
                              </span>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{reg.title}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-600 shrink-0">+ Pilih</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Pengantar / Latar Belakang Konsiderans
              </label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
                placeholder="Uraikan latar belakang urgensi pengajuan petunjuk teknis ini..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Step 4: LIVE AI DISSECTION & INTERACTIVE CHAPTER/ARTICLE EDITOR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Bedah Naskah &amp; Editor Substansi Pasal Juknis
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Interaktif &amp; Editable
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Struktur Bab dan Pasal di bawah ini diekstrak otomatis oleh AI dan dapat Anda sunting secara langsung di website.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleAddDefinition}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition"
              >
                + Definisi Istilah
              </button>
            </div>
          </div>

          {/* Definitions Section if any */}
          {parsedDefinitions.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Definisi &amp; Pengertian Umum ({parsedDefinitions.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddDefinition}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  + Tambah
                </button>
              </div>

              <div className="space-y-2">
                {parsedDefinitions.map((def) => (
                  <div key={def.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={def.term}
                        onChange={(e) => handleUpdateDefinition(def.id, 'term', e.target.value)}
                        placeholder="Istilah (contoh: PJP, SNAP, dll)"
                        className="font-bold text-xs text-blue-900 px-2 py-1 border border-slate-200 rounded w-1/3 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteDefinition(def.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Hapus definisi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={def.meaning}
                      onChange={(e) => handleUpdateDefinition(def.id, 'meaning', e.target.value)}
                      placeholder="Pengertian atau definisi istilah..."
                      rows={2}
                      className="w-full text-xs text-slate-700 px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapters & Articles Editor List */}
          <div className="space-y-3">
            {parsedChapters.map((chap) => {
              const isExpanded = expandedChapters[chap.id] ?? true;

              return (
                <div key={chap.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Chapter Header Bar */}
                  <div 
                    onClick={() => toggleChapterExpand(chap.id)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-200 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                        {chap.chapterNumber}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {chap.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({chap.articles.length} Pasal)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddArticle(chap.id);
                        }}
                        className="px-2 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-[10px] font-semibold text-blue-700 transition"
                      >
                        + Tambah Pasal
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Chapter Articles Body */}
                  {isExpanded && (
                    <div className="p-3.5 bg-white space-y-3">
                      {chap.articles.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs">
                          Belum ada pasal dalam bab ini. Klik <strong>+ Tambah Pasal</strong> untuk menambahkan.
                        </div>
                      ) : (
                        chap.articles.map((art) => (
                          <div key={art.id} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 flex-1">
                                <span className="text-xs font-black text-slate-800 shrink-0 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {art.articleNumber}
                                </span>
                                <input
                                  type="text"
                                  value={art.title}
                                  onChange={(e) => handleArticleTitleChange(chap.id, art.id, e.target.value)}
                                  placeholder="Judul / Pokok Pengaturan Pasal"
                                  className="text-xs font-semibold text-slate-800 px-2.5 py-1 rounded border border-slate-200 bg-white flex-1 focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(chap.id, art.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition"
                                title="Hapus pasal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <textarea
                                value={art.content}
                                onChange={(e) => handleArticleContentChange(chap.id, art.id, e.target.value)}
                                rows={3}
                                placeholder="Rumusan substansi pasal..."
                                className="w-full text-xs text-slate-800 p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isAnalyzing}
            className="px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Pengajuan...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Simpan &amp; Ajukan Naskah Juknis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
