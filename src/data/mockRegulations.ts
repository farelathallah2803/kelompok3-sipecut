import { Regulation } from '@/types';

export const MOCK_REGULATIONS: Regulation[] = [
  {
    id: 'reg-padg-intern-66-2025',
    type: 'PADG_INTERN',
    number: 'PADG Intern No. 66 Tahun 2025',
    title: 'Pelaksanaan Pembentukan Peraturan di Bank Indonesia',
    year: 2025,
    sector: 'Pembentukan Peraturan',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/internal/padg-intern-66-2025',
    summary: 'Pedoman resmi dan standar templat pembentukan PBI, PDG, PADG, PADG Intern, serta Petunjuk Teknis (Juknis) di lingkungan Bank Indonesia.',
    articles: [
      {
        articleNumber: 'Pasal 6 ayat (6)',
        title: 'Pembatasan Materi Pengaturan Sanksi Administratif',
        content: 'Materi pengaturan mengenai sanksi administratif hanya dimuat dalam PBI dan PDG.',
        keyProhibitions: [
          'Juknis dilarang memuat sanksi administratif atau denda',
          'PADG dan Juknis tidak berwenang menciptakan sanksi materiil baru'
        ]
      },
      {
        articleNumber: 'Pasal 23',
        title: 'Kewajiban Penggunaan Templat Resmi Juknis',
        content: 'Pemrakarsa menyusun Juknis berdasarkan Templat Juknis: Templat 1 (pelaksanaan fungsi & tugas proses bisnis), Templat 2 (penggunaan & pemeliharaan aset/infrastruktur/digital/produk BI), atau Templat 3 (penjelasan teknis pihak eksternal).',
        keyMandates: ['Wajib memilih Templat 1, Templat 2, atau Templat 3 sesuai materi muatan']
      },
      {
        articleNumber: 'Pasal 64',
        title: 'Pengesahan dan Penomoran Juknis',
        content: 'Pemimpin Pemrakarsa melakukan pengesahan atas rancangan Juknis yang telah disusun. Juknis yang telah disahkan dilakukan penomoran oleh Pemrakarsa sesuai format penomoran Juknis dan disampaikan kepada Departemen Hukum melalui sistem informasi hukum di Bank Indonesia.',
        keyMandates: ['Pengesahan oleh Pemimpin Pemrakarsa', 'Penomoran dengan rubrik Satker', 'Penyampaian ke Departemen Hukum']
      },
      {
        articleNumber: 'Lampiran X Angka 1',
        title: 'Format Baku Penomoran Petunjuk Teknis',
        content: 'Nomor Juknis memuat keterangan: NOMOR [angka]/JUKNIS/[INTERNAL atau EKSTERNAL]/[RUBRIK SATKER]/[TAHUN]. Dalam hal Juknis bersifat rahasia, ditambahkan keterangan RAHASIA setelah tahun pengesahan.',
        thresholds: ['Format: NOMOR .../JUKNIS/INTERNAL|EKSTERNAL/RUBRIK/TAHUN']
      },
      {
        articleNumber: 'Lampiran X Keterangan',
        title: 'Standar Format Tata Naskah Juknis',
        content: 'Naskah Juknis diketik dengan jenis huruf Bookman Old Style ukuran 12 di atas kertas F4 (21 x 33 cm), margin 2,5 cm di setiap sisi, spasi 1 (single), dan penomoran romawi kecil pada bagian pengantar/pengesahan serta angka arab pada Bab I ke atas.',
        thresholds: ['Huruf Bookman Old Style 12', 'Kertas F4', 'Margin 2.5 cm']
      }
    ]
  },
  {
    id: 'reg-pbi-23-6',
    type: 'PBI',
    number: 'PBI No. 23/6/PBI/2021',
    title: 'Penyedia Jasa Pembayaran (PJP)',
    year: 2021,
    sector: 'Sistem Pembayaran',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/peraturan/pbi-23-06-2021',
    summary: 'Ketentuan payung hukum utama mengenai perizinan, tata kelola, permodalan, dan batas operasional Penyelenggara Jasa Pembayaran di Indonesia.',
    articles: [
      {
        articleNumber: 'Pasal 18',
        title: 'Batas Modal Disetor Minimum PJP',
        content: 'PJP yang menyelenggarakan aktivitas penatausahaan sumber dana dan/atau penyediaan informasi sumber dana wajib memenuhi modal disetor paling sedikit Rp15.000.000.000,00 (lima belas miliar rupiah).',
        thresholds: ['Minimal modal disetor Rp15.000.000.000'],
        keyMandates: ['Kewajiban pemenuhan modal minimum']
      },
      {
        articleNumber: 'Pasal 35',
        title: 'Larangan Pembebanan Biaya Tambahan (Surcharge)',
        content: 'PJP dan pedagang (merchant) dilarang mengenakan biaya tambahan (surcharge) atas transaksi pembayaran kepada pengguna akhir (konsumen).',
        keyProhibitions: [
          'Dilarang mengenakan surcharge',
          'Dilarang membebankan biaya tambahan kepada konsumen'
        ]
      },
      {
        articleNumber: 'Pasal 42',
        title: 'Keamanan Sistem dan Penempatan Data Center',
        content: 'PJP wajib menempatkan pusat data (data center) dan pusat pemulihan bencana (disaster recovery center) di dalam wilayah Negara Kesatuan Republik Indonesia demi kedaulatan dan keamanan data finansial nasional.',
        keyMandates: ['Penempatan DC dan DRC wajib di dalam wilayah Indonesia']
      },
      {
        articleNumber: 'Pasal 58',
        title: 'Batas Maksimum Transaksi Tanpa Otentikasi Tambahan',
        content: 'Batas maksimum nominal transaksi pembayaran tanpa otentikasi faktor ganda (two-factor authentication) ditetapkan paling banyak Rp1.000.000,00 (satu juta rupiah) per transaksi.',
        thresholds: ['Maksimal Rp1.000.000 tanpa 2FA']
      },
      {
        articleNumber: 'Pasal 65',
        title: 'Sanksi Administratif Pelanggaran Ketentuan PJP',
        content: 'PJP yang melanggar ketentuan dalam PBI ini dikenakan sanksi administratif berupa teguran tertulis, denda uang tunai paling banyak Rp1.000.000.000,00, pembatasan kegiatan usaha, hingga pencabutan izin PJP.',
        keyProhibitions: ['Sanksi denda dan pembatasan kegiatan usaha kewenangan PBI']
      }
    ]
  },
  {
    id: 'reg-padg-24-1',
    type: 'PADG',
    number: 'PADG No. 24/1/PADG/2022',
    title: 'Tata Cara Penyelenggaraan Sistem Pembayaran oleh Penyedia Jasa Pembayaran',
    year: 2022,
    sector: 'Sistem Pembayaran',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/peraturan/padg-24-01-2022',
    summary: 'Peraturan pelaksanaan turunan PBI mengenai standar teknis dan prosedur operasional PJP, termasuk standar SNAP dan batas waktu rekonsiliasi.',
    articles: [
      {
        articleNumber: 'Pasal 8',
        title: 'Standar Nasional Open API Pembayaran (SNAP)',
        content: 'PJP yang menghubungkan sistem layanan pembayaran melalui Application Programming Interface (API) wajib mengimplementasikan Standar Nasional Open API Pembayaran (SNAP) sesuai spesifikasi teknis Bank Indonesia.',
        keyMandates: ['Wajib mengadopsi standar SNAP']
      },
      {
        articleNumber: 'Pasal 21',
        title: 'Rekonsiliasi dan Settlement Transaksi Harian',
        content: 'PJP wajib melakukan rekonsiliasi data transaksi harian (cut-off) paling lambat pukul 23.59 WIB dan menyelesaikan settlement antar-pihak maksimal T+1 hari kerja.',
        thresholds: ['Cut-off 23.59 WIB', 'Settlement maksimal T+1 hari kerja']
      },
      {
        articleNumber: 'Pasal 33',
        title: 'Pengujian Inovasi dan Uji Coba Sandbox',
        content: 'PJP yang mengembangkan teknologi pembayaran baru wajib mengikuti proses uji coba pada Regulatory Sandbox Bank Indonesia dengan masa uji coba paling lama 12 (dua belas) bulan.',
        thresholds: ['Masa sandbox maksimal 12 bulan']
      }
    ]
  },
  {
    id: 'reg-padg-intern-25-2',
    type: 'PADG_INTERN',
    number: 'PADG Intern No. 25/2/PADG-Intern/2023',
    title: 'Tata Kelola dan Manajemen Risiko Operasional Penyusunan Ketentuan Teknis Internal',
    year: 2023,
    sector: 'Manajemen Risiko & Tata Kelola',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/internal/padg-intern-25-02-2023',
    summary: 'Pedoman tata kelola internal Bank Indonesia dalam menyusun petunjuk teknis, standar operasional prosedur, dan mitigasi risiko kepatuhan.',
    articles: [
      {
        articleNumber: 'Pasal 4',
        title: 'Kewajiban Analisis Risiko oleh DMR',
        content: 'Setiap rancangan petunjuk teknis yang mengatur mekanisme transaksi, infrastruktur kritis, atau berhubungan langsung dengan pihak eksternal wajib memperoleh telaah dan rekomendasi manajemen risiko dari Departemen Manajemen Risiko (DMR) sebelum diajukan ke Departemen Hukum.',
        keyMandates: ['Wajib telaah risiko oleh DMR sebelum ke DHUK']
      },
      {
        articleNumber: 'Pasal 11',
        title: 'Masa Retensi Audit Trail dan Log Sistem',
        content: 'Seluruh petunjuk teknis operasional sistem pemrosesan transaksi wajib memuat klausul masa retensi pencatatan rekam jejak audit (audit trail log) paling sedikit selama 5 (lima) tahun berturut-turut.',
        thresholds: ['Masa retensi audit trail minimal 5 tahun']
      }
    ]
  },
  {
    id: 'reg-pbi-22-23',
    type: 'PBI',
    number: 'PBI No. 22/23/PBI/2020',
    title: 'Sistem Pembayaran',
    year: 2020,
    sector: 'Sistem Pembayaran',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/peraturan/pbi-22-23-2020',
    summary: 'Prinsip dasar perlindungan konsumen, interkoneksi, interoperabilitas, serta manajemen risiko dalam sistem pembayaran nasional.',
    articles: [
      {
        articleNumber: 'Pasal 12',
        title: 'Prinsip Interoperabilitas dan Keterbukaan',
        content: 'Penyelenggara infrastruktur sistem pembayaran wajib menerapkan prinsip interoperabilitas dan interkonektivitas secara terbuka, wajar, dan non-diskriminatif.',
        keyMandates: ['Kewajiban interoperabilitas terbuka']
      },
      {
        articleNumber: 'Pasal 27',
        title: 'Jangka Waktu Penyelesaian Pengaduan Konsumen',
        content: 'Penyelenggara wajib menyelesaikan pengaduan nasabah yang tidak memerlukan penelitian lanjutan dalam jangka waktu paling lambat 14 (empat belas) hari kerja sejak pengaduan diterima.',
        thresholds: ['Maksimal 14 hari kerja penanganan aduan nasabah']
      }
    ]
  },
  {
    id: 'reg-padg-23-15',
    type: 'PADG',
    number: 'PADG No. 23/15/PADG/2021',
    title: 'Tata Cara Pelaksanaan Standar Nasional Quick Response Code Pembayaran (QRIS)',
    year: 2021,
    sector: 'Sistem Pembayaran',
    status: 'Berlaku',
    jdihUrl: 'https://jdih.bi.go.id/id/peraturan/padg-23-15-2021',
    summary: 'Ketentuan batas nominal transaksi, Merchant Discount Rate (MDR), spesifikasi teknis QR MPM dan CPM, serta interkoneksi QRIS antarnegara.',
    articles: [
      {
        articleNumber: 'Pasal 6',
        title: 'Batas Nominal Transaksi QRIS',
        content: 'Batas nominal transaksi QRIS ditetapkan paling banyak Rp10.000.000,00 (sepuluh juta rupiah) per transaksi, kecuali ditetapkan lain oleh Bank Indonesia untuk segmen transaksi tertentu.',
        thresholds: ['Maksimal Rp10.000.000 per transaksi QRIS']
      },
      {
        articleNumber: 'Pasal 14',
        title: 'Merchant Discount Rate (MDR) dan Beban Biaya Transaksi',
        content: 'Penyelenggara QRIS wajib menerapkan skema Merchant Discount Rate (MDR) sesuai besaran yang ditetapkan Bank Indonesia dan dilarang membebankan MDR kepada konsumen atau pengguna akhir.',
        keyProhibitions: ['Dilarang mengalihkan beban MDR ke pembeli/konsumen']
      }
    ]
  }
];
