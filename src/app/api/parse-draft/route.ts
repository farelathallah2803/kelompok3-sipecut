import { NextResponse } from 'next/server';
import { SATUAN_KERJA_LIST } from '@/data/satkerData';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di environment server (.env.local).' },
        { status: 500 }
      );
    }
    const body = await req.json();
    const { fileBase64, mimeType, fileName, textContent } = body;

    if (!fileBase64 && !textContent) {
      return NextResponse.json(
        { error: 'Mohon unggah berkas dokumen atau berikan konten naskah.' },
        { status: 400 }
      );
    }

    const satkerReference = SATUAN_KERJA_LIST.map(s => `${s.code}: ${s.name} (Sektor: ${s.sector})`).join('\n');

    const promptText = `Anda adalah Asisten Pakar Regulasi dan Pembentukan Petunjuk Teknis (Juknis) Bank Indonesia.
Tugas Anda adalah membaca, menelaah, menganalisis secara mendalam, dan MEMBEDAH dokumen naskah yang diberikan menjadi struktur data Petunjuk Teknis (Juknis) Bank Indonesia yang rapi, lengkap, dan terstruktur.

PEDOMAN BAKU JUKNIS BANK INDONESIA:
1. Satuan Kerja (Satker) Pemrakarsa:
Pilihlah salah satu kode dan nama dari 33 Satuan Kerja resmi Bank Indonesia berikut:
${satkerReference}

2. Lingkup Ketentuan (Scope):
- "INTERNAL": Petunjuk teknis atau SOP bagi satuan kerja internal di lingkungan Bank Indonesia.
- "EKSTERNAL": Petunjuk teknis pelaksanaan ketentuan bagi industri sistem pembayaran, perbankan, mitra luar, atau publik.

3. Format Templat Naskah Juknis:
- "templat_1": Standar Prosedur Kerja & Uraian Tugas Pokok Satuan Kerja.
- "templat_2": Manual Operasional, Standar Teknis Sistem, Infrastruktur, atau Prosedur Darurat.
- "templat_3": Penjelasan Ketentuan bagi Pihak Eksternal, Industri, atau Mitra Kebijakan.

4. Bedah Struktur Dokumen:
- Ekstrak judul lengkap Petunjuk Teknis.
- Ekstrak atau buat kode rubrik resmi Juknis: format baku: NOMOR [ANGKA]/JUKNIS/[INTERNAL atau EKSTERNAL]/[KODE_SATKER]/[TAHUN].
- Ekstrak Latar Belakang / Urgensi / Konsiderans penyusunan Juknis.
- Ekstrak Dasar Hukum acuan (contoh: PBI, PADG, PADG Intern, UU terkait).
- Ekstrak Definisi / Pengertian Umum (istilah dan definisinya).
- Ekstrak seluruh BAB dan PASAL secara detail, jangan diringkas berlebihan agar dapat diedit langsung oleh pengguna di website. Untuk setiap pasal, sertakan nomor pasal, judul pasal, isi teks pasal lengkap, dan catatan penjelasan jika ada.

Naskah Tambahan / Konteks Nama Berkas: ${fileName || ''}
${textContent ? `\nIsi Teks Dokumen:\n${textContent}` : ''}
`;

    const parts: any[] = [];

    if (fileBase64) {
      // Clean base64 if it contains data URL prefix
      const cleanBase64 = fileBase64.includes(';base64,')
        ? fileBase64.split(';base64,')[1]
        : fileBase64;

      const effectiveMime = mimeType || 'application/pdf';

      parts.push({
        inlineData: {
          mimeType: effectiveMime,
          data: cleanBase64
        }
      });
    }

    parts.push({
      text: promptText
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              code: { type: 'STRING' },
              rubrikSatker: { type: 'STRING' },
              unitKerja: { type: 'STRING' },
              scope: { type: 'STRING', enum: ['INTERNAL', 'EKSTERNAL'] },
              templateType: { type: 'STRING', enum: ['templat_1', 'templat_2', 'templat_3'] },
              category: { type: 'STRING' },
              background: { type: 'STRING' },
              purpose: { type: 'STRING' },
              legalBases: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              definitions: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    term: { type: 'STRING' },
                    meaning: { type: 'STRING' }
                  },
                  required: ['term', 'meaning']
                }
              },
              chapters: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    chapterNumber: { type: 'STRING' },
                    title: { type: 'STRING' },
                    articles: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          articleNumber: { type: 'STRING' },
                          title: { type: 'STRING' },
                          content: { type: 'STRING' },
                          explanation: { type: 'STRING' }
                        },
                        required: ['articleNumber', 'title', 'content']
                      }
                    }
                  },
                  required: ['chapterNumber', 'title', 'articles']
                }
              }
            },
            required: [
              'title',
              'code',
              'rubrikSatker',
              'scope',
              'templateType',
              'background',
              'chapters'
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API Error:', errBody);
      return NextResponse.json(
        { error: 'Gagal memproses dokumen dengan Gemini AI. Mohon coba kembali atau gunakan teks dokumen.' },
        { status: 500 }
      );
    }

    const resJson = await response.json();
    const candidate = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      return NextResponse.json(
        { error: 'Gemini AI tidak mengembalikan hasil analisis yang valid.' },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(candidate);

    // Ensure matched unitKerja from SATUAN_KERJA_LIST
    const matched = SATUAN_KERJA_LIST.find(
      s => s.code.toUpperCase() === (parsedData.rubrikSatker || '').toUpperCase()
    );
    if (matched) {
      parsedData.unitKerja = `${matched.name} (${matched.code})`;
      parsedData.rubrikSatker = matched.code;
      if (!parsedData.category) {
        parsedData.category = matched.sector;
      }
    } else if (!parsedData.unitKerja) {
      parsedData.unitKerja = `Departemen Kebijakan Sistem Pembayaran (DKSP)`;
      parsedData.rubrikSatker = 'DKSP';
    }

    // Add unique IDs to definitions and articles if missing
    if (Array.isArray(parsedData.definitions)) {
      parsedData.definitions = parsedData.definitions.map((d: any, idx: number) => ({
        id: `def-${Date.now()}-${idx}`,
        term: d.term || '',
        meaning: d.meaning || ''
      }));
    } else {
      parsedData.definitions = [];
    }

    if (Array.isArray(parsedData.chapters)) {
      parsedData.chapters = parsedData.chapters.map((chap: any, cIdx: number) => ({
        id: `chap-${Date.now()}-${cIdx}`,
        chapterNumber: chap.chapterNumber?.startsWith('BAB') ? chap.chapterNumber : `BAB ${chap.chapterNumber || (cIdx + 1)}`,
        title: chap.title || `BAB ${cIdx + 1}`,
        articles: Array.isArray(chap.articles)
          ? chap.articles.map((art: any, aIdx: number) => ({
              id: `art-${Date.now()}-${cIdx}-${aIdx}`,
              articleNumber: art.articleNumber?.toLowerCase().startsWith('pasal') ? art.articleNumber : `Pasal ${art.articleNumber || (aIdx + 1)}`,
              title: art.title || `Pasal ${aIdx + 1}`,
              content: art.content || '',
              explanation: art.explanation || ''
            }))
          : []
      }));
    } else {
      parsedData.chapters = [];
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error('Server error during parse-draft:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem saat membedah dokumen.' },
      { status: 500 }
    );
  }
}
