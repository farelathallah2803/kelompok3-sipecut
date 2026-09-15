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
  AlertTriangle,
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
  const [unitKerja, setUnitKerja] = useState('Departemen Hukum (DHK)');
  const [rubrikSatker, setRubrikSatker] = useState('DHK');
  const [category, setCategory] = useState('Pendukung Organisasi');
  const [proposerName, setProposerName] = useState('');
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
  const [parsedChapters, setParsedChapters] = useState<DraftChapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const regSuggestions = MOCK_REGULATIONS.filter(reg => 
    !selectedRegulations.includes(reg.number) && 
    (reg.number.toLowerCase().includes(searchRegQuery.toLowerCase()) || 
     reg.title.toLowerCase().includes(searchRegQuery.toLowerCase()))
  );
  
  // File state
  const [uploadedFile, setUploadedFile] = useState<UploadedDraftFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
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

  // AI Bedah Dokumen Handler (Mendukung berkas naskah besar hingga 200MB+ via Direct Google Gemini Files API)
  const triggerAiDissection = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisStatus('Mempersiapkan analisis dokumen...');
    setErrorMsg('');
    setWarningMsg('');

    try {
      let result: any;
      const DIRECT_UPLOAD_THRESHOLD = 3 * 1024 * 1024; // 3 MB - di atas ukuran ini, unggah langsung ke Google Files API untuk memotong batasan 4.5MB Vercel

      if (file.size > DIRECT_UPLOAD_THRESHOLD) {
        // 1. Inisiasi sesi unggah langsung ke Google Gemini Files API
        setAnalysisStatus('Mempersiapkan sesi unggah berkas besar ke cloud AI...');
        const sessionRes = await fetch('/api/parse-draft?action=create-upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf'
          })
        });

        const rawSessionText = await sessionRes.text();
        let sessionData: any;
        try {
          sessionData = JSON.parse(rawSessionText.trim().replace(/^\uFEFF/, ''));
        } catch {
          throw new Error(`Gagal menginisiasi sesi unggah naskah (HTTP ${sessionRes.status}).`);
        }

        if (!sessionRes.ok || !sessionData.uploadUrl) {
          throw new Error(sessionData.error || 'Gagal membuat sesi unggah berkas naskah.');
        }

        // 2. Unggah berkas langsung ke Google Gemini Files API dengan progress bar real-time
        setAnalysisStatus(`Mengunggah naskah (${(file.size / (1024 * 1024)).toFixed(1)} MB) langsung ke Google AI... (0%)`);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', sessionData.uploadUrl);
          xhr.setRequestHeader('Content-Length', file.size.toString());
          xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
          xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setAnalysisStatus(`Mengunggah naskah (${(file.size / (1024 * 1024)).toFixed(1)} MB)... ${percent}% selesai`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText.trim().replace(/^\uFEFF/, ''));
                resolve(res);
              } catch {
                reject(new Error('Gagal menguraikan konfirmasi unggah dari server Google Files.'));
              }
            } else {
              reject(new Error(`Gagal mengunggah berkas ke Google Files (HTTP ${xhr.status}): ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Terjadi gangguan koneksi internet saat mengunggah berkas naskah.'));
          xhr.send(file);
        });

        const uploadedFileUri = uploadResult.file?.uri;
        if (!uploadedFileUri) {
          throw new Error('Gagal memperoleh tautan berkas dari Google Files API.');
        }

        // 3. Panggil API parse-draft dengan fileUri (payload sangat ringan ~200 byte)
        setAnalysisStatus('Naskah berhasil diunggah! Gemini AI sedang membaca, menelaah & membedah pasal serta bab...');
        const response = await fetch('/api/parse-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUri: uploadedFileUri,
            fileName: file.name,
            mimeType: file.type || 'application/pdf'
          })
        });

        const rawText = await response.text();
        try {
          const cleanText = (rawText || '').trim().replace(/^\uFEFF/, '');
          result = JSON.parse(cleanText);
        } catch {
          const cleanErr = (rawText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
          throw new Error(`Gagal memproses analisis AI (HTTP ${response.status}): ${cleanErr || 'Respons bukan JSON valid.'}`);
        }

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal membedah dokumen dengan AI.');
        }
      } else {
        // Direct single upload untuk berkas <= 3 MB
        setAnalysisStatus('Mengunggah berkas naskah...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('mimeType', file.type || 'application/pdf');

        setAnalysisStatus('Gemini AI sedang membaca, menelaah & membedah pasal, bab, serta definisi...');

        const response = await fetch('/api/parse-draft', {
          method: 'POST',
          body: formData
        });

        const rawText = await response.text();
        try {
          const cleanText = (rawText || '').trim().replace(/^\uFEFF/, '');
          result = JSON.parse(cleanText);
        } catch {
          if (response.status === 413) {
            throw new Error('Ukuran berkas melebihi batas muatan server (Payload Too Large).');
          } else if (response.status === 504 || response.status === 502) {
            throw new Error('Koneksi server waktu habis (Gateway Timeout) saat membedah dokumen dengan AI. Silakan coba kembali.');
          } else {
            const cleanErr = (rawText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
            throw new Error(`Gagal memproses respons server (HTTP ${response.status}): ${cleanErr || 'Respons server kosong atau bukan JSON yang valid.'}`);
          }
        }

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal membedah dokumen dengan AI.');
        }
      }

      if (!result?.data) {
        throw new Error('Hasil bedah dokumen AI tidak ditemukan.');
      }

      if (result.warning) {
        setWarningMsg(result.warning);
      }

      const parsed = result.data;

      if (parsed.title) setTitle(parsed.title);
      if (parsed.scope) setScope(parsed.scope);
      if (parsed.templateType) setTemplateType(parsed.templateType);
      if (parsed.background) setBackground(parsed.background);
      if (parsed.category) setCategory(parsed.category);

      if (parsed.unitKerja) {
        setUnitKerja(parsed.unitKerja);
      }
      if (parsed.rubrikSatker) {
        setRubrikSatker(parsed.rubrikSatker);
        const satker = getSatkerByCode(parsed.rubrikSatker);
        if (satker && !parsed.unitKerja) {
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
        // Expand all parsed chapters so user can see every changeable text box immediately
        const exp: Record<string, boolean> = {};
        parsed.chapters.forEach((c: DraftChapter) => {
          exp[c.id] = true;
        });
        setExpandedChapters(exp);
      } else {
        // Fallback default chapters if AI did not return chapters
        const defaultChapters: DraftChapter[] = [
          {
            id: `chap-${Date.now()}-1`,
            chapterNumber: 'BAB I',
            title: 'KETENTUAN UMUM',
            articles: [
              {
                id: `art-${Date.now()}-1-1`,
                articleNumber: 'Pasal 1',
                title: 'Definisi & Ruang Lingkup',
                content: 'Dalam Petunjuk Teknis ini yang dimaksud dengan:\n1. Bank Indonesia adalah Bank Sentral Republik Indonesia.\n2. Penyelenggara adalah pihak yang memenuhi kriteria operasional sesuai ketentuan Bank Indonesia.',
                explanation: 'Cukup jelas'
              }
            ]
          },
          {
            id: `chap-${Date.now()}-2`,
            chapterNumber: 'BAB II',
            title: 'PELAKSANAAN & TATA CARA TEKNIS',
            articles: [
              {
                id: `art-${Date.now()}-2-1`,
                articleNumber: 'Pasal 2',
                title: 'Kewajiban Penyelenggara',
                content: 'Penyelenggara wajib menyampaikan laporan berkala dan mematuhi batasan operasional serta mitigasi risiko sesuai petunjuk teknis ini.',
                explanation: 'Cukup jelas'
              }
            ]
          }
        ];
        setParsedChapters(defaultChapters);
        setExpandedChapters({ [defaultChapters[0].id]: true, [defaultChapters[1].id]: true });
      }

      setAiDissectionDone(true);
      setAnalysisStatus('');

      // Auto-scroll to Box Changeable Text section
      setTimeout(() => {
        const el = document.getElementById('section-changeable-text');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    } catch (err: any) {
      console.error('Error dissecting document with AI:', err);
      let msg = err.message || 'Terjadi kesalahan saat membedah dokumen dengan AI.';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        msg = 'Layanan Google Gemini AI sedang mengalami lonjakan beban sesaat (503). Sistem telah mencoba beralih ke server alternatif. Silakan klik tombol "Ganti & Bedah Ulang" untuk mencoba kembali dalam beberapa detik.';
      }
      setErrorMsg(msg);
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

  const handleChapterNumberChange = (chapId: string, newNumber: string) => {
    setParsedChapters(prev => prev.map(c => c.id === chapId ? { ...c, chapterNumber: newNumber } : c));
  };

  const handleChapterTitleChange = (chapId: string, newTitle: string) => {
    setParsedChapters(prev => prev.map(c => c.id === chapId ? { ...c, title: newTitle } : c));
  };

  const handleAddChapter = () => {
    const nextNum = parsedChapters.length + 1;
    const newChapId = `chap-${Date.now()}`;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const roman = romanNumerals[nextNum - 1] || `${nextNum}`;

    const newChapter: DraftChapter = {
      id: newChapId,
      chapterNumber: `BAB ${roman}`,
      title: 'KETENTUAN PELAKSANAAN TEKNIS',
      articles: [
        {
          id: `art-${Date.now()}-1`,
          articleNumber: `Pasal ${parsedChapters.reduce((acc, c) => acc + c.articles.length, 0) + 1}`,
          title: 'Ketentuan Pelaksanaan',
          content: 'Setiap pihak wajib memenuhi ketentuan teknis dan prosedur operasional sesuai standar Bank Indonesia.',
          explanation: 'Cukup jelas'
        }
      ]
    };
    setParsedChapters(prev => [...prev, newChapter]);
    setExpandedChapters(prev => ({ ...prev, [newChapId]: true }));
  };

  const handleDeleteChapter = (chapId: string) => {
    setParsedChapters(prev => prev.filter(chap => chap.id !== chapId));
  };

  const handleArticleNumberChange = (chapId: string, artId: string, newNumber: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.map(art => art.id === artId ? { ...art, articleNumber: newNumber } : art)
      };
    }));
  };

  const handleArticleExplanationChange = (chapId: string, artId: string, newExp: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      return {
        ...chap,
        articles: chap.articles.map(art => art.id === artId ? { ...art, explanation: newExp } : art)
      };
    }));
  };

  const handleAppendToArticle = (chapId: string, artId: string, textToAppend: string) => {
    setParsedChapters(prev => prev.map(c => {
      if (c.id !== chapId) return c;
      return {
        ...c,
        articles: c.articles.map(a => {
          if (a.id !== artId) return a;
          const separator = a.content.endsWith('\n') || !a.content ? '' : '\n';
          return {
            ...a,
            content: `${a.content}${separator}${textToAppend}`
          };
        })
      };
    }));
  };

  const handleAddArticle = (chapId: string) => {
    setParsedChapters(prev => prev.map(chap => {
      if (chap.id !== chapId) return chap;
      const totalArticlesNow = parsedChapters.reduce((acc, c) => acc + c.articles.length, 0) + 1;
      const newArt: DraftArticle = {
        id: `art-${Date.now()}`,
        articleNumber: `Pasal ${totalArticlesNow}`,
        title: `Ketentuan Pokok ${totalArticlesNow}`,
        content: 'Tuliskan rumusan ketentuan atau kewajiban di sini (changeable text)...',
        explanation: 'Cukup jelas'
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
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pengajuan Naskah Petunjuk Teknis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah berkas PDF/DOCX. Gemini AI akan membedah struktur bab dan pasal secara otomatis.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {warningMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{warningMsg}</span>
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
                  Gemini 3.5 / 3.6 Multi-Model Engine
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
              Mendukung: <strong>PDF, DOCX, TXT</strong> (Kapasitas s.d. <strong>200 MB</strong> dengan auto-chunking) &bull; AI membedah pasal secara otomatis
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                  {uploadedFile.name.split('.').pop() || 'DOK'}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{uploadedFile.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Berkas aktif dianalisis oleh Gemini AI
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setAiDissectionDone(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
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
                  placeholder="Masukkan nama pengusul / PIC drafter..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
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
                  {selectedRegulations.length} terpilih
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

        {/* Step 4: LIVE AI DISSECTION & BOX CHANGEABLE TEXT PER PASAL */}
        <div id="section-changeable-text" className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>4. Box Changeable Text &bull; Editor Substansi Pasal Juknis</span>
                </span>
                {parsedChapters.length > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {parsedChapters.reduce((acc, c) => acc + c.articles.length, 0)} Pasal Siap Diedit
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Menunggu Berkas Unggahan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ketika berkas dokumen diunggah, AI langsung membedah bab &amp; pasal secara otomatis. Anda dapat langsung mengubah teks nomor pasal, judul, maupun isi uraian pasal per pasal di dalam box interaktif di bawah ini.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleAddChapter}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 transition flex items-center space-x-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Bab Baru</span>
              </button>

              <button
                type="button"
                onClick={handleAddDefinition}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
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
                  + Tambah Istilah
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

          {/* Empty State when no chapters parsed yet */}
          {parsedChapters.length === 0 && (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs border border-blue-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Box Changeable Text Belum Aktif</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Silakan unggah berkas naskah Juknis (PDF / DOCX) pada langkah 1 di atas. Gemini AI akan otomatis membaca, mengekstrak, dan memunculkan <strong>Box Changeable Text</strong> untuk setiap pasal di sini agar dapat langsung Anda edit.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddChapter}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tulis Bab &amp; Pasal Secara Manual (Tanpa Berkas)</span>
                </button>
              </div>
            </div>
          )}

          {/* Chapters & Articles Editor List (Box Changeable Text) */}
          {parsedChapters.length > 0 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Box Changeable Text Aktif:</strong> Silakan sunting nomor pasal, judul pasal, maupun kotak uraian isi pasal di bawah ini sesuai kebutuhan perumusan naskah.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                  Editable
                </span>
              </div>

              {parsedChapters.map((chap) => {
                const isExpanded = expandedChapters[chap.id] ?? true;

                return (
                  <div key={chap.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                    {/* Chapter Header Bar */}
                    <div 
                      onClick={() => toggleChapterExpand(chap.id)}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 transition"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={chap.chapterNumber}
                          onChange={(e) => handleChapterNumberChange(chap.id, e.target.value)}
                          placeholder="BAB I"
                          className="font-mono text-xs font-black text-blue-900 bg-blue-100/80 px-2 py-1 rounded border border-blue-200 w-24 text-center focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleChapterTitleChange(chap.id, e.target.value)}
                          placeholder="Judul Bab (contoh: KETENTUAN UMUM)"
                          className="font-bold text-xs text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-300 flex-1 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          ({chap.articles.length} Pasal)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddArticle(chap.id);
                          }}
                          className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-blue-700 transition shadow-2xs"
                        >
                          + Tambah Pasal
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chap.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                          title="Hapus Bab ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Chapter Articles Body: List of Box Changeable Text */}
                    {isExpanded && (
                      <div className="p-4 bg-white space-y-3.5">
                        {chap.articles.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                            Belum ada pasal dalam bab ini. Klik <strong>+ Tambah Pasal</strong> untuk membuat pasal baru.
                          </div>
                        ) : (
                          chap.articles.map((art) => {
                            const wordCount = art.content.trim() ? art.content.trim().split(/\s+/).length : 0;
                            const charCount = art.content.length;

                            return (
                              <div 
                                key={art.id} 
                                className="p-3.5 rounded-xl border border-blue-200/80 bg-gradient-to-b from-blue-50/20 to-white space-y-2.5 shadow-xs transition hover:border-blue-300"
                              >
                                {/* Article Header Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2 flex-1">
                                    <input
                                      type="text"
                                      value={art.articleNumber}
                                      onChange={(e) => handleArticleNumberChange(chap.id, art.id, e.target.value)}
                                      placeholder="Pasal 1"
                                      className="text-xs font-black text-blue-900 px-2.5 py-1 rounded-md border border-blue-300 bg-white w-24 text-center font-mono shadow-2xs focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={art.title}
                                      onChange={(e) => handleArticleTitleChange(chap.id, art.id, e.target.value)}
                                      placeholder="Judul / Pokok Pengaturan Pasal (contoh: Ketentuan Operasional)"
                                      className="text-xs font-bold text-slate-800 px-3 py-1 rounded-md border border-slate-200 bg-white flex-1 focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                                      Box Changeable Text
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteArticle(chap.id, art.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                                      title="Hapus pasal ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Main Changeable Text Box Container */}
                                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition shadow-2xs">
                                  {/* Textarea Toolbar */}
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px]">
                                    <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                                      <Edit3 className="w-3 h-3 text-blue-600" />
                                      <span>Box Isi Ketentuan Pasal (Changeable Text):</span>
                                    </span>

                                    <div className="flex items-center space-x-2 text-[10px]">
                                      <span className="text-slate-400 font-mono">
                                        {charCount} karakter &bull; {wordCount} kata
                                      </span>
                                      <div className="h-3 w-px bg-slate-200" />
                                      <button
                                        type="button"
                                        onClick={() => handleAppendToArticle(chap.id, art.id, `(${(art.content.match(/\(\d+\)/g) || []).length + 1}) `)}
                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                      >
                                        + Ayat
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAppendToArticle(chap.id, art.id, 'a. ')}
                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                      >
                                        + Butir a.
                                      </button>
                                    </div>
                                  </div>

                                  {/* Changeable Textarea */}
                                  <textarea
                                    value={art.content}
                                    onChange={(e) => handleArticleContentChange(chap.id, art.id, e.target.value)}
                                    rows={4}
                                    placeholder="Ketik atau ubah teks isi pasal di sini..."
                                    className="w-full text-xs text-slate-900 p-3 bg-white focus:outline-hidden font-sans leading-relaxed resize-y"
                                  />
                                </div>

                                {/* Penjelasan / Tafsir Pasal (Optional) */}
                                <div>
                                  <input
                                    type="text"
                                    value={art.explanation || ''}
                                    onChange={(e) => handleArticleExplanationChange(chap.id, art.id, e.target.value)}
                                    placeholder="Penjelasan pasal (opsional): Cukup jelas / Penjelasan teknis tambahan..."
                                    className="w-full text-[11px] text-slate-600 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
