import { 
  PetunjukTeknisDraft, 
  WorkflowStage, 
  WorkflowStatus, 
  UserRole, 
  ReviewNote, 
  ActivityLogItem, 
  DEFAULT_BI_TYPOGRAPHY,
  WorkflowRegulationType,
  PBIWorkflowStage,
  PADGWorkflowStage,
  JuknisWorkflowStage
} from '@/types';
import { INITIAL_DRAFTS } from '@/data/mockDrafts';
import { runHarmonizationAnalysis } from './harmonizationEngine';

const STORAGE_KEY = 'juknis_tracker_drafts_v8';
const ROLE_KEY = 'juknis_active_role_v4';

export const PBI_STAGES: PBIWorkflowStage[] = [
  'pbi_legal_review',
  'pbi_harmonisasi',
  'pbi_legal_closing',
  'pbi_finalisasi',
  'pbi_ttd_gub',
  'pbi_publish'
];

export const PADG_STAGES: PADGWorkflowStage[] = [
  'padg_legal_review',
  'padg_legal_closing',
  'padg_finalisasi',
  'padg_ttd_gub',
  'padg_publish'
];

export const JUKNIS_STAGES: JuknisWorkflowStage[] = [
  'juknis_penyusunan',
  'juknis_reviu_teknis',
  'juknis_evaluasi_dmst',
  'juknis_pembahasan_rdg',
  'juknis_persetujuan_adg',
  'juknis_publikasi_dhk'
];

export function getWorkflowType(draft: PetunjukTeknisDraft): WorkflowRegulationType {
  if (draft.workflowType) return draft.workflowType;
  const code = (draft.code || '').toUpperCase();
  const title = (draft.title || '').toLowerCase();
  if (code.includes('PBI') || title.startsWith('peraturan bank indonesia')) return 'pbi';
  if (code.includes('PADG') || title.startsWith('peraturan anggota dewan gubernur')) return 'padg';
  return 'juknis';
}

export function getWorkflowStages(workflowType: WorkflowRegulationType): WorkflowStage[] {
  switch (workflowType) {
    case 'pbi': return PBI_STAGES;
    case 'padg': return PADG_STAGES;
    case 'juknis': return JUKNIS_STAGES;
  }
}

export function determineNextWorkflowStep(
  workflowType: WorkflowRegulationType,
  currentStage: WorkflowStage,
  decision: 'approve' | 'request_revision' | 'reject'
): { nextStage: WorkflowStage; nextStatus: WorkflowStatus } {
  if (decision === 'reject') {
    return { nextStage: currentStage, nextStatus: 'rejected' };
  }

  const stages = getWorkflowStages(workflowType);

  if (decision === 'request_revision') {
    // Kembali ke tahap awal penyusunan
    return { nextStage: stages[0], nextStatus: 'revision_requested' };
  }

  // Kompatibilitas tahap lama jika ada
  if (currentStage === 'unit_kerja') return { nextStage: 'satuan_kerja', nextStatus: 'in_review' };
  if (currentStage === 'satuan_kerja') return { nextStage: 'dmr', nextStatus: 'in_review' };
  if (currentStage === 'dmr') return { nextStage: 'dai', nextStatus: 'in_review' };
  if (currentStage === 'dai') return { nextStage: 'dhuk', nextStatus: 'in_review' };
  if (currentStage === 'dhuk') return { nextStage: 'ditetapkan', nextStatus: 'approved' };

  const currentIndex = stages.indexOf(currentStage as any);
  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return { nextStage: stages[stages.length - 1], nextStatus: 'approved' };
  }

  const nextStage = stages[currentIndex + 1];
  const isFinal = currentIndex + 1 === stages.length - 1;
  return { 
    nextStage, 
    nextStatus: isFinal ? 'approved' : 'in_review' 
  };
}

export function canRoleActOnStage(
  stage: WorkflowStage, 
  role: UserRole, 
  workflowType?: WorkflowRegulationType
): boolean {
  switch (stage) {
    // 1. Alur PBI: Legal Review => Harmonisasi Kemenkum & Kemenkeu => Legal Closing => Finalisasi => TTD Gub => DHk Publish
    case 'pbi_legal_review':
      return role === 'dhuk_legal';
    case 'pbi_harmonisasi':
      return role === 'kemenkum_kemenkeu' || role === 'dhuk_legal';
    case 'pbi_legal_closing':
      return role === 'dhuk_legal';
    case 'pbi_finalisasi':
      return role === 'dhuk_legal' || role === 'drafter';
    case 'pbi_ttd_gub':
      return role === 'gubernur_bi';
    case 'pbi_publish':
      return role === 'dhuk_legal';

    // 2. Alur PADG: Legal Review => Legal Closing => Finalisasi => TTD Gub => DHk Publish (Skip Harmonisasi)
    case 'padg_legal_review':
      return role === 'dhuk_legal';
    case 'padg_legal_closing':
      return role === 'dhuk_legal';
    case 'padg_finalisasi':
      return role === 'dhuk_legal' || role === 'drafter';
    case 'padg_ttd_gub':
      return role === 'gubernur_bi';
    case 'padg_publish':
      return role === 'dhuk_legal';

    // 3. Alur Perubahan Peraturan / Juknis: Satker Pemrakarsa => Reviu Teknis (DHk, DMR, DAI) => Evaluasi DMST => Pembahasan RDG => Persetujuan ADG => Publikasi DHk
    case 'juknis_penyusunan':
      return role === 'drafter' || role === 'pimpinan_satker';
    case 'juknis_reviu_teknis':
      return role === 'dhuk_legal' || role === 'dmr_reviewer' || role === 'dai_auditor';
    case 'juknis_evaluasi_dmst':
      return role === 'dmst_governance';
    case 'juknis_pembahasan_rdg':
      return role === 'sekretariat_rdg';
    case 'juknis_persetujuan_adg':
      return role === 'adg_pembina';
    case 'juknis_publikasi_dhk':
      return role === 'dhuk_legal';

    // Legacy compatibility
    case 'unit_kerja':
      return role === 'drafter';
    case 'satuan_kerja':
      return role === 'pimpinan_satker';
    case 'dmr':
      return role === 'dmr_reviewer';
    case 'dai':
      return role === 'dai_auditor';
    case 'dhuk':
      return role === 'dhuk_legal';
    case 'ditetapkan':
      return false;
    default:
      return false;
  }
}

export function getDrafts(): PetunjukTeknisDraft[] {
  if (typeof window === 'undefined') return INITIAL_DRAFTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const seeded = INITIAL_DRAFTS.map(d => ({
        ...d,
        workflowType: getWorkflowType(d),
        typography: d.typography || { ...DEFAULT_BI_TYPOGRAPHY },
        complianceSummary: runHarmonizationAnalysis(d)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: PetunjukTeknisDraft[] = JSON.parse(data);
    const juknisDrafts = parsed.filter(d => (d.workflowType || getWorkflowType(d)) === 'juknis');
    return juknisDrafts.map(d => ({
      ...d,
      workflowType: 'juknis',
      typography: d.typography || { ...DEFAULT_BI_TYPOGRAPHY }
    }));
  } catch (e) {
    console.error('Failed to load drafts from localStorage', e);
    return INITIAL_DRAFTS;
  }
}

export function getDraftById(id: string): PetunjukTeknisDraft | undefined {
  const drafts = getDrafts();
  return drafts.find(d => d.id === id || d.code === id);
}

export function saveDraft(draft: PetunjukTeknisDraft): void {
  if (typeof window === 'undefined') return;
  const drafts = getDrafts();
  const existingIdx = drafts.findIndex(d => d.id === draft.id);
  
  draft.workflowType = getWorkflowType(draft);
  draft.complianceSummary = runHarmonizationAnalysis(draft);
  draft.updatedAt = new Date().toISOString();

  if (existingIdx >= 0) {
    drafts[existingIdx] = draft;
  } else {
    drafts.unshift(draft);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  window.dispatchEvent(new Event('juknis_storage_updated'));
}

export function updateDraftWorkflow(
  draftId: string,
  newStage: WorkflowStage,
  newStatus: WorkflowStatus,
  reviewNote: ReviewNote,
  actorName: string,
  actorRole: string
): PetunjukTeknisDraft | null {
  const drafts = getDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return null;

  draft.currentStage = newStage;
  draft.status = newStatus;
  draft.updatedAt = new Date().toISOString();

  draft.reviewNotes = draft.reviewNotes || [];
  draft.reviewNotes.push(reviewNote);

  const logItem: ActivityLogItem = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: actorName,
    role: actorRole,
    action: reviewNote.decision === 'approve'
      ? `Disetujui: Lanjut ke ${getStageLabel(newStage)}`
      : reviewNote.decision === 'request_revision'
      ? `Pengembalian: Permintaan revisi oleh ${reviewNote.department}`
      : `Penolakan berkas oleh ${reviewNote.department}`,
    stage: newStage,
    details: reviewNote.notes
  };

  draft.history = draft.history || [];
  draft.history.push(logItem);

  saveDraft(draft);
  return draft;
}

export function resetToMockData(): void {
  if (typeof window === 'undefined') return;
  const seeded = INITIAL_DRAFTS.map(d => ({
    ...d,
    workflowType: getWorkflowType(d),
    typography: d.typography || { ...DEFAULT_BI_TYPOGRAPHY },
    complianceSummary: runHarmonizationAnalysis(d)
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  window.dispatchEvent(new Event('juknis_storage_updated'));
}

export function getActiveRole(): UserRole {
  if (typeof window === 'undefined') return 'drafter';
  return (localStorage.getItem(ROLE_KEY) as UserRole) || 'drafter';
}

export function setActiveRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event('juknis_role_changed'));
}

export function getStageLabel(stage: WorkflowStage): string {
  switch (stage) {
    // 1. PBI
    case 'pbi_legal_review':
      return '1. Legal Review (DHk)';
    case 'pbi_harmonisasi':
      return '2. Harmonisasi Kemenkum & Kemenkeu';
    case 'pbi_legal_closing':
      return '3. Legal Closing (DHk)';
    case 'pbi_finalisasi':
      return '4. Clean / Finalisasi Naskah';
    case 'pbi_ttd_gub':
      return '5. Tanda Tangan Gubernur BI';
    case 'pbi_publish':
      return '6. Publikasi oleh DHk';

    // 2. PADG
    case 'padg_legal_review':
      return '1. Legal Review (DHk)';
    case 'padg_legal_closing':
      return '2. Legal Closing (DHk)';
    case 'padg_finalisasi':
      return '3. Clean / Finalisasi Naskah';
    case 'padg_ttd_gub':
      return '4. Tanda Tangan Gubernur / Penetapan';
    case 'padg_publish':
      return '5. Publikasi oleh DHk';

    // 3. Juknis / Perubahan Peraturan
    case 'juknis_penyusunan':
      return '1. Penyusunan Satker Pemrakarsa';
    case 'juknis_reviu_teknis':
      return '2. Reviu Teknis (DHk, DMR, DAI)';
    case 'juknis_evaluasi_dmst':
      return '3. Evaluasi Tata Kelola (DMST)';
    case 'juknis_pembahasan_rdg':
      return '4. Pembahasan & Finalisasi di RDG';
    case 'juknis_persetujuan_adg':
      return '5. Persetujuan ADG Pembina';
    case 'juknis_publikasi_dhk':
      return '6. Publikasi oleh DHk';

    // Legacy
    case 'unit_kerja':
      return 'Unit Kerja (Penyusunan)';
    case 'satuan_kerja':
      return 'Satuan Kerja (Persetujuan Pimpinan)';
    case 'dmr':
      return 'Departemen Manajemen Risiko (DMR)';
    case 'dai':
      return 'Departemen Audit Intern (DAI)';
    case 'dhuk':
      return 'Departemen Hukum (DHUK)';
    case 'ditetapkan':
      return 'Ditetapkan & Berlaku';
    default:
      return stage;
  }
}
