import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Marka Club | Moda Feminina',
  description: 'Clube de Vantagens e Carteira Digital de Cashback da La Marka',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-lamarka-50 text-lamarka-900 antialiased">
        {children}
      </body>
    </html>
  );
}
