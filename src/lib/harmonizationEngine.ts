import { PetunjukTeknisDraft, HarmonizationSummary, HarmonizationIssue, Regulation } from '@/types';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';

export function runHarmonizationAnalysis(
  draft: PetunjukTeknisDraft,
  regulations: Regulation[] = MOCK_REGULATIONS
): HarmonizationSummary {
  const issues: HarmonizationIssue[] = [];

  // 1. Structural Check against PADG Intern No. 66 Tahun 2025 Lampiran X (Penomoran Juknis)
  const codeRegex = /^NOMOR\s+\d+\/JUKNIS\/(INTERNAL|EKSTERNAL)\/[A-Z0-9-]+\/\d{4}(\/RAHASIA)?$/i;
  if (draft.code && !codeRegex.test(draft.code.trim())) {
    issues.push({
      id: 'issue-format-number',
      severity: 'suggestion',
      draftArticle: 'Halaman Judul (Penomoran)',
      draftText: draft.code,
      matchedRegulationType: 'PADG_INTERN',
      matchedRegulationNumber: 'PADG Intern No. 66 Tahun 2025',
      matchedArticle: 'Lampiran X Angka 1',
      matchedText: 'Nomor Juknis memuat keterangan: NOMOR [angka]/JUKNIS/[INTERNAL atau EKSTERNAL]/[RUBRIK SATKER]/[TAHUN]. Dalam hal Juknis bersifat rahasia, ditambahkan keterangan RAHASIA setelah tahun pengesahan.',
      explanation: 'Format penomoran rancangan petunjuk teknis belum mengikuti tata persuratan baku Bank Indonesia sebagaimana diatur dalam Lampiran X PADG Intern No. 66 Tahun 2025.',
      recommendation: 'Ubah format nomor menjadi pola standar, contoh: NOMOR 1/JUKNIS/INTERNAL/DKSP/2025 atau NOMOR 1/JUKNIS/EKSTERNAL/DKSP/2025/RAHASIA.'
    });
  }

  // Extract all articles from the draft chapters and general provisions
  const allDraftArticles: { chapterTitle: string; articleNumber: string; title: string; content: string }[] = [];
  
  if (draft.chapters && draft.chapters.length > 0) {
    for (const chap of draft.chapters) {
      for (const art of chap.articles) {
        allDraftArticles.push({
          chapterTitle: chap.title,
          articleNumber: art.articleNumber,
          title: art.title,
          content: art.content
        });
      }
    }
  }

  // Also include general provisions if present
  if (draft.generalProvisions) {
    if (draft.generalProvisions.background) {
      allDraftArticles.push({
        chapterTitle: 'BAB I KETENTUAN UMUM',
        articleNumber: 'Bab I Bagian A (Latar Belakang)',
        title: 'Latar Belakang',
        content: draft.generalProvisions.background
      });
    }
    if (draft.generalProvisions.purpose) {
      allDraftArticles.push({
        chapterTitle: 'BAB I KETENTUAN UMUM',
        articleNumber: 'Bab I Bagian C (Tujuan)',
        title: 'Tujuan',
        content: draft.generalProvisions.purpose
      });
    }
    if (draft.generalProvisions.scope) {
      allDraftArticles.push({
        chapterTitle: 'BAB I KETENTUAN UMUM',
        articleNumber: 'Bab I Bagian E (Ruang Lingkup)',
        title: 'Ruang Lingkup',
        content: draft.generalProvisions.scope
      });
    }
  }

  // If raw content exists from file upload
  if (draft.rawContent && allDraftArticles.length === 0) {
    const parts = draft.rawContent.split(/(?=Pasal\s+\d+)/gi);
    parts.forEach((p, idx) => {
      const match = p.match(/Pasal\s+(\d+)/i);
      const artNum = match ? `Pasal ${match[1]}` : `Klausul ${idx + 1}`;
      allDraftArticles.push({
        chapterTitle: 'Draft Eksternal',
        articleNumber: artNum,
        title: 'Ketentuan Teks',
        content: p.trim()
      });
    });
  }

  // Evaluate substantive rules
  for (const draftArt of allDraftArticles) {
    const textLower = draftArt.content.toLowerCase();

    // 2. Conflict Check: Administrative Sanctions in Juknis (Pasal 6 ayat 6 PADG Intern No. 66/2025)
    if (
      (textLower.includes('sanksi administratif') || textLower.includes('dikenakan denda sebesar') || textLower.includes('pencabutan izin usaha') || textLower.includes('sanksi finansial'))
    ) {
      issues.push({
        id: `issue-sanction-forbidden-${draftArt.articleNumber}`,
        severity: 'hierarchy_violation',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PADG_INTERN',
        matchedRegulationNumber: 'PADG Intern No. 66 Tahun 2025',
        matchedArticle: 'Pasal 6 ayat (6)',
        matchedText: 'Materi pengaturan mengenai sanksi administratif hanya dimuat dalam PBI dan PDG.',
        explanation: 'Klausul draft memuat penetapan sanksi administratif. Berdasarkan Pasal 6 ayat (6) PADG Intern No. 66 Tahun 2025, materi sanksi administratif hanya boleh diatur dalam PBI dan PDG, dan DILARANG dimuat dalam Petunjuk Teknis.',
        recommendation: 'Hapus pasal atau ketentuan sanksi administratif dari naskah petunjuk teknis. Jika memerlukan penegakan sanksi, rujuk langsung ke pasal sanksi pada PBI atau PDG yang mendasarinya.'
      });
    }

    // 3. Conflict Check: Surcharge vs PBI No. 23/6/PBI/2021 Pasal 35
    if (
      (textLower.includes('surcharge') || textLower.includes('biaya tambahan')) &&
      (textLower.includes('diperkenankan') || textLower.includes('dapat membebankan') || textLower.includes('membebankan biaya'))
    ) {
      issues.push({
        id: `issue-surcharge-${draftArt.articleNumber}`,
        severity: 'conflict',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PBI',
        matchedRegulationNumber: 'PBI No. 23/6/PBI/2021',
        matchedArticle: 'Pasal 35',
        matchedText: 'PJP dan pedagang (merchant) dilarang mengenakan biaya tambahan (surcharge) atas transaksi pembayaran kepada pengguna akhir (konsumen).',
        explanation: 'Klausul draft memperbolehkan pengenaan biaya tambahan/surcharge valas kepada konsumen, bertentangan secara langsung dengan PBI No. 23/6/PBI/2021 Pasal 35 yang secara tegas melarang segala bentuk surcharge.',
        recommendation: 'Hapus kewenangan pembebanan biaya tambahan kepada konsumen pada klausul ini. Biaya konversi valas harus diserap ke dalam kurs konversi atau diselesaikan secara antar-bank, bukan dibebankan sebagai surcharge ke pengguna akhir.'
      });
    }

    // 4. Conflict Check: Settlement Time T+2 vs PADG No. 24/1/PADG/2022 Pasal 21
    if (
      (textLower.includes('t+2') || textLower.includes('2 hari kerja')) &&
      (textLower.includes('settlement') || textLower.includes('penyelesaian') || textLower.includes('rekonsiliasi'))
    ) {
      issues.push({
        id: `issue-settlement-${draftArt.articleNumber}`,
        severity: 'conflict',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PADG',
        matchedRegulationNumber: 'PADG No. 24/1/PADG/2022',
        matchedArticle: 'Pasal 21',
        matchedText: 'PJP wajib melakukan rekonsiliasi data transaksi harian (cut-off) paling lambat pukul 23.59 WIB dan menyelesaikan settlement antar-pihak maksimal T+1 hari kerja.',
        explanation: 'Jangka waktu settlement T+2 yang diajukan dalam draft lebih lambat daripada batas maksimum T+1 yang ditetapkan dalam PADG No. 24/1/PADG/2022 Pasal 21.',
        recommendation: 'Ubah jangka waktu penyelesaian settlement menjadi paling lambat T+1 hari kerja, atau ajukan permohonan dispensasi resmi/amandemen PADG jika koneksi multilateral lintas batas membutuhkan T+2.'
      });
    }

    // 5. Conflict Check: Limit QRIS
    if (
      textLower.includes('qris') &&
      (textLower.includes('15.000.000') || textLower.includes('15 juta') || textLower.includes('20.000.000'))
    ) {
      issues.push({
        id: `issue-limit-qris-${draftArt.articleNumber}`,
        severity: 'conflict',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PADG',
        matchedRegulationNumber: 'PADG No. 23/15/PADG/2021',
        matchedArticle: 'Pasal 5',
        matchedText: 'Batas nominal transaksi pembayaran menggunakan QRIS ditetapkan paling banyak Rp10.000.000,00 (sepuluh juta rupiah) per transaksi...',
        explanation: 'Batas nominal transaksi Rp15.000.000 melampaui batas atas transaksi QRIS reguler yang diatur dalam PADG No. 23/15/PADG/2021 (Rp10.000.000).',
        recommendation: 'Sesuaikan nominal limit transaksi menjadi paling banyak Rp10.000.000,00 per transaksi, atau sertakan klausul pendelegasian Keputusan Gubernur BI khusus untuk program cross-border.'
      });
    }

    // 6. Hierarchy Violation: Audit Trail Retention < 5 years
    if (
      (textLower.includes('audit trail') || textLower.includes('catatan transaksi') || textLower.includes('log sistem')) &&
      (textLower.includes('2 tahun') || textLower.includes('3 tahun') || textLower.includes('2 (dua) tahun'))
    ) {
      issues.push({
        id: `issue-retention-${draftArt.articleNumber}`,
        severity: 'hierarchy_violation',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PADG_INTERN',
        matchedRegulationNumber: 'PADG Intern No. 25/2/PADG-Intern/2023',
        matchedArticle: 'Pasal 11',
        matchedText: 'Seluruh petunjuk teknis operasional sistem pemrosesan transaksi wajib memuat klausul masa retensi pencatatan rekam jejak audit (audit trail log) paling sedikit selama 5 (lima) tahun berturut-turut.',
        explanation: 'Masa retensi log sistem 2 tahun melanggar ketentuan tata kelola internal PADG Intern No. 25/2/PADG-Intern/2023 Pasal 11 yang mewajibkan retensi minimal 5 tahun.',
        recommendation: 'Perpanjang masa retensi penyimpanan rekam jejak audit elektronik dan log transaksi menjadi paling sedikit 5 (lima) tahun berturut-turut.'
      });
    }

    // 7. Duplication Check: SNAP Standard Mandate
    if (
      textLower.includes('snap') &&
      textLower.includes('application programming interface') &&
      textLower.includes('spesifikasi teknis bank indonesia')
    ) {
      issues.push({
        id: `issue-dup-snap-${draftArt.articleNumber}`,
        severity: 'duplicate',
        draftArticle: draftArt.articleNumber,
        draftText: draftArt.content,
        matchedRegulationType: 'PADG',
        matchedRegulationNumber: 'PADG No. 24/1/PADG/2022',
        matchedArticle: 'Pasal 8',
        matchedText: 'PJP yang menghubungkan sistem layanan pembayaran melalui Application Programming Interface (API) wajib mengimplementasikan Standar Nasional Open API Pembayaran (SNAP)...',
        explanation: 'Klausul mengulang substansi norma yang sudah diatur secara lengkap dan mengikat pada PADG No. 24/1/PADG/2022 Pasal 8 (terjadi redundansi regulasi).',
        recommendation: 'Hindari perumusan ulang norma yang sudah ada di PADG. Cukup buat klausul rujukan, misal: "Penyelenggara wajib mematuhi standar teknis SNAP sebagaimana diatur dalam PADG No. 24/1/PADG/2022 beserta perubahannya."'
      });
    }
  }

  const conflictCount = issues.filter(i => i.severity === 'conflict').length;
  const duplicateCount = issues.filter(i => i.severity === 'duplicate').length;
  const hierarchyViolations = issues.filter(i => i.severity === 'hierarchy_violation').length;
  const totalIssues = issues.length;

  let score = 100;
  score -= conflictCount * 25;
  score -= hierarchyViolations * 20;
  score -= duplicateCount * 10;
  if (score < 0) score = 0;

  const isSafeToProceed = conflictCount === 0 && hierarchyViolations === 0;

  return {
    totalIssues,
    conflictCount,
    duplicateCount,
    hierarchyViolations,
    compatibilityScore: score,
    isSafeToProceed,
    issues
  };
}
