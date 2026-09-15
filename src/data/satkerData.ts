export type SatkerSector =
  | 'Moneter'
  | 'Makroprudensial'
  | 'Sistem Pembayaran'
  | 'Pendukung Kebijakan'
  | 'Pendukung Organisasi'
  | 'Jaringan Kantor';

export interface SatuanKerja {
  code: string;
  no: string;
  name: string;
  sector: SatkerSector;
  description: string;
  accentColor: string;
  badgeColor: string;
}

export const SATUAN_KERJA_LIST: SatuanKerja[] = [
  {
    "code": "DKEM",
    "no": "No. 01",
    "name": "Departemen Kebijakan Ekonomi dan Moneter",
    "sector": "Moneter",
    "description": "Memberikan rekomendasi kebijakan ekonomi dan moneter yang tepat berdasarkan riset, analisis, dan proyeksi ekonomi, moneter dan sektor keuangan guna mendukung pencapaian kestabilan nilai Rupiah.",
    "accentColor": "border-t-blue-600",
    "badgeColor": "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    "code": "DPMA",
    "no": "No. 02",
    "name": "Departemen Pengelolaan Moneter & Aset Sekuritas",
    "sector": "Moneter",
    "description": "Melaksanakan kebijakan moneter melalui pengelolaan uang Rupiah dan valuta asing (valas), serta aset sekuritas. Departemen ini berperan dalam operasi moneter pasar uang dan pasar valas.",
    "accentColor": "border-t-blue-600",
    "badgeColor": "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    "code": "DPD",
    "no": "No. 03",
    "name": "Departemen Pengelolaan Devisa",
    "sector": "Moneter",
    "description": "Mendukung pelaksanaan kebijakan moneter yang memerlukan cadangan devisa dalam jumlah yang dianggap cukup, melalui peningkatan nilai dan likuiditas cadangan devisa.",
    "accentColor": "border-t-blue-600",
    "badgeColor": "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    "code": "DPPK",
    "no": "No. 04",
    "name": "Departemen Pengembangan Pasar Keuangan",
    "sector": "Moneter",
    "description": "Mengatur, mengembangkan, dan mengawasi pasar uang serta valuta asing. Fungsinya bertujuan menciptakan pasar keuangan modern, likuid, dalam, dan efisien.",
    "accentColor": "border-t-blue-600",
    "badgeColor": "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    "code": "DEKS",
    "no": "No. 05",
    "name": "Departemen Ekonomi dan Keuangan Syariah",
    "sector": "Moneter",
    "description": "Merumuskan kebijakan dan melaksanakan strategi pengembangan Ekonomi dan Keuangan Syariah, berdasarkan hasil riset dan analisis yang komprehensif.",
    "accentColor": "border-t-blue-600",
    "badgeColor": "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    "code": "DKMP",
    "no": "No. 06",
    "name": "Departemen Kebijakan Makroprudensial",
    "sector": "Makroprudensial",
    "description": "Memberikan rekomendasi kebijakan makroprudensial berdasarkan asesmen, riset, proyeksi dalam rangka menjaga stabilitas sistem keuangan.",
    "accentColor": "border-t-emerald-500",
    "badgeColor": "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    "code": "DSMM",
    "no": "No. 07",
    "name": "Departemen Surveilans Makroprudensial, Moneter, dan Market",
    "sector": "Makroprudensial",
    "description": "Mewujudkan pengawasan makroprudensial, moneter, dan market yang terintegrasi, risk based, forward looking, dan berbasis digital guna menjaga stabilitas sistem keuangan.",
    "accentColor": "border-t-emerald-500",
    "badgeColor": "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    "code": "DSPK",
    "no": "No. 08",
    "name": "Departemen Surveilans Sistem Pembayaran dan Perlindungan Konsumen",
    "sector": "Makroprudensial",
    "description": "Mewujudkan pengawasan sistem pembayaran dan perlindungan konsumen yang terintegrasi, risk based, forward looking, dan berbasis digital, guna mendukung stabilitas sistem keuangan.",
    "accentColor": "border-t-emerald-500",
    "badgeColor": "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    "code": "DEIH",
    "no": "No. 09",
    "name": "Departemen Ekonomi-Keuangan Inklusif dan Hijau",
    "sector": "Makroprudensial",
    "description": "Bertanggung jawab merumuskan kebijakan terkait pembiayaan ramah lingkungan, UMKM, dan keuangan inklusif. DEIH fokus pada transformasi ekonomi berkelanjutan dan pengentasan kemiskinan.",
    "accentColor": "border-t-emerald-500",
    "badgeColor": "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    "code": "DKSP",
    "no": "No. 10",
    "name": "Departemen Kebijakan Sistem Pembayaran",
    "sector": "Sistem Pembayaran",
    "description": "Departemen yang memiliki peran strategis dalam mengawal dan memastikan kelancaran sistem pembayaran di Indonesia, berkomitmen untuk merumuskan kebijakan yang responsif dan berwawasan ke depan.",
    "accentColor": "border-t-purple-600",
    "badgeColor": "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    "code": "DPSP",
    "no": "No. 11",
    "name": "Departemen Penyelenggaraan Sistem Pembayaran",
    "sector": "Sistem Pembayaran",
    "description": "Penanganan Cek/Bilyet Giro: Bank wajib menahan bilyet giro yang diduga palsu/dimanipulasi dan memverifikasinya maksimal satu hari kerja. Menyelenggarakan operasional setelmen dan kliring BI.",
    "accentColor": "border-t-purple-600",
    "badgeColor": "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    "code": "DPU",
    "no": "No. 12",
    "name": "Departemen Pengelolaan Uang",
    "sector": "Sistem Pembayaran",
    "description": "Penyediaan Uang: Menyediakan uang Rupiah layak edar dalam jumlah cukup dan pecahan sesuai. Distribusi Uang: Mengelola distribusi uang tunai ke seluruh wilayah NKRI.",
    "accentColor": "border-t-purple-600",
    "badgeColor": "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    "code": "UKPS",
    "no": "No. 13",
    "name": "Unit Khusus Pembangunan SPU, DC, dan BRS",
    "sector": "Sistem Pembayaran",
    "description": "Satuan kerja khusus yang bertanggung jawab atas pengembangan infrastruktur fisik dan teknologi penting, yaitu Secure Processing Unit (SPU), Data Center (DC), dan Business Resilience Site (BRS).",
    "accentColor": "border-t-purple-600",
    "badgeColor": "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    "code": "DINT",
    "no": "No. 14",
    "name": "Departemen Internasional",
    "sector": "Pendukung Kebijakan",
    "description": "Melaksanakan kebijakan internasional yang didukung oleh asesmen dan studi, perumusan kebijakan, hubungan internasional, hubungan lembaga multilateral, dan keanggotaan forum global.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DSTA",
    "no": "No. 15",
    "name": "Departemen Statistik",
    "sector": "Pendukung Kebijakan",
    "description": "Bertanggung jawab menyusun dan menganalisis indikator moneter, perbankan, dan fiskal. Berperan penting dalam memantau lalu lintas devisa dan data statistik ekonomi makro nasional.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DPPT",
    "no": "No. 16",
    "name": "Departemen Jasa Perbankan Perizinan dan Operasional Treasuri",
    "sector": "Pendukung Kebijakan",
    "description": "Bertanggung jawab atas pengelolaan layanan perbankan bagi nasabah (termasuk pemerintah), perizinan terkait tresuri, dan operasional pasar keuangan.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DPLK",
    "no": "No. 17",
    "name": "Departemen Pengelolaan dan Kepatuhan Laporan",
    "sector": "Pendukung Kebijakan",
    "description": "Mengelola, mengawasi dan menganalisis kualitas data serta kepatuhan laporan dalam rangka menyediakan data atau informasi yang lengkap, akurat, dan tepat waktu.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DMR",
    "no": "No. 18",
    "name": "Departemen Manajemen Risiko",
    "sector": "Pendukung Kebijakan",
    "description": "Bertanggung jawab mengelola dan memitigasi risiko strategis, operasional, dan finansial untuk memastikan keberlangsungan tugas Bank Indonesia.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DKOM",
    "no": "No. 19",
    "name": "Departemen Komunikasi",
    "sector": "Pendukung Kebijakan",
    "description": "Mengelola strategi & pengelolaan komunikasi, relasi lembaga publik, pengelolaan sosial media, advisor komunikasi. Fungsi Utama: Penyebaran informasi kebijakan dan edukasi publik.",
    "accentColor": "border-t-amber-500",
    "badgeColor": "bg-amber-50 text-amber-800 border-amber-200"
  },
  {
    "code": "DMST",
    "no": "No. 20",
    "name": "Departemen Manajemen Strategis dan Tata Kelola",
    "sector": "Pendukung Organisasi",
    "description": "1. Mengelola manajemen strategis Bank Indonesia. 2. Menata Organisasi dan proses kerja Bank Indonesia. 3. Mengelola governance Bank Indonesia secara terpadu.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DHK",
    "no": "No. 21",
    "name": "Departemen Hukum",
    "sector": "Pendukung Organisasi",
    "description": "Mewujudkan terjaganya mandat dan kepentingan hukum Bank Indonesia, serta tercapainya kecukupan dan kepatuhan terhadap ketentuan hukum dan perundang-undangan.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DSDM",
    "no": "No. 22",
    "name": "Departemen Sumber Daya Manusia",
    "sector": "Pendukung Organisasi",
    "description": "Bertugas merumuskan kebijakan, mengelola organisasi, talent pool, serta rekrutmen untuk mendukung visi bank sentral. Fungsi utamanya mencakup pengembangan kapasitas human capital.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DPID",
    "no": "No. 23",
    "name": "Departemen Pengembangan Inovasi Digital",
    "sector": "Pendukung Organisasi",
    "description": "Satuan kerja yang membantu digital melalui perwujudan 3-ID: - Integrated Digital Payment System & Finance - Integrated Digital Central Banking System - Integrated Digital Workplace.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DIDD",
    "no": "No. 24",
    "name": "Departemen Inovasi dan Digitalisasi Data",
    "sector": "Pendukung Organisasi",
    "description": "Melakukan pengembangan inovasi berbasis data untuk mendukung proses bisnis, pengambilan keputusan, dan inovasi digital. Menyediakan data analytics dan business intelligence.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DLDS",
    "no": "No. 25",
    "name": "Departemen Layanan Digital & Keamanan Siber",
    "sector": "Pendukung Organisasi",
    "description": "Melakukan pengembangan dan perbaikan layanan digital secara berkelanjutan yang adaptif terhadap perubahan proses bisnis. Menyediakan perlindungan keamanan siber institusi.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DKEU",
    "no": "No. 26",
    "name": "Departemen Keuangan",
    "sector": "Pendukung Organisasi",
    "description": "Bertanggung jawab mengelola manajemen keuangan dan advisory keuangan BI secara akuntabel. DKEU bertugas merencanakan anggaran, akuntansi, dan pelaporan keuangan institusi.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DMAP",
    "no": "No. 27",
    "name": "Departemen Manajemen dan Advisory Pengadaan",
    "sector": "Pendukung Organisasi",
    "description": "Bertanggung jawab merumuskan kebijakan, mengelola proses pengadaan barang/jasa, serta memberikan advisory strategis. Fungsi Utama: Tata kelola pengadaan yang transparan dan efisien.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DAI",
    "no": "No. 28",
    "name": "Departemen Audit Intern",
    "sector": "Pendukung Organisasi",
    "description": "Menjadi trusted advisor dalam memastikan terjaganya governance, manajemen risiko, dan pengendalian intern serta pemenuhan kepatuhan seluruh lini operasional Bank Indonesia.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DPAN",
    "no": "No. 29",
    "name": "Departemen Pengelolaan Aset Perkantoran",
    "sector": "Pendukung Organisasi",
    "description": "Mewujudkan modern office berbasis digital dan tata kelola yang kuat, mendukung pelaksanaan tugas Bank Indonesia melalui pengaturan sarana dan prasarana perkantoran.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DPRN",
    "no": "No. 30",
    "name": "Departemen Pengelolaan Aset Perumahan dan Non Perkantoran",
    "sector": "Pendukung Organisasi",
    "description": "Pengelola aset-aset BI selain gedung kantor, seperti rumah dinas/perumahan, fasilitas penunjang, dan aset non-perkantoran lainnya secara efektif dan akuntabel.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DLAF",
    "no": "No. 31",
    "name": "Departemen Layanan Aset Umum dan Fasilitas",
    "sector": "Pendukung Organisasi",
    "description": "Mewujudkan pengelolaan aset umum, layanan, dan fasilitas serta pemeliharaan kantor yang berkualitas, tepat waktu, dan berorientasi pada kepuasan stakeholder internal.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "BINS",
    "no": "No. 32",
    "name": "Bank Indonesia Institute",
    "sector": "Pendukung Organisasi",
    "description": "Mengelola fakulti, partnership, dan proses pembelajaran sejalan dengan Best Practice Corporate University. Melaksanakan kegiatan riset dan pengembangan kepemimpinan bank sentral.",
    "accentColor": "border-t-indigo-600",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    "code": "DR",
    "no": "No. 33",
    "name": "Departemen Regional",
    "sector": "Jaringan Kantor",
    "description": "Satuan kerja pusat yang mendukung pelaksanaan tugas BI serta meningkatkan kinerja dan tata kelola (governance) Kantor Perwakilan BI Dalam Negeri di seluruh wilayah Indonesia.",
    "accentColor": "border-t-rose-600",
    "badgeColor": "bg-rose-50 text-rose-700 border-rose-200"
  }
];

export function getAllSatker(): SatuanKerja[] {
  return SATUAN_KERJA_LIST;
}

export function getSatkerByCode(code: string): SatuanKerja | undefined {
  return SATUAN_KERJA_LIST.find(s => s.code.toUpperCase() === code.toUpperCase());
}

export function getSatkerSectors(): SatkerSector[] {
  return [
    'Moneter',
    'Makroprudensial',
    'Sistem Pembayaran',
    'Pendukung Kebijakan',
    'Pendukung Organisasi',
    'Jaringan Kantor'
  ];
}
