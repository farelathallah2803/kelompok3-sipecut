export type WorkflowRegulationType = 'pbi' | 'padg' | 'juknis';

export type PBIWorkflowStage =
  | 'pbi_legal_review'
  | 'pbi_harmonisasi'
  | 'pbi_legal_closing'
  | 'pbi_finalisasi'
  | 'pbi_ttd_gub'
  | 'pbi_publish';

export type PADGWorkflowStage =
  | 'padg_legal_review'
  | 'padg_legal_closing'
  | 'padg_finalisasi'
  | 'padg_ttd_gub'
  | 'padg_publish';

export type JuknisWorkflowStage =
  | 'juknis_penyusunan'
  | 'juknis_reviu_teknis'
  | 'juknis_evaluasi_dmst'
  | 'juknis_pembahasan_rdg'
  | 'juknis_persetujuan_adg'
  | 'juknis_publikasi_dhk';

export type LegacyWorkflowStage =
  | 'unit_kerja'
  | 'satuan_kerja'
  | 'dmr'
  | 'dai'
  | 'dhuk'
  | 'ditetapkan';

export type WorkflowStage =
  | PBIWorkflowStage
  | PADGWorkflowStage
  | JuknisWorkflowStage
  | LegacyWorkflowStage;

export type WorkflowStatus =
  | 'draft'
  | 'in_review'
  | 'revision_requested'
  | 'rejected'
  | 'approved';

export type UserRole =
  | 'drafter'
  | 'dhuk_legal'
  | 'kemenkum_kemenkeu'
  | 'dmr_reviewer'
  | 'dai_auditor'
  | 'dmst_governance'
  | 'sekretariat_rdg'
  | 'adg_pembina'
  | 'gubernur_bi'
  | 'pimpinan_satker';

export type RegulationType = 'PBI' | 'PDG' | 'PADG' | 'PADG_INTERN' | 'JUKNIS' | 'SE' | 'UU' | string;

export type JuknisTemplateType = 'templat_1' | 'templat_2' | 'templat_3';

export interface Article {
  articleNumber: string;
  title: string;
  content: string;
  keyProhibitions?: string[];
  keyMandates?: string[];
  thresholds?: string[];
}

export interface Regulation {
  id: string;
  jdihId?: string;
  type: RegulationType;
  number: string;
  title: string;
  year: number;
  sector: 'Sistem Pembayaran' | 'Sistem Pembayaran & PUR' | 'Moneter' | 'Makroprudensial' | 'Pendukung Kebijakan' | 'Pendukung Organisasi' | 'Manajemen Risiko & Tata Kelola' | 'Audit' | 'Pembentukan Peraturan' | 'Umum' | 'Lainnya' | string;
  status: 'Berlaku' | 'Diubah' | 'Dicabut' | string;
  date?: string;
  jdihUrl: string;
  downloadPdfUrl?: string;
  summary: string;
  articles: Article[];
}

export interface JuknisDefinitionItem {
  id: string;
  term: string;
  meaning: string;
}

export interface JuknisRevocationItem {
  id: string;
  number: string;
  date: string;
  title: string;
  revokedSection?: string;
  actionType: 'mencabut' | 'mengubah';
}

export interface JuknisAttachment {
  id: string;
  title: string;
  type: 'form' | 'flowchart' | 'table' | 'guideline';
  content: string;
}

export interface DraftArticle {
  id: string;
  articleNumber: string;
  title: string;
  content: string;
  explanation?: string;
}

export interface DraftChapter {
  id: string;
  chapterNumber: string; // e.g. "BAB II"
  title: string;
  articles: DraftArticle[];
}

export interface ReviewNote {
  id: string;
  stage: WorkflowStage;
  reviewerRole: UserRole;
  reviewerName: string;
  department: string;
  decision: 'approve' | 'request_revision' | 'reject';
  notes: string;
  riskAssessment?: {
    level: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
    riskTypes: string[];
    mitigationPlan: string;
  };
  auditAssessment?: {
    internalControlRating: 'Memadai' | 'Perlu Perbaikan' | 'Tidak Memadai';
    complianceScore: number;
    auditRecommendations: string[];
  };
  legalAssessment?: {
    hierarchyStatus: 'Selaras PBI/PADG' | 'Ada Potensi Benturan' | 'Duplikasi Substansi' | 'Rujukan Tidak Tepat';
    legalOpinion: string;
  };
  kemenkumKemenkeuAssessment?: {
    beritaAcaraNumber: string;
    syncStatus: 'Sesuai UU Nasional' | 'Perlu Penyelarasan Fiskal' | 'Harmonis Sempurna';
    notes: string;
  };
  dmstAssessment?: {
    strategicAlignmentRating: 'Sangat Baik' | 'Baik' | 'Perlu Penyesuaian Tata Kelola';
    governanceScore: number;
    recommendations: string;
  };
  rdgAssessment?: {
    meetingDate: string;
    resolutionNumber: string;
    decisions: string;
  };
  adgApproval?: {
    adgName: string;
    portfolioSector: string;
    approvalStatus: 'Disetujui Penuh' | 'Disetujui Dengan Catatan';
  };
  gubernurSignature?: {
    signedDate: string;
    decreeNumber: string;
    validityNotes: string;
  };
  publicationDetails?: {
    registrationNumber: string;
    publishedDate: string;
    jdihUrl: string;
    publisher?: string;
  };
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  stage: WorkflowStage;
  details?: string;
}

export interface HarmonizationIssue {
  id: string;
  severity: 'conflict' | 'duplicate' | 'hierarchy_violation' | 'outdated_reference' | 'suggestion';
  draftArticle: string;
  draftText: string;
  matchedRegulationType: RegulationType;
  matchedRegulationNumber: string;
  matchedArticle: string;
  matchedText: string;
  explanation: string;
  recommendation: string;
  // Present only for results from the real backend pipeline (mode: 'real' below).
  rank?: number;
  similarity?: number;
  relationGroup?: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT';
  correctedGroup?: 'SELARAS' | 'BERTENTANGAN' | 'TIDAK TERKAIT';
}

export interface HarmonizationSummary {
  totalIssues: number;
  conflictCount: number;
  duplicateCount: number;
  hierarchyViolations: number;
  compatibilityScore: number;
  isSafeToProceed: boolean;
  issues: HarmonizationIssue[];
  // 'real' = backend AI pipeline (mode EVALUASI); 'mock' = offline keyword engine.
  mode?: 'real' | 'mock';
  sessionId?: string;
  alignedCount?: number;
}

export interface JuknisTypography {
  fontFamily: 'Bookman Old Style' | 'Arial' | 'Times New Roman' | 'Calibri' | 'Inter';
  fontSize: number; // pt: 10, 11, 12, 13, 14, 16
  lineSpacing: number; // 1.0, 1.15, 1.5, 2.0
  margin: '2.5cm' | '2.0cm' | '3.0cm';
  textAlign: 'justify' | 'left';
  isBoldTitle?: boolean;
}

export const DEFAULT_BI_TYPOGRAPHY: JuknisTypography = {
  fontFamily: 'Bookman Old Style',
  fontSize: 12,
  lineSpacing: 1.0,
  margin: '2.5cm',
  textAlign: 'justify',
  isBoldTitle: true,
};

export interface UploadedDraftFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  fileUrl?: string;
  pageCount?: number;
  extractedText?: string;
}

export interface PetunjukTeknisDraft {
  id: string;
  code: string; // e.g. NOMOR 1/JUKNIS/INTERNAL/DKSP/2025
  title: string;
  workflowType?: WorkflowRegulationType; // 'pbi' | 'padg' | 'juknis'
  templateType?: JuknisTemplateType; // templat_1, templat_2, templat_3
  isConfidential: boolean; // RAHASIA
  scope: 'INTERNAL' | 'EKSTERNAL';
  rubrikSatker: string; // e.g. DKSP, DHK, DMR, DPUM
  year: number;
  category: string;
  unitKerja: string;
  proposerName: string;
  currentStage: WorkflowStage;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  
  // Berkas Dokumen yang Diunggah
  uploadedFile?: UploadedDraftFile;

  // Catatan Pengantar / Konsiderans
  foreword?: string; // Kata Pengantar / Catatan
  validation?: {
    place: string; // Tempat Pengesahan, e.g. "Jakarta"
    date: string; // Tanggal Pengesahan
    effectiveDate: string; // Tanggal Pemberlakuan
    officialName: string; // Nama tanpa gelar
    officialPosition: string; // Jabatan e.g. "Kepala Departemen Kebijakan Sistem Pembayaran"
    rank: string; // Pangkat e.g. "Direktur Eksekutif"
  };

  // Daftar Pencabutan/Perubahan Juknis
  revocations?: JuknisRevocationItem[];

  // BAB I: Ketentuan Umum
  generalProvisions?: {
    background: string; // 1. Latar Belakang
    legalBases: string[]; // 2. Dasar Hukum (PBI, PDG, PADG, PADG Intern)
    purpose: string; // 3. Tujuan
    definitions: JuknisDefinitionItem[]; // 4. Pengertian Umum / Definisi
    scope: string; // 5. Ruang Lingkup
    orgStructure?: string; // 6. Struktur Organisasi (Khusus Templat 1)
    mainDuties?: string; // 7. Tugas Pokok dan Produk Pokok (Khusus Templat 1)
    resources?: string; // 8. Sumber Daya / Tools / Aplikasi (Khusus Templat 1/2)
  };

  // BAB II dst: Substansi Juknis
  chapters?: DraftChapter[];

  // Lampiran
  attachments?: JuknisAttachment[];

  rawContent?: string;
  typography?: JuknisTypography;
  reviewNotes: ReviewNote[];
  complianceSummary?: HarmonizationSummary;
  history: ActivityLogItem[];
}
