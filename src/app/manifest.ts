import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'La Marka Club',
    short_name: 'La Marka Club',
    description: 'Clube de Vantagens e Carteira Digital de Cashback da La Marka Moda Feminina',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6F5',
    theme_color: '#C59B94',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
