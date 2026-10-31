'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/**
 * Enregistre le service worker (en production seulement : en dev il garderait de vieux fichiers)
 * et affiche un bandeau quand la connexion est coupée.
 */
export function PwaSupport() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      /* sans service worker, le site marche normalement en ligne */
    });
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-gray-950 px-4 py-2.5 text-[13px] font-medium text-white sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:rounded-full sm:px-5">
      <WifiOff className="h-4 w-4 shrink-0 text-sun-400" aria-hidden="true" />
      Hors connexion : vous voyez la dernière version enregistrée.
    </div>
  );
}
