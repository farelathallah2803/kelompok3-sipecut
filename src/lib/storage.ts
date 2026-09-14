import {
  WorkflowStage,
  UserRole,
  WorkflowRegulationType,
  PBIWorkflowStage,
  PADGWorkflowStage,
  JuknisWorkflowStage,
  PetunjukTeknisDraft
} from '@/types';
import { getActiveProject } from './auth';

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

// Which roles may act at each Juknis stage — mirrors backend/drafts/workflow.py's STAGE_ROLES.
// This is UI-hint only (button label/enabled state); the backend is the real enforcement authority.
const JUKNIS_STAGE_ROLES: Partial<Record<WorkflowStage, UserRole[]>> = {
  juknis_penyusunan:      ['drafter', 'pimpinan_satker'],
  juknis_reviu_teknis:    ['dhuk_legal', 'dmr_reviewer', 'dai_auditor'],
  juknis_evaluasi_dmst:   ['dmst_governance'],
  juknis_pembahasan_rdg:  ['sekretariat_rdg'],
  juknis_persetujuan_adg: ['adg_pembina'],
};

export function canRoleActOnStage(stage: WorkflowStage, role: UserRole): boolean {
  return (JUKNIS_STAGE_ROLES[stage] || []).includes(role);
}

export function getWorkflowType(draft: PetunjukTeknisDraft): WorkflowRegulationType {
  return draft.workflowType || 'juknis';
}

export function getWorkflowStages(workflowType: WorkflowRegulationType): WorkflowStage[] {
  switch (workflowType) {
    case 'pbi': return PBI_STAGES;
    case 'padg': return PADG_STAGES;
    case 'juknis': return JUKNIS_STAGES;
  }
}

/** Role is derived from the user's real membership in the active project (see lib/auth.ts). */
export function getActiveRole(): UserRole {
  return getActiveProject()?.role || 'drafter';
}

export function getStageLabel(stage: WorkflowStage): string {
  switch (stage) {
    // Juknis / Perubahan Peraturan (the only workflow this app creates)
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
    default:
      return stage;
  }
}
