'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  QrCode, 
  Camera, 
  UploadCloud, 
  Clipboard, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { decodeQrFromImageData, decodeQrFromFile, parseJdihQrData, ParsedJdihQrResult } from '@/lib/jdihQrParser';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegulation: (result: ParsedJdihQrResult) => void;
  actionLabel?: string;
  contextTitle?: string;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onSelectRegulation,
  actionLabel = 'Gunakan Regulasi Ini',
  contextTitle = 'Pindai QR Code Regulasi JDIH BI'
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'paste'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ParsedJdihQrResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Frame scanner loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decodeQrFromImageData(imageData);

        if (code) {
          const parsed = parseJdihQrData(code);
          setScanResult(parsed);
          stopCamera();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [stopCamera]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScanResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera langsung.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin akses kamera ditolak. Silakan izinkan akses kamera pada browser atau gunakan tab "Unggah File" / "Tempel Screenshot".'
          : 'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain. Silakan gunakan tab "Unggah File".'
      );
      setIsScanning(false);
    }
  }, [facingMode, scanVideoFrame, stopCamera]);

  // Handle Tab Switch
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'camera' && !scanResult) {
        startCamera();
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
      setScanResult(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera, scanResult]);

  // Handle Paste (Ctrl + V) from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setIsProcessingFile(true);
            const decoded = await decodeQrFromFile(blob);
            setIsProcessingFile(false);
            if (decoded) {
              const parsed = parseJdihQrData(decoded);
              setScanResult(parsed);
              stopCamera();
            } else {
              alert('Tidak ditemukan QR Code yang valid pada gambar yang Anda tempel.');
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, stopCamera]);

  // Handle file drop or upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const decoded = await decodeQrFromFile(file);
      if (decoded) {
        const parsed = parseJdihQrData(decoded);
        setScanResult(parsed);
        stopCamera();
      } else {
        alert('Tidak ditemukan QR Code yang valid pada berkas gambar yang dipilih.');
      }
    } catch (err) {
      console.error('File scan error:', err);
      alert('Gagal memproses gambar QR Code.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                {contextTitle}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pindai QR regulasi dari portal JDIH Bank Indonesia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!scanResult && (
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition ${
                activeTab === 'camera'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Langsung</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Berkas</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition ${
                activeTab === 'paste'
                  ? 'border-blue-600 text-blue-700 font-bold bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Tempel (Ctrl+V)</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Result Card State */}
          {scanResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-300 text-emerald-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>QR Code Berhasil Terbaca</span>
                  </span>
                  {scanResult.regulationType && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {scanResult.regulationType}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {scanResult.regulationNumber || 'Regulasi JDIH Bank Indonesia'}
                  </h4>
                  {scanResult.matchedRegulation && (
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      {scanResult.matchedRegulation.title}
                    </p>
                  )}
                </div>

                {scanResult.matchedRegulation?.sector && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Sektor:</span> {scanResult.matchedRegulation.sector} &bull; <span className="font-semibold">Status:</span> {scanResult.matchedRegulation.status}
                  </div>
                )}

                {scanResult.pdfUrl && (
                  <div className="pt-1">
                    <a
                      href={scanResult.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                    >
                      <span>Lihat Dokumen PDF Resmi JDIH</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectRegulation(scanResult);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Kamera */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  {cameraError ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Akses Kamera Terkendala</span>
                      </div>
                      <p>{cameraError}</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="text-blue-700 font-bold underline hover:text-blue-900 mt-1 inline-block"
                      >
                        Beralih ke Unggah Gambar QR Code &rarr;
                      </button>
                    </div>
                  ) : (
                    <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-300">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Reticle / Scan Target Box */}
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-56 h-56 border-2 border-emerald-400 rounded-2xl relative shadow-lg">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
                            <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-md animate-pulse top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      )}

                      {!isScanning && (
                        <div className="text-slate-400 text-xs flex items-center space-x-1.5">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menghubungkan ke kamera...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Arahkan kamera ke QR Code JDIH Bank Indonesia</span>
                    <button
                      type="button"
                      onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Balik Kamera
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Unggah File */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition hover:bg-slate-50 space-y-2"
                  >
                    <UploadCloud className="w-10 h-10 text-blue-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">
                      Pilih atau Seret Gambar QR Code ke Sini
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Mendukung tangkapan layar PNG, JPG, JPEG, WEBP
                    </p>
                  </div>

                  {isProcessingFile && (
                    <div className="text-center text-xs text-blue-600 font-semibold flex items-center justify-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang memindai gambar QR Code...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Paste dari Clipboard */}
              {activeTab === 'paste' && (
                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
                    <Clipboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Tempelkan Tangkapan Layar (Clipboard)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Ambil tangkapan layar QR Code di JDIH BI (gunakan <kbd className="font-mono bg-white border border-slate-300 px-1 py-0.5 rounded text-[10px]">Win + Shift + S</kbd>), lalu tekan <kbd className="font-mono bg-white border border-slate-300 px-1 py-0.5 rounded text-[10px]">Ctrl + V</kbd> sekarang.
                    </p>
                  </div>

                  {isProcessingFile && (
                    <div className="text-center text-xs text-indigo-700 font-semibold flex items-center justify-center space-x-1.5 pt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menganalisis clipboard...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Terhubung ke Portal Resmi JDIH Bank Indonesia</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export { QrScannerModal };
