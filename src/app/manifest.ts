import type { MetadataRoute } from 'next';

/** Permet d'installer Ouvra depuis le navigateur, comme une application. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ouvra, artisans vérifiés au Cameroun',
    short_name: 'Ouvra',
    description: 'Trouvez un artisan vérifié près de chez vous, payez par Mobile Money, l’argent reste bloqué jusqu’à la fin du travail.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'fr',
    background_color: '#ffffff',
    theme_color: '#12553b',
    categories: ['business', 'lifestyle', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Mes réservations', url: '/dashboard/client/bookings', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Demande urgente', url: '/dashboard/client/urgent', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
