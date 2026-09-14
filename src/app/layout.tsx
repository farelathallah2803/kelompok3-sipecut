import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

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
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
