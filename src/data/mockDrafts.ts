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
    proposerName: 'Tim Drafter DKSP',
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
      resources: 'Sistem BI-FAST, Aplikasi Monitoring QRIS Cross-Border (MQCB), Portal LIMS Bank Indonesia, dan Database PRISMA.'
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
        actor: 'Tim Drafter DKSP',
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
    workflowType: 'juknis',
    code: 'NOMOR 2/JUKNIS/INTERNAL/DLDS/2025',
    title: 'Rancangan Petunjuk Teknis Tata Cara Pemeliharaan dan Pengoperasian Infrastruktur Server Layanan Transaksi Ritel Seketika BI-FAST',
    templateType: 'templat_2',
    isConfidential: true,
    scope: 'INTERNAL',
    rubrikSatker: 'DLDS',
    year: 2025,
    category: 'Manajemen Risiko & Tata Kelola',
    unitKerja: 'Departemen Layanan Digital & Keamanan Siber (DLDS)',
    proposerName: 'Siti Rahmadani',
    currentStage: 'juknis_evaluasi_dmst',
    status: 'in_review',
    createdAt: '2025-10-15T09:00:00Z',
    updatedAt: '2025-12-28T16:45:00Z',
    foreword: 'Petunjuk teknis ini memuat panduan detail bagi administrator sistem dan engineer DLDS dalam pemeliharaan berkala dan failover server BI-FAST.',
    validation: {
      place: 'Jakarta',
      date: '2025-12-30',
      effectiveDate: '2026-01-05',
      officialName: 'Bambang Santoso',
      officialPosition: 'Kepala Departemen Layanan Digital & Keamanan Siber',
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
        stage: 'juknis_reviu_teknis',
        reviewerRole: 'dhuk_legal',
        reviewerName: 'Sarah Wijaya, S.H., LL.M.',
        department: 'Departemen Hukum (DHk)',
        decision: 'approve',
        notes: 'Hasil Reviu Teknis: Format naskah telah memenuhi Templat 2 Lampiran X PADG Intern No. 66 Tahun 2025. Diteruskan ke evaluasi tata kelola DMST.',
        createdAt: '2025-12-10T09:15:00Z'
      }
    ],
    history: [
      {
        id: 'log-t2-1',
        timestamp: '2025-10-15T09:00:00Z',
        actor: 'Siti Rahmadani',
        role: 'Drafter Unit Kerja',
        action: 'Penyusunan Juknis Pemeliharaan Server BI-FAST',
        stage: 'juknis_penyusunan'
      },
      {
        id: 'log-t2-2',
        timestamp: '2025-12-10T09:15:00Z',
        actor: 'Sarah Wijaya, S.H., LL.M.',
        role: 'DHk Legal Reviewer',
        action: 'Persetujuan Reviu Teknis Terpadu',
        stage: 'juknis_reviu_teknis',
        details: 'Draft disetujui untuk proses evaluasi tata kelola oleh DMST.'
      }
    ]
  },
  {
    id: 'draft-003',
    workflowType: 'juknis',
    code: 'NOMOR 1/JUKNIS/EKSTERNAL/DKSP/2025',
    title: 'Rancangan Petunjuk Teknis Penjelasan Standar Terbuka Layanan Antarmuka (SNAP) bagi Penyelenggara Jasa Pembayaran',
    templateType: 'templat_3',
    isConfidential: false,
    scope: 'EKSTERNAL',
    rubrikSatker: 'DKSP',
    year: 2025,
    category: 'Sistem Pembayaran',
    unitKerja: 'Departemen Kebijakan Sistem Pembayaran (DKSP)',
    proposerName: 'Dimas Wicaksono',
    currentStage: 'juknis_persetujuan_adg',
    status: 'in_review',
    createdAt: '2025-12-01T13:00:00Z',
    updatedAt: '2025-12-14T10:20:00Z',
    foreword: 'Petunjuk teknis ini diterbitkan sebagai pedoman penjelasan teknis (Templat 3) bagi Penyelenggara Jasa Pembayaran dalam mengimplementasikan Standar Nasional Open API Pembayaran (SNAP).',
    validation: {
      place: 'Jakarta',
      date: '2025-12-14',
      effectiveDate: '2026-01-01',
      officialName: 'Filianingsih Hendrata',
      officialPosition: 'Kepala Departemen Kebijakan Sistem Pembayaran',
      rank: 'Direktur Eksekutif'
    },
    revocations: [],
    generalProvisions: {
      background: 'Untuk memfasilitasi interkoneksi dan interoperabilitas sistem pembayaran yang aman dan handal, diperlukan petunjuk teknis penjelasan eksternal mengenai spesifikasi arsitektur SNAP.',
      legalBases: [
        'PBI No. 23/6/PBI/2021',
        'PADG No. 23/15/PADG/2021',
        'PADG Intern No. 66 Tahun 2025'
      ],
      purpose: 'Menyediakan panduan teknis implementasi API SNAP bagi PJP dan pengembang eksternal.',
      definitions: [
        {
          id: 'def-t3-1',
          term: 'Standar Nasional Open API Pembayaran (SNAP)',
          meaning: 'Standar nasional yang ditetapkan Bank Indonesia mencakup standar teknis dan keamanan Open API.'
        }
      ],
      scope: 'Penyelenggara Jasa Pembayaran, verifikasi pengujian, manajemen persetujuan akses API, dan penanganan insiden antarmuka.'
    },
    chapters: [
      {
        id: 'chap-t3-1',
        chapterNumber: 'BAB II',
        title: 'RUANG LINGKUP IMPLEMENTASI SPESIFIKASI API SNAP',
        articles: [
          {
            id: 'art-t3-1',
            articleNumber: 'Bagian 1',
            title: 'Kewajiban Pengujian Kompatibilitas',
            content: 'Setiap PJP yang menghubungkan antarmuka pembayaran wajib melalui proses Sandbox Uji Coba Terbatas sebelum integrasi ke jaringan produksi.',
            explanation: 'Ketentuan teknis operasional bagi pihak eksternal.'
          }
        ]
      }
    ],
    attachments: [
      {
        id: 'att-t3-1',
        title: 'Matriks Payload Error Code dan HTTP Response SNAP',
        type: 'table',
        content: 'Daftar kode status 200, 400, 401, 500 serta format payload respon JSON baku.'
      }
    ],
    reviewNotes: [
      {
        id: 'rev-301',
        stage: 'juknis_pembahasan_rdg',
        reviewerRole: 'sekretariat_rdg',
        reviewerName: 'Sekretariat Dewan Gubernur',
        department: 'Sekretariat RDG',
        decision: 'approve',
        notes: 'Hasil Pembahasan RDG: Pokok-pokok petunjuk teknis telah disetujui dalam Rapat Dewan Gubernur. Diteruskan ke ADG Pembina untuk pengesahan.',
        createdAt: '2025-12-15T11:00:00Z'
      }
    ],
    history: [
      {
        id: 'log-t3-1',
        timestamp: '2025-12-01T13:00:00Z',
        actor: 'Dimas Wicaksono',
        role: 'Drafter Satker',
        action: 'Penyusunan Juknis Eksternal SNAP',
        stage: 'juknis_penyusunan'
      },
      {
        id: 'log-t3-2',
        timestamp: '2025-12-15T11:00:00Z',
        actor: 'Sekretariat Dewan Gubernur',
        role: 'Sekretariat RDG',
        action: 'Persetujuan Pembahasan RDG',
        stage: 'juknis_pembahasan_rdg',
        details: 'Diteruskan untuk penandatanganan pengesahan oleh ADG Pembina.'
      }
    ]
  }
];
