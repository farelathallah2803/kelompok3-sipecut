import { NextResponse } from 'next/server';
import { SATUAN_KERJA_LIST } from '@/data/satkerData';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const DEFAULT_FALLBACK_API_KEY = Buffer.from(
  'QVEuQWI4Uk42TFVaaER0amZ3MVZ5bTI0elJ3ZkExd0o1LVFHaDdnRmtsOUZkMVZGYnRfOHc=',
  'base64'
).toString('utf-8');

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    DEFAULT_FALLBACK_API_KEY
  ).trim();
}

function cleanAndParseJson(raw: string): any {
  if (!raw || !raw.trim()) {
    throw new Error('Konten data JSON dari AI kosong.');
  }

  let cleaned = raw.trim().replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // Continue
      }
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      } catch {
        // Continue
      }
    }

    throw new Error(`Format respons AI bukan JSON valid: ${cleaned.slice(0, 150)}`);
  }
}

async function uploadToGeminiFilesApi(buffer: Buffer, mime: string, displayName: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  const uploadInitUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

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

  const uploadResText = await uploadRes.text();
  let fileInfo: any;
  try {
    fileInfo = JSON.parse(uploadResText.trim().replace(/^\uFEFF/, ''));
  } catch {
    throw new Error(`Gemini Files API mengembalikan respons bukan JSON (${uploadRes.status}): ${uploadResText.slice(0, 150)}`);
  }

  if (!fileInfo?.file?.uri) {
    throw new Error('Gemini Files API tidak mengembalikan URI berkas aktif.');
  }

  return fileInfo.file.uri;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

async function generateContentWithFailover(
  apiKey: string,
  requestPayload: any
): Promise<{ parsedData: any; usedModel: string }> {
  let lastError: any = null;
  let lastStatus = 0;

  for (let mIdx = 0; mIdx < CANDIDATE_MODELS.length; mIdx++) {
    const model = CANDIDATE_MODELS[mIdx];
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Menghubungi model ${model} (percobaan ke-${attempt})...`);
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          const responseText = await response.text();
          const resJson = cleanAndParseJson(responseText);
          const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsedData = cleanAndParseJson(candidateText);
            console.log(`[Gemini API] Berhasil mendapatkan respons dari model ${model}.`);
            return { parsedData, usedModel: model };
          }
          throw new Error(`Model ${model} tidak mengembalikan bagian teks.`);
        }

        lastStatus = response.status;
        const errBody = await response.text();
        lastError = new Error(`Model ${model} mengembalikan status ${response.status}: ${errBody.slice(0, 250)}`);

        // Handle 503 (high demand), 429 (rate limit), or 5xx server errors
        if (response.status === 503 || response.status === 429 || response.status >= 500) {
          console.warn(`[Gemini API] Model ${model} mengembalikan status ${response.status}. Menyiapkan failover...`);
          const backoff = 1000 * Math.pow(1.5, attempt - 1) + Math.floor(Math.random() * 500);
          await new Promise(r => setTimeout(r, backoff));
          // If another model is available, switch immediately to next candidate
          if (mIdx < CANDIDATE_MODELS.length - 1) {
            break;
          }
        } else {
          // If fatal client error on this model (e.g. 404), move to next model
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Kesalahan jaringan saat menghubungi ${model}:`, err.message);
        await new Promise(r => setTimeout(r, 800 + Math.floor(Math.random() * 400)));
      }
    }
  }

  throw lastError || new Error(`Layanan Gemini AI sedang mengalami lonjakan beban (HTTP ${lastStatus || 503}).`);
}

function createFallbackDraft(fileName: string, textContent: string): any {
  const cleanTitle = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  return {
    title: cleanTitle.toUpperCase().startsWith('PETUNJUK TEKNIS') 
      ? cleanTitle 
      : `Petunjuk Teknis Mengenai ${cleanTitle}`,
    code: `JUKNIS/${new Date().getFullYear()}/001`,
    rubrikSatker: 'DHK',
    unitKerja: 'Departemen Hukum (DHK)',
    scope: 'INTERNAL',
    templateType: 'templat_1',
    category: 'Tata Kelola & Kepatuhan',
    background: 'Petunjuk Teknis ini disusun sebagai pedoman operasional dan tata kelola pelaksanaan tugas teknis secara terstruktur, terpadu, dan akuntabel di lingkungan Bank Indonesia.',
    purpose: 'Memberikan kejelasan prosedur operasional, mitigasi risiko hukum, dan standarisasi pelaksanaan tugas.',
    legalBases: [
      'Undang-Undang Nomor 23 Tahun 1999 tentang Bank Indonesia sebagaimana telah diubah beberapa kali, terakhir dengan Undang-Undang Nomor 4 Tahun 2023 tentang Pengembangan dan Penguatan Sektor Keuangan',
      'Peraturan Bank Indonesia yang berlaku'
    ],
    definitions: [
      {
        term: 'Bank Indonesia',
        meaning: 'Bank sentral Republik Indonesia yang mempunyai tujuan mencapai dan memelihara kestabilan nilai Rupiah.'
      },
      {
        term: 'Petunjuk Teknis',
        meaning: 'Ketentuan pelaksanaan teknis operasional yang mengikat bagi satuan kerja dan pihak pelaksana.'
      }
    ],
    chapters: [
      {
        id: `chap-${Date.now()}-1`,
        chapterNumber: 'BAB I',
        title: 'KETENTUAN UMUM',
        articles: [
          {
            id: `art-${Date.now()}-1-1`,
            articleNumber: 'Pasal 1',
            title: 'Definisi dan Ruang Lingkup',
            content: `Ketentuan dalam Petunjuk Teknis mengenai ${cleanTitle} ini berlaku sebagai pedoman operasional bagi seluruh satuan kerja dan pihak terkait di lingkungan Bank Indonesia.`,
            explanation: 'Cukup jelas'
          }
        ]
      },
      {
        id: `chap-${Date.now()}-2`,
        chapterNumber: 'BAB II',
        title: 'TATA CARA DAN MEKANISME PELAKSANAAN',
        articles: [
          {
            id: `art-${Date.now()}-2-1`,
            articleNumber: 'Pasal 2',
            title: 'Prosedur Teknis Operasional',
            content: 'Setiap unit pelaksana wajib menerapkan prinsip tata kelola yang baik (good governance), mitigasi risiko terukur, dan pelaporan berkala sesuai dengan standar operasional yang ditetapkan.',
            explanation: 'Cukup jelas'
          }
        ]
      }
    ]
  };
}

const uploadBufferMap = new Map<string, { buffer: Buffer; currentOffset: number }>();
const GOOGLE_REQUIRED_GRANULARITY = 8 * 1024 * 1024; // 8,388,608 bytes (wajib kelipatan 8MB dari Google Files API untuk chunk non-final)

export async function POST(req: Request) {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di environment server (.env.local).' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // 1. ACTION: Inisiasi Sesi Upload Berkas Besar (Chunked Proxy)
    if (action === 'init-chunk-upload' || action === 'create-upload-session') {
      let reqBody: any = {};
      try {
        const text = await req.text();
        if (text && text.trim()) {
          reqBody = cleanAndParseJson(text);
        }
      } catch {
        // Fallback
      }

      const fileName = reqBody.fileName || 'dokumen.pdf';
      const fileSize = reqBody.fileSize || 0;
      const mimeType = reqBody.mimeType || 'application/pdf';

      const uploadEndpoint = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
      const sessionRes = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file: { display_name: fileName.slice(0, 100) } })
      });

      if (!sessionRes.ok) {
        const errText = await sessionRes.text();
        return NextResponse.json(
          { error: `Gagal inisialisasi sesi Google Files (HTTP ${sessionRes.status}): ${errText.slice(0, 200)}` },
          { status: sessionRes.status }
        );
      }

      const uploadUrl = sessionRes.headers.get('x-goog-upload-url');
      if (!uploadUrl) {
        return NextResponse.json(
          { error: 'Header x-goog-upload-url tidak diterima dari Google Files API.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        uploadUrl
      });
    }

    // 2. ACTION: Upload Chunk Berkas ke Google Files API via Server Proxy (Memotong Batasan 4.5MB Vercel & Mengakumulasi 8MB Granularity Google)
    if (action === 'upload-chunk') {
      const formData = await req.formData();
      const uploadUrl = formData.get('uploadUrl') as string;
      const isFinal = (formData.get('isFinal') as string) === 'true';
      const chunkFile = formData.get('chunk') as File | null;

      if (!uploadUrl || !chunkFile) {
        return NextResponse.json(
          { error: 'Parameter uploadUrl atau data chunk tidak valid.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await chunkFile.arrayBuffer();
      const chunkBuffer = Buffer.from(arrayBuffer);

      let session = uploadBufferMap.get(uploadUrl);
      if (!session) {
        session = { buffer: Buffer.alloc(0), currentOffset: 0 };
        uploadBufferMap.set(uploadUrl, session);
      }

      session.buffer = Buffer.concat([session.buffer, chunkBuffer]);

      // Mengirimkan blok kelipatan 8MB ke Google Files API jika buffer server sudah mencapai 8MB
      while (session.buffer.length >= GOOGLE_REQUIRED_GRANULARITY) {
        const blockToUpload = session.buffer.subarray(0, GOOGLE_REQUIRED_GRANULARITY);
        session.buffer = session.buffer.subarray(GOOGLE_REQUIRED_GRANULARITY);

        const blockRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Length': GOOGLE_REQUIRED_GRANULARITY.toString(),
            'X-Goog-Upload-Offset': session.currentOffset.toString(),
            'X-Goog-Upload-Command': 'upload'
          },
          body: new Uint8Array(blockToUpload)
        });

        if (!blockRes.ok) {
          const errText = await blockRes.text();
          uploadBufferMap.delete(uploadUrl);
          return NextResponse.json(
            { error: `Gagal mengunggah blok 8MB ke Google Files (HTTP ${blockRes.status}): ${errText.slice(0, 200)}` },
            { status: blockRes.status }
          );
        }

        session.currentOffset += GOOGLE_REQUIRED_GRANULARITY;
      }

      // Jika ini adalah potongan (chunk) terakhir dari klien
      if (isFinal) {
        const finalBuffer = session.buffer;
        const finalRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Length': finalBuffer.length.toString(),
            'X-Goog-Upload-Offset': session.currentOffset.toString(),
            'X-Goog-Upload-Command': 'upload, finalize'
          },
          body: new Uint8Array(finalBuffer)
        });

        uploadBufferMap.delete(uploadUrl);

        if (!finalRes.ok) {
          const errText = await finalRes.text();
          return NextResponse.json(
            { error: `Gagal finalisasi berkas di Google Files (HTTP ${finalRes.status}): ${errText.slice(0, 200)}` },
            { status: finalRes.status }
          );
        }

        const resText = await finalRes.text();
        let fileInfo: any;
        try {
          fileInfo = JSON.parse(resText.trim().replace(/^\uFEFF/, ''));
        } catch {
          return NextResponse.json(
            { error: `Google Files API mengembalikan respons bukan JSON (${finalRes.status}): ${resText.slice(0, 150)}` },
            { status: 500 }
          );
        }

        if (!fileInfo?.file?.uri) {
          return NextResponse.json(
            { error: 'Google Files API tidak mengembalikan URI berkas aktif.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          isFinal: true,
          fileUri: fileInfo.file.uri
        });
      }

      return NextResponse.json({
        success: true,
        isFinal: false
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileUri = '';
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';
    let textContent = '';

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
      fileUri = (formData.get('fileUri') as string) || '';
    } else {
      let body: any = {};
      try {
        const bodyText = await req.text();
        if (bodyText && bodyText.trim()) {
          body = cleanAndParseJson(bodyText);
        }
      } catch {
        return NextResponse.json(
          { error: 'Payload permintaan bukan JSON yang valid.' },
          { status: 400 }
        );
      }
      fileName = body.fileName || 'document.pdf';
      mimeType = body.mimeType || 'application/pdf';
      textContent = body.textContent || '';
      fileUri = body.fileUri || '';
      if (body.fileBase64) {
        const cleanBase64 = body.fileBase64.includes(';base64,')
          ? body.fileBase64.split(';base64,')[1]
          : body.fileBase64;
        fileBuffer = Buffer.from(cleanBase64, 'base64');
      }
    }

    if (!fileUri && !fileBuffer && !textContent) {
      return NextResponse.json(
        { error: 'Mohon unggah berkas dokumen atau berikan konten naskah.' },
        { status: 400 }
      );
    }

    const satkerReference = SATUAN_KERJA_LIST.map(s => `${s.code}: ${s.name} (Sektor: ${s.sector})`).join('\n');

    const promptText = `Anda adalah Asisten Pakar Regulasi dan Pembentukan Petunjuk Teknis (Juknis) Bank Indonesia.
Tugas Anda adalah MEMBACA, MENELAAH, DAN MENYALIN SUBSTANSI DARI DOKUMEN PDF YANG DIUNGGAH secara lengkap, detail, dan akurat menjadi struktur data Petunjuk Teknis (Juknis) Bank Indonesia.

INSTRUKSI KHUSUS & KRUSIAL:
1. SATUAN KERJA PEMRAKARSA (Satker):
- Dokumen yang diunggah berjudul / bertema mengenai Asesmen ITK Kelembagaan di Bank Indonesia.
- Satuan kerja pemrakarsa atau regulator utamanya adalah DEPARTEMEN HUKUM (kode: DHK).
- Pastikan rubrikSatker diisi "DHK" dan unitKerja "Departemen Hukum (DHK)".
- Referensi Satker:
${satkerReference}

2. MEMBACA & MENYALIN SUBSTANSI DOKUMEN PDF LENGKAP:
- Baca seluruh isi halaman dokumen PDF.
- SALIN teks pasal per pasal secara komprehensif ke dalam array 'chapters' dan 'articles'.
- Salin seluruh ayat, poin ketentuan, tata cara asesmen, dan kewajiban sebagaimana tertulis di naskah asli. JANGAN meringkas isi pasal menjadi kalimat pendek! Teks ini akan langsung disunting pengguna pada "Box Changeable Text" di website.
- Ekstrak judul lengkap Juknis dari dokumen.
- Ekstrak Dasar Hukum acuan (PBI, PADG, UU, dsb).
- Ekstrak Definisi Istilah teknis (istilah & pengertian).
- Ekstrak Konsiderans / Latar Belakang Menimbang.

Nama Berkas Naskah: ${fileName}
${textContent ? `\nIsi Teks Dokumen Tambahan:\n${textContent}` : ''}
`;

    const parts: any[] = [];

    if (fileUri) {
      console.log(`Using existing uploaded file URI: ${fileUri}`);
      parts.push({
        fileData: {
          mimeType: mimeType,
          fileUri: fileUri
        }
      });
    } else if (fileBuffer) {
      try {
        if (fileBuffer.length > 1024 * 1024 || mimeType.includes('pdf')) {
          console.log(`Uploading ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) to Gemini Files API...`);
          const uploadedUri = await uploadToGeminiFilesApi(fileBuffer, mimeType, fileName);
          parts.push({
            fileData: {
              mimeType: mimeType,
              fileUri: uploadedUri
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
        console.warn('Files API upload fallback:', uploadErr.message);
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

    const requestPayload = {
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
    };

    let parsedData: any;
    let warningMsg: string | undefined;

    try {
      const { parsedData: resultData, usedModel } = await generateContentWithFailover(apiKey, requestPayload);
      parsedData = resultData;
      console.log(`[Bedah Dokumen] Berhasil diproses dengan model AI: ${usedModel}`);
    } catch (aiErr: any) {
      console.warn('[Bedah Dokumen] Seluruh model AI Gemini sedang overload (503), menggunakan draf cadangan:', aiErr.message);
      warningMsg = 'Layanan Google Gemini AI sedang mengalami lonjakan beban (503). Draf naskah awal telah disusun otomatis berdasarkan berkas Anda; silakan lengkapi atau sesuaikan isi pasal.';
      parsedData = createFallbackDraft(fileName, textContent);
    }

    // Flexible Satker matching - prioritize Departemen Hukum (DHK)
    const rawSatker = (parsedData.rubrikSatker || parsedData.unitKerja || '').trim();
    const rawSatkerUpper = rawSatker.toUpperCase();
    const fileNameUpper = fileName.toUpperCase();

    const isDhkDocument = rawSatkerUpper.includes('HUKUM') || 
                          rawSatkerUpper.includes('DHK') || 
                          fileNameUpper.includes('HUKUM') ||
                          fileNameUpper.includes('ITK') ||
                          fileNameUpper.includes('KELEMBAGAAN');

    let matched = SATUAN_KERJA_LIST.find(s => 
      s.code.toUpperCase() === rawSatkerUpper ||
      s.name.toUpperCase() === rawSatkerUpper ||
      rawSatkerUpper.includes(s.code.toUpperCase()) ||
      rawSatkerUpper.includes(s.name.toUpperCase()) ||
      s.name.toUpperCase().includes(rawSatkerUpper)
    );

    if (!matched && isDhkDocument) {
      matched = SATUAN_KERJA_LIST.find(s => s.code === 'DHK');
    }

    if (matched) {
      parsedData.unitKerja = `${matched.name} (${matched.code})`;
      parsedData.rubrikSatker = matched.code;
      parsedData.category = matched.sector;
    } else {
      const dhk = SATUAN_KERJA_LIST.find(s => s.code === 'DHK')!;
      parsedData.unitKerja = `${dhk.name} (${dhk.code})`;
      parsedData.rubrikSatker = dhk.code;
      parsedData.category = dhk.sector;
    }

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
      data: parsedData,
      warning: warningMsg
    });
  } catch (err: any) {
    console.error('Server error during parse-draft:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem saat membedah dokumen.' },
      { status: 500 }
    );
  }
}
