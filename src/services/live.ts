'use client';

import { Client, type StompSubscription } from '@stomp/stompjs';
import { config } from '@/config';

/**
 * Connexion temps réel (STOMP sur WebSocket) partagée par toute l'app.
 * Elle s'ouvre au premier abonnement, se referme quand plus personne n'écoute,
 * et se réabonne seule après une coupure réseau.
 */
type Listener = (body: unknown) => void;

const listeners = new Map<string, Set<Listener>>();
const subscriptions = new Map<string, StompSubscription>();
const statusListeners = new Set<() => void>();
let connected = false;
let client: Client | null = null;

function setConnected(v: boolean) {
  if (connected === v) return;
  connected = v;
  statusListeners.forEach((l) => l());
}

function brokerUrl() {
  // NEXT_PUBLIC_WS_URL peut pointer vers l'ancien point d'entrée SockJS : on garde ws(s)://…/ws
  return config.wsUrl.replace(/^http/, 'ws');
}

function subscribeOnBroker(topic: string) {
  if (!client?.connected || subscriptions.has(topic)) return;
  const sub = client.subscribe(topic, (frame) => {
    let body: unknown = frame.body;
    try {
      body = JSON.parse(frame.body);
    } catch {
      /* corps texte */
    }
    listeners.get(topic)?.forEach((l) => l(body));
  });
  subscriptions.set(topic, sub);
}

function ensureClient() {
  if (client || typeof window === 'undefined') return;
  client = new Client({
    brokerURL: brokerUrl(),
    reconnectDelay: 5000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
    // Le jeton peut avoir été rafraîchi entre deux connexions
    beforeConnect: () => {
      const token = sessionStorage.getItem('accessToken');
      if (client) client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    onConnect: () => {
      subscriptions.clear();
      setConnected(true);
      listeners.forEach((_, topic) => subscribeOnBroker(topic));
    },
    onWebSocketClose: () => {
      subscriptions.clear();
      setConnected(false);
    },
    onStompError: () => setConnected(false),
    debug: () => {},
  });
  client.activate();
}

export function subscribeLive(topic: string, listener: Listener): () => void {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic)!.add(listener);
  ensureClient();
  subscribeOnBroker(topic);

  return () => {
    const set = listeners.get(topic);
    set?.delete(listener);
    if (set && set.size === 0) {
      listeners.delete(topic);
      subscriptions.get(topic)?.unsubscribe();
      subscriptions.delete(topic);
    }
    if (listeners.size === 0 && client) {
      void client.deactivate();
      client = null;
      setConnected(false);
    }
  };
}

export const liveStatus = {
  subscribe(cb: () => void) {
    statusListeners.add(cb);
    return () => statusListeners.delete(cb);
  },
  get: () => connected,
};
