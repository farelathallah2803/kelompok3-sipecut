import jsQR from 'jsqr';
import { MOCK_REGULATIONS } from '@/data/mockRegulations';
import { Regulation } from '@/types';

export interface ParsedJdihQrResult {
  rawText: string;
  isJdihQr: boolean;
  regulationNumber?: string;
  regulationType?: string;
  year?: number;
  pdfUrl?: string;
  matchedRegulation?: Regulation;
  suggestedSearchQuery: string;
  summaryText: string;
}

/**
 * Decode QR Code from HTML5 Canvas / Image / Video frame
 */
export function decodeQrFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    return code ? code.data : null;
  } catch (err) {
    console.error('Error in jsQR decoding:', err);
    return null;
  }
}

/**
 * Decode QR Code directly from an uploaded File or Blob
 */
export async function decodeQrFromFile(file: File | Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, canvas.width, canvas.height, {
            inversionAttempts: 'attemptBoth'
          });

          resolve(code ? code.data : null);
        } catch (err) {
          console.error('Failed to decode QR from image canvas:', err);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Parses raw text/URL from a JDIH BI QR Code into structured regulation information
 */
export function parseJdihQrData(rawText: string): ParsedJdihQrResult {
  const trimmed = (rawText || '').trim();
  const isJdihUrl = trimmed.toLowerCase().includes('jdih.bi.go.id');

  let regulationNumber: string | undefined;
  let regulationType: string | undefined;
  let year: number | undefined;
  let pdfUrl: string | undefined;
  let jdihId: string | undefined;

  if (isJdihUrl && (trimmed.endsWith('.pdf') || trimmed.includes('/DokumenPeraturan/'))) {
    pdfUrl = trimmed;
  }

  // Case 1: JDIH Detail page URL -> e.g. https://jdih.bi.go.id/Web/DaftarPeraturan/Detail/12391
  const detailMatch = trimmed.match(/\/Detail\/(\d+)/i);
  if (detailMatch && detailMatch[1]) {
    jdihId = detailMatch[1];
  }

  // Case 2: Direct Document filename pattern -> e.g. 20260707114455_Lamp_Batang_Tubuh_2026PBI006.pdf
  // Pattern: (YYYY)(PBI|PADG|PADGI|PDG)(NNN)
  const filenamePattern = /(\d{4})(PBI|PADGI|PADG|PDG)(\d{2,4})\.pdf/i;
  const fnMatch = trimmed.match(filenamePattern);

  if (fnMatch) {
    const rawYear = parseInt(fnMatch[1], 10);
    const rawType = fnMatch[2].toUpperCase();
    const rawNum = parseInt(fnMatch[3], 10);

    year = rawYear;
    let typeLabel = 'PBI';
    if (rawType === 'PADGI' || rawType.includes('INTERN')) {
      typeLabel = 'PADG Intern';
      regulationType = 'PADG_INTERN';
    } else if (rawType === 'PADG') {
      typeLabel = 'PADG';
      regulationType = 'PADG';
    } else if (rawType === 'PDG') {
      typeLabel = 'PDG';
      regulationType = 'PDG';
    } else {
      typeLabel = 'PBI';
      regulationType = 'PBI';
    }

    regulationNumber = `${typeLabel} Nomor ${rawNum} Tahun ${rawYear}`;
  }

  // Case 3: Standard text regulation number pattern
  if (!regulationNumber) {
    const pbiTextMatch = trimmed.match(/(PBI|PADG|PADG\s*Intern|PDG)\s*(?:Nomor|No\.?)\s*(\d+)\s*(?:Tahun|\/)\s*(\d{4})/i);
    if (pbiTextMatch) {
      regulationNumber = `${pbiTextMatch[1].toUpperCase()} Nomor ${pbiTextMatch[2]} Tahun ${pbiTextMatch[3]}`;
      year = parseInt(pbiTextMatch[3], 10);
    }
  }

  // Match against MOCK_REGULATIONS database
  let matchedRegulation: Regulation | undefined;

  if (jdihId) {
    matchedRegulation = MOCK_REGULATIONS.find((r: any) => String(r.jdihId) === String(jdihId));
  }

  if (!matchedRegulation && regulationNumber) {
    const normTarget = regulationNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    matchedRegulation = MOCK_REGULATIONS.find(r => {
      const normReg = (r.number || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return normReg === normTarget || normReg.includes(normTarget) || normTarget.includes(normReg);
    });
  }

  // If matched, extract final metadata
  if (matchedRegulation) {
    regulationNumber = matchedRegulation.number;
    regulationType = matchedRegulation.type;
    year = matchedRegulation.year;
    if (!pdfUrl && (matchedRegulation as any).downloadPdfUrl) {
      pdfUrl = (matchedRegulation as any).downloadPdfUrl;
    }
  }

  const suggestedSearchQuery = regulationNumber || (matchedRegulation ? matchedRegulation.number : trimmed);
  const summaryText = matchedRegulation
    ? `${matchedRegulation.number} tentang ${matchedRegulation.title} (Sektor: ${matchedRegulation.sector})`
    : regulationNumber
    ? `${regulationNumber} (Dokumen Resmi JDIH Bank Indonesia)`
    : isJdihUrl
    ? 'Dokumen Regulasi JDIH Bank Indonesia'
    : trimmed;

  return {
    rawText: trimmed,
    isJdihQr: isJdihUrl || !!regulationNumber || !!matchedRegulation,
    regulationNumber,
    regulationType,
    year,
    pdfUrl,
    matchedRegulation,
    suggestedSearchQuery,
    summaryText
  };
}
