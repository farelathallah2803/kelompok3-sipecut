import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sync() {
  console.log("=== Memulai Sinkronisasi Data JDIH Bank Indonesia ===");

  // 1. Ambil Taksonomi & Jenis Peraturan
  console.log("1. Mengambil master data Taksonomi & Jenis...");
  let taksonomiMap = {
    "1": "Moneter",
    "2": "Sistem Pembayaran & PUR",
    "3": "Makroprudensial",
    "4": "Pendukung Kebijakan",
    "5": "Lainnya",
    "6": "Pendukung Organisasi"
  };

  try {
    const tRes = await fetch("https://jdih.bi.go.id/api/DropDown/GetTaksonomi");
    if (tRes.ok) {
      const tJson = await tRes.json();
      if (tJson?.Data) {
        for (const item of tJson.Data) {
          taksonomiMap[String(item.Id)] = item.Description;
        }
      }
    }
  } catch (err) {
    console.warn("Gagal fetch taxonomy, menggunakan fallback default:", err.message);
  }

  // 2. Fetch Daftar Peraturan HTML
  console.log("2. Mengunduh data katalog https://jdih.bi.go.id/Web/DaftarPeraturan...");
  const res = await fetch("https://jdih.bi.go.id/Web/DaftarPeraturan");
  if (!res.ok) {
    throw new Error(`HTTP error status ${res.status}`);
  }
  const html = await res.text();
  console.log(`Berhasil mengunduh HTML (${(html.length / (1024 * 1024)).toFixed(2)} MB).`);

  // 3. Regex parser untuk setiap kartu peraturan
  const cardRegex = /<span class="badge[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<a href="\/Web\/DaftarPeraturan\/Detail\/(\d+)"[^>]*>\s*([^<]+?)\s*<\/a>[\s\S]*?<i class="none"[^>]*>([^<]*)<\/i>[\s\S]*?<i class="tema"[^>]*>([^<]*)<\/i>[\s\S]*?<i class="tahun"[^>]*>([^<]*)<\/i>[\s\S]*?<span class="h6 mb-5">([^<]*)<\/span>[\s\S]*?<p class="mt-2 ringkasan">([^<]*)<\/p>/gi;

  let match;
  const regulations = [];
  const seenIds = new Set();

  while ((match = cardRegex.exec(html)) !== null) {
    const rawStatus = match[1].trim();
    const id = match[2].trim();
    const number = match[3].trim().replace(/\s+/g, " ");
    const jenisId = match[4].trim();
    const temaId = match[5].trim();
    const rawYear = parseInt(match[6].trim(), 10);
    const date = match[7].trim();
    const title = match[8].trim().replace(/\s+/g, " ");

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Tentukan jenis tipe aturan
    let type = "PADG";
    const numUpper = number.toUpperCase();
    if (numUpper.startsWith("PBI") || jenisId === "1") {
      type = "PBI";
    } else if (numUpper.startsWith("PADG") || jenisId === "2") {
      type = "PADG";
    } else if (numUpper.startsWith("SE") || jenisId === "3") {
      type = "SE";
    } else if (numUpper.startsWith("UU") || jenisId === "4") {
      type = "UU";
    }

    // Tentukan sektor
    let sector = taksonomiMap[temaId] || "Umum";
    if (sector === "Sistem Pembayaran & PUR") {
      sector = "Sistem Pembayaran & PUR";
    }

    // Tentukan status
    const status = rawStatus === "Berlaku" ? "Berlaku" : "Dicabut";

    regulations.push({
      id: `jdih-${id}`,
      jdihId: id,
      type: type,
      number: number,
      title: title,
      year: rawYear || 2024,
      sector: sector,
      status: status,
      date: date,
      jdihUrl: `https://jdih.bi.go.id/Web/DaftarPeraturan/Detail/${id}`,
      downloadPdfUrl: `https://jdih.bi.go.id/api/WebJDIH/GetFilePeraturan/${id}`,
      summary: title,
      articles: []
    });
  }

  console.log(`3. Berhasil mengekstrak ${regulations.length} peraturan resmi Bank Indonesia.`);

  // 4. Simpan ke src/data/jdihRegulations.json
  const targetPath = path.resolve(__dirname, "../src/data/jdihRegulations.json");
  fs.writeFileSync(targetPath, JSON.stringify(regulations, null, 2), "utf8");
  console.log(`4. Data berhasil disimpan ke: ${targetPath}`);

  // 5. Cetak statistik ringkasan
  const stats = {
    total: regulations.length,
    berlaku: regulations.filter(r => r.status === "Berlaku").length,
    tidakBerlaku: regulations.filter(r => r.status !== "Berlaku").length,
    bySector: {},
    byType: {}
  };

  for (const r of regulations) {
    stats.bySector[r.sector] = (stats.bySector[r.sector] || 0) + 1;
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
  }

  console.log("=== Ringkasan Sinkronisasi JDIH BI ===");
  console.log(`Total Regulasi: ${stats.total}`);
  console.log(`Berlaku: ${stats.berlaku} | Dicabut/Diubah: ${stats.tidakBerlaku}`);
  console.log("Berdasarkan Sektor:", stats.bySector);
  console.log("Berdasarkan Tipe:", stats.byType);
}

sync().catch(console.error);
