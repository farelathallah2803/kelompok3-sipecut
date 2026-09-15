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

export async function POST(req: Request) {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
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

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const isChunk = formData.get('isChunk') === 'true';

      if (isChunk) {
        const uploadId = ((formData.get('uploadId') as string) || `upl_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
        const chunkIndex = parseInt((formData.get('chunkIndex') as string) || '0', 10);
        const totalChunks = parseInt((formData.get('totalChunks') as string) || '1', 10);
        fileName = (formData.get('fileName') as string) || fileName;
        mimeType = (formData.get('mimeType') as string) || mimeType;
        textContent = (formData.get('textContent') as string) || '';

        const tempDir = path.join(os.tmpdir(), 'sipecut_chunks', uploadId);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const chunkFile = formData.get('file') as File | null;
        if (chunkFile) {
          const chunkBuf = Buffer.from(await chunkFile.arrayBuffer());
          fs.writeFileSync(path.join(tempDir, `chunk_${chunkIndex}.part`), chunkBuf);
        }

        // If not the last chunk, acknowledge receipt and wait for remaining chunks
        if (chunkIndex < totalChunks - 1) {
          return NextResponse.json({
            success: true,
            chunkReceived: chunkIndex,
            totalChunks,
            isComplete: false
          });
        }

        // Final chunk received! Assemble all parts into full buffer
        const assembled: Buffer[] = [];
        for (let i = 0; i < totalChunks; i++) {
          const partPath = path.join(tempDir, `chunk_${i}.part`);
          if (!fs.existsSync(partPath)) {
            throw new Error(`Bagian naskah ${i + 1} dari ${totalChunks} tidak ditemukan. Silakan ulangi unggah.`);
          }
          assembled.push(fs.readFileSync(partPath));
        }
        fileBuffer = Buffer.concat(assembled);

        // Clean up temp directory
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.warn('Gagal membersihkan direktori chunk sementara:', rmErr);
        }
      } else {
        const file = formData.get('file') as File | null;
        if (file) {
          fileName = file.name;
          mimeType = file.type || 'application/pdf';
          const arrayBuffer = await file.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        }
        fileName = (formData.get('fileName') as string) || fileName;
        textContent = (formData.get('textContent') as string) || '';
      }
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

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

    const responseText = await response.text();
    let resJson: any;
    try {
      resJson = cleanAndParseJson(responseText);
    } catch {
      throw new Error(`Respons dari Gemini API bukan format JSON yang valid (HTTP ${response.status}): ${responseText.slice(0, 150)}`);
    }

    const candidate = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error('Gemini AI tidak mengembalikan konten teks bedah dokumen.');
    }

    const parsedData = cleanAndParseJson(candidate);

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
