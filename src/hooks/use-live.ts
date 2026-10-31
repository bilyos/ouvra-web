'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { liveStatus, subscribeLive } from '@/services/live';
import { useAuthStore } from '@/stores/auth-store';

/** Écoute un canal temps réel tant que le composant est affiché. `topic` à null = rien. */
export function useLiveTopic(topic: string | null, onMessage: (body: unknown) => void) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });
  useEffect(() => {
    if (!topic) return;
    return subscribeLive(topic, (b) => handler.current(b));
  }, [topic]);
}

/** true quand la connexion temps réel est ouverte (sinon, les pages se rafraîchissent elles-mêmes). */
export function useLiveConnected() {
  return useSyncExternalStore(liveStatus.subscribe, liveStatus.get, () => false);
}

/**
 * À monter une fois dans l'espace connecté : quand une réservation ou une notification
 * change côté serveur, les listes concernées se rechargent sans action de l'utilisateur.
 */
export function useLiveSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useLiveTopic(userId ? `/topic/user-bookings/${userId}` : null, (body) => {
    const id = (body as { bookingId?: string } | null)?.bookingId;
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['booking', id] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
  });

  useLiveTopic(userId ? `/topic/notifications/${userId}` : null, () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });
}
