import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Marka Club | Moda Feminina',
  description: 'Clube de Vantagens e Carteira Digital de Cashback da La Marka',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#C59B94',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-lamarka-50 text-lamarka-900 antialiased selection:bg-lamarka-300 selection:text-lamarka-900">
        {children}
      </body>
    </html>
  );
}
