import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Life OS',
  description: 'Sistem manajemen kehidupan personal terpadu: Daily Life, Finance, Travel, Academic, Task, Calendar, Journal, dan Dokumentasi Google Drive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
