import { Regulation, PetunjukTeknisDraft, RegulationType } from '@/types';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';
import { getDrafts } from './storage';

export interface SearchResultArticle {
  id: string;
  regulationId: string;
  regulationNumber: string;
  regulationTitle: string;
  regulationType: RegulationType;
  year: number;
  sector: string;
  jdihUrl: string;
  articleNumber: string;
  articleTitle: string;
  content: string;
  keyProhibitions?: string[];
  keyMandates?: string[];
  thresholds?: string[];
  relevanceScore: number;
  matchedReason: string;
  source: 'regulation' | 'juknis';
}

export interface SmartSearchResponse {
  query: string;
  aiExecutiveAnswer: string;
  keyTakeaway: string;
  totalMatched: number;
  hierarchyBreakdown: {
    pbi: number;
    padg: number;
    padgIntern: number;
    juknis: number;
    se?: number;
    uu?: number;
  };
  articles: SearchResultArticle[];
}

interface KeywordConcept {
  terms: string[];
  weight: number;
  relatedArticleKeywords: string[];
}

const LEGAL_CONCEPTS: Record<string, KeywordConcept> = {
  surcharge: {
    terms: ['surcharge', 'biaya tambahan', 'biaya gesek', 'fee tambahan', 'beban biaya', 'mdr'],
    weight: 10,
    relatedArticleKeywords: ['surcharge', 'biaya tambahan', 'konsumen', 'pedagang', 'mdr']
  },
  sanksi: {
    terms: ['sanksi', 'denda', 'hukuman', 'sanksi administratif', 'denda uang', 'pencabutan izin', 'pembatasan usaha'],
    weight: 10,
    relatedArticleKeywords: ['sanksi administratif', 'pbi dan pdg', 'hanya dimuat', 'denda', 'teguran tertulis']
  },
  settlement: {
    terms: ['settlement', 'kliring', 'cut-off', 'rekonsiliasi', 't+1', 't+2', 'penyelesaian transaksi', 'jadwal kliring'],
    weight: 9,
    relatedArticleKeywords: ['settlement', 'rekonsiliasi', 'cut-off', 't+1', '23.59']
  },
  retensi: {
    terms: ['retensi', 'audit trail', 'log', 'rekam jejak', '5 tahun', 'penyimpanan log', 'jejak audit'],
    weight: 9,
    relatedArticleKeywords: ['retensi', 'audit trail', '5 (lima) tahun', 'catatan log']
  },
  modal: {
    terms: ['modal', 'modal disetor', '15 miliar', 'modal minimum', 'permodalan pjp'],
    weight: 8,
    relatedArticleKeywords: ['modal disetor', '15.000.000.000', 'paling sedikit']
  },
  datacenter: {
    terms: ['data center', 'drc', 'pusat data', 'disaster recovery', 'luar negeri', 'kedaulatan data'],
    weight: 8,
    relatedArticleKeywords: ['data center', 'disaster recovery center', 'wilayah negara kesatuan']
  },
  templat_juknis: {
    terms: ['templat', 'template', 'juknis', 'lampiran x', 'bookman', 'tata naskah', 'penomoran juknis', 'pengesahan'],
    weight: 10,
    relatedArticleKeywords: ['templat juknis', 'nomor juknis', 'lampiran x', 'bookman old style', 'pasal 23', 'pasal 64']
  },
  snap: {
    terms: ['snap', 'api', 'open api', 'antarmuka api', 'standar nasional'],
    weight: 8,
    relatedArticleKeywords: ['snap', 'open api', 'spesifikasi teknis']
  },
  qris: {
    terms: ['qris', 'kode qr', '10 juta', 'cross-border', 'nominal qris', 'mdr qris'],
    weight: 8,
    relatedArticleKeywords: ['qris', '10.000.000', 'merchant discount rate']
  },
  dmr_risiko: {
    terms: ['dmr', 'risiko', 'manajemen risiko', 'telaah risiko', 'mitigasi'],
    weight: 7,
    relatedArticleKeywords: ['manajemen risiko', 'dmr', 'telaah', 'rekomendasi']
  },
  pengaduan: {
    terms: ['pengaduan', 'aduan', 'nasabah', '14 hari', 'konsumen'],
    weight: 7,
    relatedArticleKeywords: ['pengaduan nasabah', '14 (empat belas) hari kerja']
  }
};

export function searchAllRegulations(rawQuery: string): SmartSearchResponse {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return {
      query: '',
      aiExecutiveAnswer: 'Ketik kata kunci untuk mencari regulasi dan pasal terkait.',
      keyTakeaway: 'PBI, PADG, PADG Intern, dan Petunjuk Teknis.',
      totalMatched: 0,
      hierarchyBreakdown: { pbi: 0, padg: 0, padgIntern: 0, juknis: 0 },
      articles: []
    };
  }

  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  const matchedArticles: SearchResultArticle[] = [];

  // 1. Scan Corpus Regulasi Payung (PBI, PADG, PADG Intern, SE, UU)
  for (const reg of MOCK_REGULATIONS) {
    const articlesToScan = (reg.articles && reg.articles.length > 0)
      ? reg.articles
      : [{
          articleNumber: 'Pokok Pengaturan',
          title: reg.title,
          content: `${reg.number} tentang ${reg.title}. Sektor: ${reg.sector}. Tahun ${reg.year}. Status: ${reg.status}.`,
          keyMandates: [reg.sector],
          keyProhibitions: [],
          thresholds: [`Tahun ${reg.year}`]
        }];

    for (const art of articlesToScan) {
      let score = 0;
      const reasons: string[] = [];

      const fullText = `${reg.number} ${reg.title} ${art.articleNumber} ${art.title} ${art.content} ${(art.keyProhibitions || []).join(' ')} ${(art.keyMandates || []).join(' ')} ${(art.thresholds || []).join(' ')}`.toLowerCase();

      // Check Exact phrase match
      if (fullText.includes(query)) {
        score += 50;
        reasons.push('Kecocokan frasa langsung');
      }

      // Check Word-by-word match
      let matchedWordCount = 0;
      for (const w of queryWords) {
        if (fullText.includes(w)) {
          matchedWordCount++;
          score += 10;
        }
      }
      if (matchedWordCount > 0) {
        reasons.push(`${matchedWordCount} kata kunci cocok`);
      }

      // Check Semantic concept match
      for (const [, concept] of Object.entries(LEGAL_CONCEPTS)) {
        const queryMatchesConcept = concept.terms.some(t => query.includes(t));
        if (queryMatchesConcept) {
          const articleMatchesConcept = concept.relatedArticleKeywords.some(k => fullText.includes(k));
          if (articleMatchesConcept) {
            score += concept.weight * 6;
            reasons.push('Korelasi semantik konsep hukum');
          }
        }
      }

      // Weight by legal hierarchy priority
      if (reg.type === 'PBI') score += 5;
      else if (reg.type === 'PADG') score += 3;
      else if (reg.type === 'PADG_INTERN') score += 4;

      if (score > 15) {
        matchedArticles.push({
          id: `${reg.id}-${art.articleNumber.replace(/\s+/g, '-')}`,
          regulationId: reg.id,
          regulationNumber: reg.number,
          regulationTitle: reg.title,
          regulationType: reg.type,
          year: reg.year,
          sector: reg.sector,
          jdihUrl: reg.jdihUrl,
          articleNumber: art.articleNumber,
          articleTitle: art.title,
          content: art.content,
          keyProhibitions: art.keyProhibitions,
          keyMandates: art.keyMandates,
          thresholds: art.thresholds,
          relevanceScore: score,
          matchedReason: reasons.join(' • '),
          source: 'regulation'
        });
      }
    }
  }

  // 2. Scan Corpus Petunjuk Teknis (Juknis Drafts)
  try {
    const drafts = getDrafts();
    for (const draft of drafts) {
      for (const chap of (draft.chapters || [])) {
        for (const art of (chap.articles || [])) {
          let score = 0;
          const reasons: string[] = [];
          const fullText = `${draft.code} ${draft.title} ${chap.chapterNumber} ${art.articleNumber} ${art.title} ${art.content} ${art.explanation || ''}`.toLowerCase();

          if (fullText.includes(query)) {
            score += 40;
            reasons.push('Kecocokan teks klausul Juknis');
          }

          let matchedWordCount = 0;
          for (const w of queryWords) {
            if (fullText.includes(w)) {
              matchedWordCount++;
              score += 8;
            }
          }

          for (const [, concept] of Object.entries(LEGAL_CONCEPTS)) {
            const queryMatchesConcept = concept.terms.some(t => query.includes(t));
            if (queryMatchesConcept && concept.relatedArticleKeywords.some(k => fullText.includes(k))) {
              score += concept.weight * 5;
              reasons.push('Korelasi materi Juknis');
            }
          }

          if (score > 15) {
            matchedArticles.push({
              id: `${draft.id}-${chap.id}-${art.id}`,
              regulationId: draft.id,
              regulationNumber: draft.code,
              regulationTitle: draft.title,
              regulationType: 'JUKNIS',
              year: draft.year || 2025,
              sector: draft.category,
              jdihUrl: `/draft/${draft.id}`,
              articleNumber: `${chap.chapterNumber} - ${art.articleNumber}`,
              articleTitle: art.title,
              content: art.content,
              keyProhibitions: art.explanation ? [art.explanation] : undefined,
              relevanceScore: score,
              matchedReason: reasons.join(' • ') || 'Klausul juknis terkait',
              source: 'juknis'
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error scanning juknis drafts for search', e);
  }

  // Sort by relevance score descending
  matchedArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Synthesize AI Executive Answer
  const aiAnswer = synthesizeAiAnswer(query, matchedArticles);

  const breakdown = {
    pbi: matchedArticles.filter(a => a.regulationType === 'PBI').length,
    padg: matchedArticles.filter(a => a.regulationType === 'PADG').length,
    padgIntern: matchedArticles.filter(a => a.regulationType === 'PADG_INTERN').length,
    juknis: matchedArticles.filter(a => a.regulationType === 'JUKNIS').length,
    se: matchedArticles.filter(a => a.regulationType === 'SE').length,
    uu: matchedArticles.filter(a => a.regulationType === 'UU').length
  };

  return {
    query: rawQuery,
    aiExecutiveAnswer: aiAnswer.summary,
    keyTakeaway: aiAnswer.takeaway,
    totalMatched: matchedArticles.length,
    hierarchyBreakdown: breakdown,
    articles: matchedArticles.slice(0, 100)
  };
}

function synthesizeAiAnswer(query: string, articles: SearchResultArticle[]): { summary: string; takeaway: string } {
  const q = query.toLowerCase();

  if (articles.length === 0) {
    return {
      summary: `Tidak ditemukan pasal yang secara eksplisit memuat kata kunci "${query}". Mohon gunakan kata kunci lain seperti "sanksi", "surcharge", "settlement", "retensi audit", "modal minimum", atau "templat juknis".`,
      takeaway: 'Coba ubah kata kunci pencarian atau gunakan prompt rekomendasi.'
    };
  }

  // 1. Sanksi / Denda
  if (q.includes('sanksi') || q.includes('denda') || q.includes('hukum')) {
    return {
      summary: 'Berdasarkan **Pasal 6 ayat (6) PADG Intern No. 66 Tahun 2025**, materi pengaturan mengenai sanksi administratif (denda finansial, teguran tertulis, maupun pencabutan izin) **HANYA boleh dimuat dalam PBI dan PDG**. Petunjuk Teknis (Juknis) dan PADG dilarang memuat sanksi administratif materiil secara mandiri. Untuk ketentuan sanksi PJP yang berlaku, rujukan payung hukum berada pada **Pasal 65 PBI No. 23/6/PBI/2021**.',
      takeaway: 'Juknis DILARANG memuat klausul sanksi administratif atau denda finansial.'
    };
  }

  // 2. Surcharge / Biaya Tambahan
  if (q.includes('surcharge') || q.includes('biaya tambahan') || q.includes('gesek') || q.includes('mdr')) {
    return {
      summary: 'Berdasarkan **Pasal 35 PBI No. 23/6/PBI/2021**, Penyelenggara Jasa Pembayaran (PJP) dan pedagang (merchant) secara tegas **DILARANG mengenakan biaya tambahan (surcharge)** atas transaksi pembayaran kepada konsumen. Selain itu, **Pasal 14 PADG No. 23/15/PADG/2021** menegaskan bahwa beban Merchant Discount Rate (MDR) tidak boleh dialihkan kepada pengguna akhir.',
      takeaway: 'Pelarangan mutlak pembebanan surcharge transaksi kepada konsumen.'
    };
  }

  // 3. Settlement / Kliring / Rekonsiliasi
  if (q.includes('settlement') || q.includes('kliring') || q.includes('cut-off') || q.includes('rekonsiliasi') || q.includes('t+1') || q.includes('t+2')) {
    return {
      summary: 'Sesuai dengan **Pasal 21 PADG No. 24/1/PADG/2022**, cut-off rekonsiliasi data transaksi harian wajib diselesaikan paling lambat pukul **23.59 WIB**, dan batas waktu penyelesaian (*settlement*) transaksi antar-pihak diselesaikan paling lambat pada **T+1 (satu hari kerja berikutnya)**. Klausul pada Juknis yang mengulur waktu settlement menjadi T+2 atau lebih bertentangan dengan ketentuan PADG ini.',
      takeaway: 'Cut-off transaksi maksimal 23.59 WIB dan settlement wajib T+1.'
    };
  }

  // 4. Retensi Log / Audit Trail
  if (q.includes('retensi') || q.includes('log') || q.includes('audit') || q.includes('5 tahun') || q.includes('simpan')) {
    return {
      summary: 'Berdasarkan tata kelola internal **Pasal 11 PADG Intern No. 25/2/PADG-Intern/2023**, seluruh petunjuk teknis operasional sistem pemrosesan transaksi wajib memuat kewajiban penyimpanan rekam jejak audit (*audit trail log*) paling sedikit selama **5 (lima) tahun berturut-turut** demi kepentingan audit kepatuhan dan integritas forensik data.',
      takeaway: 'Masa retensi rekam jejak audit (audit trail) wajib minimal 5 tahun.'
    };
  }

  // 5. Templat Juknis / Format Lampiran X
  if (q.includes('templat') || q.includes('template') || q.includes('format') || q.includes('lampiran x') || q.includes('bookman')) {
    return {
      summary: 'Berdasarkan **Pasal 23 dan Lampiran X PADG Intern No. 66 Tahun 2025**, Juknis di lingkungan Bank Indonesia wajib menggunakan salah satu dari 3 templat baku: **Templat 1** (Tugas & Proses Bisnis Satker), **Templat 2** (Aset, IT & Produk BI), atau **Templat 3** (Pihak Eksternal). Penomoran resmi wajib memuat kode `NOMOR [angka]/JUKNIS/[INTERNAL|EKSTERNAL]/[RUBRIK]/[TAHUN]` dengan huruf Bookman Old Style 12.',
      takeaway: 'Wajib mengadopsi 3 templat resmi dan struktur Lampiran X PADG Intern 66/2025.'
    };
  }

  // 6. Modal Minimum PJP
  if (q.includes('modal') || q.includes('15 miliar') || q.includes('disetor')) {
    return {
      summary: 'Berdasarkan **Pasal 18 PBI No. 23/6/PBI/2021**, PJP yang menyelenggarakan aktivitas penatausahaan sumber dana dan/atau penyediaan informasi sumber dana wajib memenuhi modal disetor paling sedikit **Rp15.000.000.000,00 (lima belas miliar rupiah)** sebagai prasyarat perizinan dan kelayakan operasional.',
      takeaway: 'Batas modal disetor minimum PJP penatausahaan dana adalah Rp15 Miliar.'
    };
  }

  // 7. Data Center & DRC
  if (q.includes('data center') || q.includes('drc') || q.includes('pusat data') || q.includes('server')) {
    return {
      summary: 'Berdasarkan **Pasal 42 PBI No. 23/6/PBI/2021**, PJP wajib menempatkan pusat data (*data center*) dan pusat pemulihan bencana (*disaster recovery center*) di dalam wilayah **Negara Kesatuan Republik Indonesia** demi perlindungan kedaulatan data dan kelancaran pengawasan Bank Indonesia.',
      takeaway: 'Penempatan DC dan DRC wajib berlokasi di wilayah Indonesia.'
    };
  }

  // Generic dynamic synthesis from top articles
  const topArticle = articles[0];
  const higherRegs = articles.filter(a => a.regulationType === 'PBI' || a.regulationType === 'PADG');
  const leadReg = higherRegs[0] || topArticle;

  return {
    summary: `Ditemukan **${articles.length} pasal terkait** penelusuran "${query}". Ketentuan utama diatur dalam **${leadReg.regulationNumber} ${leadReg.articleNumber}** (${leadReg.articleTitle}): "${leadReg.content}". ${leadReg.keyMandates?.length ? 'Kewajiban utama: ' + leadReg.keyMandates.join(', ') + '.' : ''} ${leadReg.keyProhibitions?.length ? 'Larangan utama: ' + leadReg.keyProhibitions.join(', ') + '.' : ''}`,
    takeaway: `Rujukan regulasi terkuat berada pada ${leadReg.regulationNumber} ${leadReg.articleNumber}.`
  };
}
