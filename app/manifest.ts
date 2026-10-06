import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'The Box - Zone de Décision Tactique',
    short_name: 'The Box',
    description: 'Application professionnelle de coaching, tableau blanc tactique multi-sports et assistant analytique.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07090e',
    theme_color: '#00E599',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
