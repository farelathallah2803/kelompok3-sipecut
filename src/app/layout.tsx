import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'IRAMA Bank Indonesia | Integrasi Regulasi dan Monitoring Aturan',
  description: 'IRAMA Bank Indonesia - Integrasi Regulasi dan Monitoring Aturan Bank Indonesia. Wadah penyusunan draft petunjuk teknis, uji komparasi regulasi, approval pimpinan, dan tracking alur persetujuan lintas departemen.',
  icons: {
    icon: '/irama-logo.png',
    shortcut: '/irama-logo.png',
    apple: '/irama-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
