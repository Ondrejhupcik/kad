import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rezervačný systém pre kaderníkov',
  description: 'Online rezervačný systém pre kaderníctva',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
