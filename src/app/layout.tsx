import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'PRISMA Bank Indonesia | Platform Regulasi, Integrasi, Search, Monitoring & Administration',
  description: 'PRISMA Bank Indonesia - Platform Regulasi, Integrasi, Search, Monitoring & Administration. Wadah penyusunan draft petunjuk teknis, uji komparasi regulasi, approval pimpinan, dan tracking alur persetujuan lintas departemen.',
  icons: {
    icon: '/prisma-icon.png',
    shortcut: '/prisma-icon.png',
    apple: '/prisma-icon.png',
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
