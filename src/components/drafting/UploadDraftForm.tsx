'use client';

import React, { useState, useRef } from 'react';
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
  Search
} from 'lucide-react';
import { PetunjukTeknisDraft, WorkflowRegulationType, UploadedDraftFile, JuknisTemplateType } from '@/types';
import { saveDraft, getActiveRole } from '@/lib/storage';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';

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

  const toggleRegulation = (regNumber: string) => {
    if (selectedRegulations.includes(regNumber)) {
      setSelectedRegulations(selectedRegulations.filter(r => r !== regNumber));
    } else {
      setSelectedRegulations([...selectedRegulations, regNumber]);
    }
  };

  const addCustomLegalBase = () => {
    const trimmed = searchRegQuery.trim();
    if (trimmed && !selectedRegulations.includes(trimmed)) {
      setSelectedRegulations([...selectedRegulations, trimmed]);
      setSearchRegQuery('');
      setIsSearchRegOpen(false);
    }
  };

  const removeLegalBase = (regNumber: string) => {
    setSelectedRegulations(selectedRegulations.filter(r => r !== regNumber));
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
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        setTitle(`Rancangan ${cleanName}`);
      }
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
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        setTitle(`Rancangan ${cleanName}`);
      }
    }
  };

  const handleSatkerChange = (val: string) => {
    setUnitKerja(val);
    const match = val.match(/\(([A-Z]+)\)/);
    if (match && match[1]) {
      setRubrikSatker(match[1]);
    }
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
        definitions: [],
        scope: `Ruang lingkup ketentuan berlaku bagi entitas terkait di lingkungan Bank Indonesia dan industri mitra.`
      },
      chapters: [
        {
          id: 'chap-1',
          chapterNumber: 'BAB I',
          title: 'KETENTUAN OPERASIONAL & KEPATUHAN',
          articles: [
            {
              id: 'art-1',
              articleNumber: 'Pasal 1',
              title: 'Ketentuan Umum Pelaksanaan',
              content: 'Penyelenggara wajib mematuhi seluruh standar teknis dan batas waktu yang ditetapkan oleh Bank Indonesia.',
              explanation: 'Ketentuan materiil dari berkas naskah yang diunggah.'
            }
          ]
        }
      ],
      attachments: [],
      reviewNotes: [
        {
          id: `rev-${Date.now()}`,
          stage: startStage,
          reviewerRole: 'drafter',
          reviewerName: proposerName,
          department: unitKerja,
          decision: 'approve',
          notes: `Berkas naskah '${uploadedFile.name}' berhasil diunggah dan diajukan ke tahapan penelaahan resmi.`,
          createdAt: new Date().toISOString()
        }
      ],
      history: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: proposerName,
          role: 'Drafter Unit Kerja',
          action: 'Pengajuan Berkas Naskah',
          stage: startStage,
          details: `Mengunggah berkas ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)`
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
    <div className="max-w-4xl mx-auto space-y-6">
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
            Pengajuan Berkas Rancangan Petunjuk Teknis (Juknis)
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Format Naskah & Alur Persetujuan Juknis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Klasifikasi &amp; Format Naskah Petunjuk Teknis
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

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Alur 6 Tahap Tata Kelola:</span> Satker Pemrakarsa &rarr; Reviu Teknis Terpadu (DHk, DMR, DAI) &rarr; Evaluasi Tata Kelola (DMST) &rarr; Pembahasan RDG &rarr; Persetujuan ADG Pembina &rarr; Publikasi Resmi oleh DHk.
          </div>
        </div>

        {/* Step 2: Upload File Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            2. Unggah Berkas Naskah Dokumen
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
              accept=".pdf,.docx,.doc,.rtf" 
              onChange={handleFileSelect}
              className="hidden" 
            />

            <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              Klik untuk memilih berkas atau seret &amp; lepas berkas naskah di sini
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Format yang didukung: <strong>PDF, DOCX, DOC</strong> (Maksimal 25 MB)
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
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Berkas siap diajukan
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
                  Satuan Kerja Pemrakarsa
                </label>
                <select
                  value={unitKerja}
                  onChange={(e) => handleSatkerChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Departemen Kebijakan Sistem Pembayaran (DKSP)">Departemen Kebijakan Sistem Pembayaran (DKSP)</option>
                  <option value="Departemen Teknologi Informasi (DTI)">Departemen Teknologi Informasi (DTI)</option>
                  <option value="Departemen Pengelolaan Moneter (DPM)">Departemen Pengelolaan Moneter (DPM)</option>
                  <option value="Departemen Pengelolaan Devisa (DPD)">Departemen Pengelolaan Devisa (DPD)</option>
                  <option value="Departemen Pengembangan UMKM dan Perlindungan Konsumen (DPUM)">Departemen Pengembangan UMKM (DPUM)</option>
                  <option value="Departemen Manajemen Risiko (DMR)">Departemen Manajemen Risiko (DMR)</option>
                  <option value="Departemen Hukum (DHk)">Departemen Hukum (DHk)</option>
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
                  <option value="Pengelolaan Moneter">Pengelolaan Moneter</option>
                  <option value="Stabilitas Sistem Keuangan">Stabilitas Sistem Keuangan</option>
                  <option value="Manajemen Risiko &amp; Tata Kelola">Manajemen Risiko &amp; Tata Kelola</option>
                  <option value="Teknologi Informasi">Teknologi Informasi</option>
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

              {/* Selectable Search Bar with Dropdown Suggestions */}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchRegQuery.trim()) {
                          if (!selectedRegulations.includes(searchRegQuery.trim())) {
                            setSelectedRegulations([...selectedRegulations, searchRegQuery.trim()]);
                          }
                          setSearchRegQuery('');
                          setIsSearchRegOpen(false);
                        }
                      }
                    }}
                    placeholder="Cari atau ketik nama/nomor aturan (contoh: PBI 23/6, PADG 24/1)..."
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

                {/* Autocomplete Suggestions Dropdown */}
                {isSearchRegOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsSearchRegOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                      {regSuggestions.length === 0 ? (
                        <div className="px-3.5 py-2 text-xs text-slate-500">
                          {searchRegQuery ? (
                            <span>Tekan <strong>Enter</strong> atau klik <strong>+ Tambah</strong> untuk menambahkan rujukan: &ldquo;{searchRegQuery}&rdquo;</span>
                          ) : (
                            <span>Seluruh regulasi sampel sudah terpilih.</span>
                          )}
                        </div>
                      ) : (
                        regSuggestions.map((reg) => (
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
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                  {reg.type}
                                </span>
                                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                                  {reg.number}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {reg.title}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-600 shrink-0">
                              + Pilih
                            </span>
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
                Catatan Pengantar / Ringkasan Konsiderans
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

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Juknis'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
