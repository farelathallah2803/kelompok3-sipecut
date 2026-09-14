import { PetunjukTeknisDraft, DEFAULT_BI_TYPOGRAPHY } from '@/types';

export const INITIAL_DRAFTS: PetunjukTeknisDraft[] = [
  {
    id: 'draft-001',
    workflowType: 'juknis',
    code: 'NOMOR 1/JUKNIS/INTERNAL/DKSP/2025',
    title: 'Rancangan Perubahan Petunjuk Teknis Penyelenggaraan Transaksi Pembayaran Lintas Batas (Cross-Border QRIS) dan Mekanisme Rekonsiliasi Settlement',
    templateType: 'templat_1',
    isConfidential: false,
    scope: 'INTERNAL',
    rubrikSatker: 'DKSP',
    year: 2025,
    category: 'Sistem Pembayaran',
    unitKerja: 'Departemen Kebijakan Sistem Pembayaran (DKSP)',
    proposerName: 'Ahmad Fauzi',
    currentStage: 'juknis_reviu_teknis',
    status: 'in_review',
    typography: { ...DEFAULT_BI_TYPOGRAPHY },
    createdAt: '2025-09-02T08:30:00Z',
    updatedAt: '2025-12-15T14:15:00Z',
    foreword: 'Puji syukur dipanjatkan ke hadirat Tuhan Yang Maha Esa, Petunjuk Teknis Penyelenggaraan Transaksi Pembayaran Lintas Batas (Cross-Border QRIS) ini disusun untuk memberikan panduan rinci bagi unit kerja pelaksana di Bank Indonesia dalam mengawasi dan memfasilitasi transaksi interkoneksi sistem pembayaran bilateral kawasan ASEAN.',
    validation: {
      place: 'Jakarta',
      date: '2025-12-20',
      effectiveDate: '2026-01-01',
      officialName: 'Filianingsih Hendrata',
      officialPosition: 'Kepala Departemen Kebijakan Sistem Pembayaran',
      rank: 'Direktur Eksekutif'
    },
    revocations: [
      {
        id: 'revoc-1',
        number: 'NOMOR 4/JUKNIS/INTERNAL/DKSP/2023',
        date: '2023-05-10',
        title: 'Petunjuk Teknis Pengawasan Awal Transaksi QRIS Bilateral Thailand',
        actionType: 'mencabut',
        revokedSection: 'Seluruh ketentuan dalam Juknis 2023'
      }
    ],
    generalProvisions: {
      background: 'Dalam rangka memperluas interkoneksi sistem pembayaran lintas negara (cross-border payment) di kawasan ASEAN serta memastikan kelancaran transaksi valuta asing dan mitigasi risiko settlement bilateral, diperlukan petunjuk teknis operasional bagi unit pelaksana dan PJP mitra.',
      legalBases: [
        'PBI No. 23/6/PBI/2021',
        'PADG No. 24/1/PADG/2022',
        'PADG No. 23/15/PADG/2021',
        'PADG Intern No. 66 Tahun 2025'
      ],
      purpose: 'Menetapkan standar prosedur operasional pelaksanaan pemantauan settlement, mitigasi risiko kurs valuta asing, dan penegakan kepatuhan PJP lintas negara.',
      definitions: [
        {
          id: 'def-1',
          term: 'Transaksi Cross-Border QRIS',
          meaning: 'Transaksi pembayaran menggunakan kode QR standar Indonesia yang dilakukan oleh wisatawan asing di Indonesia atau pengguna Indonesia di negara mitra yang terkoneksi secara bilateral.'
        },
        {
          id: 'def-2',
          term: 'Penyelesaian Settlement Bilateral',
          meaning: 'Proses pembukuan akhir pemindahan dana antar-bank sentral atau lembaga switching bilateral yang telah ditunjuk.'
        }
      ],
      scope: 'Ruang lingkup Juknis ini meliputi mekanisme operasional verifikasi switching, rekonsiliasi batch transaksi harian, pengelolaan cadangan devisa penyangga, dan penanganan sengketa transaksi lintas batas.',
      orgStructure: 'Divisi Pengembangan Layanan dan Kemitraan (DPLK), Divisi Pengawasan Infrastruktur Sistem Pembayaran (DPISP), dan Kelompok Pengendalian Risiko Operasional.',
      mainDuties: 'Melaksanakan pengawasan operasional harian, rekonsiliasi laporan berkala PJP, serta koordinasi teknis dengan otoritas moneter mitra luar negeri.',
      resources: 'Sistem BI-FAST, Aplikasi Monitoring QRIS Cross-Border (MQCB), Portal LIMS Bank Indonesia, dan Database SI-JUKNIS.'
    },
    chapters: [
      {
        id: 'chap-1',
        chapterNumber: 'BAB II',
        title: 'ALUR PROSES BISNIS DAN TAHAPAN KEGIATAN REKONSILIASI',
        articles: [
          {
            id: 'art-1',
            articleNumber: 'Bagian 1',
            title: 'Verifikasi Protokol Antarmuka API SNAP',
            content: '(1) PJP yang menghubungkan sistem layanan pembayaran melalui **Application Programming Interface (API)** wajib mengimplementasikan **Standar Nasional Open API Pembayaran (SNAP)** sesuai spesifikasi teknis Bank Indonesia.\n(2) Pelaksanaan pengujian interoperabilitas wajib memperoleh verifikasi resmi dari <u>Bank Indonesia</u>.',
            explanation: 'Menguji interoperabilitas *interface protocol* komunikasi antarnegara.'
          },
          {
            id: 'art-2',
            articleNumber: 'Bagian 2',
            title: 'Batas Nominal Per Transaksi',
            content: '(1) Nominal transaksi **Cross-Border QRIS** per transaksi ditetapkan batas maksimal sebesar **Rp15.000.000,00 (lima belas juta rupiah)** per pengguna dalam satu hari kerja.\n(2) Ketentuan batas nominal sebagaimana dimaksud pada ayat (1) dapat dievaluasi secara berkala dengan persetujuan pimpinan satker.',
            explanation: 'Batas operasional belanja wisatawan mancanegara.'
          }
        ]
      },
      {
        id: 'chap-2',
        chapterNumber: 'BAB III',
        title: 'PEMBAGIAN KEWENANGAN DAN TATA CARA SETTLEMENT',
        articles: [
          {
            id: 'art-3',
            articleNumber: 'Bagian 1',
            title: 'Pembebanan Biaya Tambahan Layanan Konversi',
            content: 'PJP penyelenggara dan merchant diperkenankan membebankan biaya tambahan layanan valuta asing (surcharge forex) langsung kepada konsumen sebesar maksimal 1.5% dari nilai transaksi apabila nilai tukar mengalami volatilitas tinggi.',
            explanation: 'Usulan penyerapan risiko kurs.'
          },
          {
            id: 'art-4',
            articleNumber: 'Bagian 2',
            title: 'Jadwal Rekonsiliasi dan Batas Waktu Settlement',
            content: 'Penyelesaian settlement transaksi bilateral antar-PJP diselesaikan paling lambat pada T+2 (dua hari kerja berikutnya) setelah tanggal transaksi diproses.',
            explanation: 'Jeda pertukaran batch internasional.'
          },
          {
            id: 'art-5',
            articleNumber: 'Bagian 3',
            title: 'Ketentuan Sanksi Denda Keterlambatan',
            content: 'PJP yang terlambat mengirimkan laporan settlement harian dikenakan sanksi administratif berupa denda finansial sebesar Rp5.000.000,00 per hari kerja.',
            explanation: 'Klausul sanksi administratif yang diajukan pemrakarsa.'
          }
        ]
      }
    ],
    attachments: [
      {
        id: 'att-1',
        title: 'Flowchart SOP Rekonsiliasi Settlement Cross-Border QRIS',
        type: 'flowchart',
        content: 'Diagram alir proses verifikasi batch, matching data kliring, validasi kurs acuan JISDOR, hingga settlement akhir di rekening nostro/vostro.'
      },
      {
        id: 'att-2',
        title: 'Formulir Laporan Ketidaksesuaian Batch Transaksi (Form LKBT-01)',
        type: 'form',
        content: 'Format formulir resmi pemberitahuan selisih transaksi antara PJP domestik dan switching mitra bilateral.'
      }
    ],
    reviewNotes: [
      {
        id: 'rev-01',
        stage: 'juknis_penyusunan',
        reviewerRole: 'pimpinan_satker',
        reviewerName: 'Dr. Hendra Gunawan, S.E., M.B.A.',
        department: 'Kepala Satuan Kerja Pemrakarsa (DKSP)',
        decision: 'approve',
        notes: 'Rancangan perubahan petunjuk teknis telah selesai disusun oleh satker pemrakarsa DKSP. Diteruskan ke tahap Reviu Teknis Terpadu oleh DHk, DMR, dan DAI.',
        createdAt: '2025-12-22T10:00:00Z'
      }
    ],
    history: [
      {
        id: 'log-1',
        timestamp: '2025-09-02T08:30:00Z',
        actor: 'Ahmad Fauzi',
        role: 'Drafter Unit Kerja',
        action: 'Penyusunan Rancangan oleh Satker Pemrakarsa',
        stage: 'juknis_penyusunan',
        details: 'Menyusun draf perubahan juknis fungsi dan proses bisnis sesuai Lampiran X PADG Intern 66/2025.'
      },
      {
        id: 'log-2',
        timestamp: '2025-12-22T10:00:00Z',
        actor: 'Dr. Hendra Gunawan',
        role: 'Pimpinan Satker Pemrakarsa',
        action: 'Persetujuan Satker Pemrakarsa',
        stage: 'juknis_penyusunan',
        details: 'Menyetujui draft untuk diteruskan ke Reviu Teknis (DHk, DMR, DAI).'
      }
    ]
  },
  {
    id: 'draft-002',
    workflowType: 'padg',
    code: 'NOMOR 27/12/PADG/2025',
    title: 'Rancangan Peraturan Anggota Dewan Gubernur tentang Pedoman Pengoperasian Infrastruktur Layanan Transaksi Ritel Seketika BI-FAST',
    templateType: 'templat_2',
    isConfidential: true,
    scope: 'INTERNAL',
    rubrikSatker: 'DTI',
    year: 2025,
    category: 'Manajemen Risiko & Tata Kelola',
    unitKerja: 'Departemen Teknologi Informasi (DTI)',
    proposerName: 'Siti Rahmadani',
    currentStage: 'padg_legal_closing',
    status: 'in_review',
    createdAt: '2025-10-15T09:00:00Z',
    updatedAt: '2025-12-28T16:45:00Z',
    foreword: 'Petunjuk teknis ini memuat panduan detail bagi administrator sistem dan engineer DTI dalam pemeliharaan berkala dan failover server BI-FAST.',
    validation: {
      place: 'Jakarta',
      date: '2025-12-30',
      effectiveDate: '2026-01-05',
      officialName: 'Bambang Santoso',
      officialPosition: 'Kepala Departemen Teknologi Informasi',
      rank: 'Direktur Eksekutif'
    },
    revocations: [],
    generalProvisions: {
      background: 'Menjaga ketersediaan sistem 99.99% (high availability) pada pemrosesan transaksi ritel seketika BI-FAST melalui SOP pengoperasian dan tanggap darurat insiden yang terstandar.',
      legalBases: [
        'PBI No. 22/23/PBI/2020',
        'PADG No. 24/1/PADG/2022',
        'PADG Intern No. 66 Tahun 2025'
      ],
      purpose: 'Menjadi panduan operasional teknis standar penggunaan, perawatan, dan eskalasi penanganan gangguan infrastruktur server transaksi inti.',
      definitions: [
        {
          id: 'def-t2-1',
          term: 'High Availability Cluster',
          meaning: 'Konfigurasi server ganda aktif-aktif yang menjamin pergantian beban seketika tanpa downtime.'
        }
      ],
      scope: 'Pengoperasian server database, gateway switching, load balancer, dan backup replication storage.',
      resources: 'Hardware server blade, OS Linux Enterprise, Oracle DB, dan tools monitoring Zabbix/Grafana.'
    },
    chapters: [
      {
        id: 'chap-t2-1',
        chapterNumber: 'BAB II',
        title: 'PANDUAN LANGKAH PENGOPERASIAN DAN PEMELIHARAAN INFRASTRUKTUR',
        articles: [
          {
            id: 'art-t2-1',
            articleNumber: 'Bagian 1',
            title: 'Prosedur Health-Check Harian Server',
            content: 'Setiap pukul 05.00 WIB engineer on-duty wajib mengeksekusi skrip diagnostik otomatis dan memverifikasi kapasitas utilisasi CPU di bawah ambang batas 70%.',
            explanation: 'Pemeriksaan preventif sebelum jam beban puncak transaksi.'
          }
        ]
      }
    ],
    attachments: [
      {
        id: 'att-t2-1',
        title: 'Matriks Eskalasi Insiden Severity 1-4',
        type: 'table',
        content: 'Daftar nomor kontak darurat dan waktu respons maksimal: Sev 1 (15 menit), Sev 2 (30 menit).'
      }
    ],
    reviewNotes: [
      {
        id: 'rev-201',
        stage: 'padg_legal_review',
        reviewerRole: 'dhuk_legal',
        reviewerName: 'Sarah Wijaya, S.H., LL.M.',
        department: 'Departemen Hukum (DHk)',
        decision: 'approve',
        notes: 'Legal review substansi selesai. Norma aturan selaras dengan PBI No. 23/6/PBI/2021 dan hierarki hukum terpenuhi. Sesuai tata kelola PADG, tahapan langsung berlanjut ke Legal Closing (skip harmonisasi antarkementerian).',
        createdAt: '2025-12-10T09:15:00Z'
      }
    ],
    history: [
      {
        id: 'log-t2-1',
        timestamp: '2025-10-15T09:00:00Z',
        actor: 'Siti Rahmadani',
        role: 'Drafter Unit Kerja',
        action: 'Penyusunan R-PADG Infrastruktur Transaksi BI-FAST',
        stage: 'padg_legal_review'
      },
      {
        id: 'log-t2-2',
        timestamp: '2025-12-10T09:15:00Z',
        actor: 'Sarah Wijaya, S.H., LL.M.',
        role: 'DHk Legal Reviewer',
        action: 'Persetujuan Legal Review DHk',
        stage: 'padg_legal_review',
        details: 'Draft disetujui untuk proses Legal Closing oleh Tim Perancang Regulasi DHk.'
      }
    ]
  },
  {
    id: 'draft-003',
    workflowType: 'pbi',
    code: 'NOMOR 27/3/PBI/2025',
    title: 'Rancangan Peraturan Bank Indonesia tentang Penyelenggaraan dan Tata Kelola Inovasi Teknologi Sektor Keuangan',
    templateType: 'templat_3',
    isConfidential: false,
    scope: 'EKSTERNAL',
    rubrikSatker: 'DKSP',
    year: 2025,
    category: 'Sistem Pembayaran',
    unitKerja: 'Departemen Kebijakan Sistem Pembayaran (DKSP)',
    proposerName: 'Dimas Wicaksono',
    currentStage: 'pbi_harmonisasi',
    status: 'in_review',
    createdAt: '2025-12-01T13:00:00Z',
    updatedAt: '2025-12-14T10:20:00Z',
    foreword: 'Peraturan Bank Indonesia ini diterbitkan sebagai payung hukum utama penyelenggaraan inovasi teknologi sektor keuangan, kerangka regulatory sandbox, dan perlindungan konsumen di Indonesia.',
    validation: {
      place: 'Jakarta',
      date: '2025-12-14',
      effectiveDate: '2026-01-01',
      officialName: 'Perry Warjiyo',
      officialPosition: 'Gubernur Bank Indonesia',
      rank: 'Gubernur'
    },
    revocations: [],
    generalProvisions: {
      background: 'Untuk memfasilitasi perkembangan ekosistem inovasi teknologi sektor keuangan yang aman, berdaya saing, dan selaras dengan standar regulasi internasional serta undang-undang nasional.',
      legalBases: [
        'UU No. 23 Tahun 1999 tentang Bank Indonesia',
        'UU No. 4 Tahun 2023 tentang P2SK',
        'PBI No. 23/6/PBI/2021'
      ],
      purpose: 'Menyediakan landasan regulasi yang komprehensif bagi pelaku ITSK, pengawasan berbasis risiko, dan mekanisme regulatory sandbox.',
      definitions: [
        {
          id: 'def-t3-1',
          term: 'Inovasi Teknologi Sektor Keuangan (ITSK)',
          meaning: 'Inovasi berbasis teknologi yang berdampak pada produk, layanan, dan model bisnis di sektor keuangan.'
        }
      ],
      scope: 'Penyelenggara teknologi finansial, perizinan, pengawasan kepatuhan, tata kelola data, dan perlindungan konsumen nasional.'
    },
    chapters: [
      {
        id: 'chap-t3-1',
        chapterNumber: 'BAB II',
        title: 'RUANG LINGKUP PENYELENGGARAAN DAN PERIZINAN ITSK',
        articles: [
          {
            id: 'art-t3-1',
            articleNumber: 'Pasal 4',
            title: 'Kewajiban Perizinan Penyelenggara',
            content: 'Setiap pihak yang menyelenggarakan kegiatan ITSK wajib memperoleh izin atau penetapan dari Bank Indonesia sesuai dengan kategori klasifikasi aktivitas.',
            explanation: 'Ketentuan payung hukum mengikat seluruh entitas eksternal.'
          }
        ]
      }
    ],
    attachments: [
      {
        id: 'att-t3-1',
        title: 'Matriks Klasifikasi Klaster Inovasi Sektor Keuangan',
        type: 'table',
        content: 'Klaster payment, market aggregator, wealthtech, dan scoring credit data.'
      }
    ],
    reviewNotes: [
      {
        id: 'rev-301',
        stage: 'pbi_legal_review',
        reviewerRole: 'dhuk_legal',
        reviewerName: 'Dr. Bambang Kusumo, S.H., M.H.',
        department: 'Departemen Hukum (DHk)',
        decision: 'approve',
        notes: 'Hasil telaah hukum: Draft R-PBI telah memenuhi kaidah pembentukan peraturan perundang-undangan UU BI & UU P2SK. Diteruskan ke forum Harmonisasi bersama Kementerian Hukum & HAM dan Kementerian Keuangan.',
        createdAt: '2025-12-15T11:00:00Z'
      }
    ],
    history: [
      {
        id: 'log-t3-1',
        timestamp: '2025-12-01T13:00:00Z',
        actor: 'Dimas Wicaksono',
        role: 'Drafter Satker',
        action: 'Penyusunan R-PBI Tata Kelola Inovasi Teknologi',
        stage: 'pbi_legal_review'
      },
      {
        id: 'log-t3-2',
        timestamp: '2025-12-15T11:00:00Z',
        actor: 'Dr. Bambang Kusumo, S.H., M.H.',
        role: 'DHk Legal Reviewer',
        action: 'Legal Review Disetujui',
        stage: 'pbi_legal_review',
        details: 'Diteruskan ke tahap Harmonisasi bersama Kemenkum dan Kemenkeu.'
      }
    ]
  }
];
