import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'SI-JUKNIS Bank Indonesia | Portal Harmonisasi & Tracking Petunjuk Teknis',
  description: 'Wadah penyusunan draft petunjuk teknis, uji komparasi regulasi (PBI, PADG, PADG Intern), approval pimpinan, dan tracking alur persetujuan lintas departemen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-700">SI-JUKNIS Bank Indonesia</span> &copy; 2026. Platform Harmonisasi Regulasi Internal.
              </div>
              <div className="flex items-center space-x-4 text-slate-400">
                <span>Mengacu pada Hierarki: PBI &gt; PADG &gt; PADG Intern &gt; Petunjuk Teknis</span>
                <a 
                  href="https://jdih.bi.go.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition underline"
                >
                  jdih.bi.go.id
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
