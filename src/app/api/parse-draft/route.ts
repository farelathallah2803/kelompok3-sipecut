import { NextResponse } from 'next/server';
import { SATUAN_KERJA_LIST } from '@/data/satkerData';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes execution for large documents

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Upload file to Google Gemini Files API (supports files up to 2GB including large PDFs)
async function uploadToGeminiFilesApi(buffer: Buffer, mime: string, displayName: string): Promise<string> {
  const uploadInitUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;

  const initRes = await fetch(uploadInitUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
      'X-Goog-Upload-Header-Content-Type': mime || 'application/pdf',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file: { display_name: displayName.slice(0, 100) }
    })
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Gagal inisialisasi Gemini Files API (${initRes.status}): ${errText.slice(0, 200)}`);
  }

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Tidak menerima endpoint upload dari Gemini Files API.');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': buffer.length.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: new Uint8Array(buffer)
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal upload berkas ke Gemini Files API (${uploadRes.status}): ${errText.slice(0, 200)}`);
  }

  const fileInfo = await uploadRes.json();
  if (!fileInfo?.file?.uri) {
    throw new Error('Gemini Files API tidak mengembalikan URI berkas aktif.');
  }

  return fileInfo.file.uri;
}

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di environment server (.env.local).' },
        { status: 500 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';
    let textContent = '';

    // Handle Multipart FormData (recommended for large files without Base64 overhead)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        fileName = file.name;
        mimeType = file.type || 'application/pdf';
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
      fileName = (formData.get('fileName') as string) || fileName;
      textContent = (formData.get('textContent') as string) || '';
    } else {
      // Fallback for JSON body
      const body = await req.json();
      fileName = body.fileName || 'document.pdf';
      mimeType = body.mimeType || 'application/pdf';
      textContent = body.textContent || '';
      if (body.fileBase64) {
        const cleanBase64 = body.fileBase64.includes(';base64,')
          ? body.fileBase64.split(';base64,')[1]
          : body.fileBase64;
        fileBuffer = Buffer.from(cleanBase64, 'base64');
      }
    }

    if (!fileBuffer && !textContent) {
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
Pilihlah salah satu kode dan nama dari 33 Satuan Kerja resmi Bank Indonesia berikut yang paling relevan dengan isi dokumen:
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
- Ekstrak seluruh BAB dan PASAL secara detail. Jangan diringkas berlebihan agar dapat diedit langsung oleh pengguna di website. Untuk setiap pasal, sertakan nomor pasal, judul pasal, isi teks pasal lengkap (rumusan pasal yang memuat hak/kewajiban/prosedur), dan catatan penjelasan jika ada.

Nama Berkas Naskah: ${fileName}
${textContent ? `\nIsi Teks Dokumen Tambahan:\n${textContent}` : ''}
`;

    const parts: any[] = [];

    // Attach file via Files API (for PDFs and any files > 1MB) or inlineData (for tiny files)
    if (fileBuffer) {
      try {
        if (fileBuffer.length > 1024 * 1024 || mimeType.includes('pdf')) {
          console.log(`Uploading ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) to Gemini Files API...`);
          const fileUri = await uploadToGeminiFilesApi(fileBuffer, mimeType, fileName);
          parts.push({
            fileData: {
              mimeType: mimeType,
              fileUri: fileUri
            }
          });
        } else {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: fileBuffer.toString('base64')
            }
          });
        }
      } catch (uploadErr: any) {
        console.warn('Files API upload warning:', uploadErr.message);
        // Fallback to inlineData if small enough
        if (fileBuffer.length <= 4 * 1024 * 1024) {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: fileBuffer.toString('base64')
            }
          });
        } else {
          throw uploadErr;
        }
      }
    }

    if (textContent) {
      parts.push({ text: `Kutipan Naskah Dokumen:\n${textContent}` });
    }

    parts.push({ text: promptText });

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
      throw new Error(`Gemini API mengembalikan status ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const resJson = await response.json();
    const candidate = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error('Gemini AI tidak mengembalikan konten teks bedah dokumen.');
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
      parsedData.unitKerja = 'Departemen Kebijakan Sistem Pembayaran (DKSP)';
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

    if (Array.isArray(parsedData.chapters) && parsedData.chapters.length > 0) {
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
      // Fallback chapters derived from title
      const cleanTitle = (parsedData.title || fileName).replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      parsedData.chapters = [
        {
          id: `chap-${Date.now()}-1`,
          chapterNumber: 'BAB I',
          title: 'KETENTUAN UMUM',
          articles: [
            {
              id: `art-${Date.now()}-1-1`,
              articleNumber: 'Pasal 1',
              title: 'Ketentuan Umum & Definisi',
              content: `Ketentuan dalam Petunjuk Teknis mengenai ${cleanTitle} ini berlaku bagi seluruh satuan kerja dan pihak terkait di lingkungan Bank Indonesia.`,
              explanation: 'Cukup jelas'
            }
          ]
        },
        {
          id: `chap-${Date.now()}-2`,
          chapterNumber: 'BAB II',
          title: 'TATA CARA & PELAKSANAAN TEKNIS',
          articles: [
            {
              id: `art-${Date.now()}-2-1`,
              articleNumber: 'Pasal 2',
              title: 'Pelaksanaan Prosedur Teknis',
              content: 'Setiap unit pelaksana wajib menerapkan tata kelola kepatuhan, mitigasi risiko, dan pelaporan berkala sesuai dengan standar operasional yang ditetapkan.',
              explanation: 'Cukup jelas'
            }
          ]
        }
      ];
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
