import { useSyncExternalStore } from 'react';

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

function currentPeriod(): DayPeriod {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

const noopSubscribe = () => () => {};

/**
 * Moment de la journée selon l'heure locale du navigateur.
 * Le serveur ne connaît pas le fuseau du visiteur : il rend « morning », puis le client corrige sans erreur d'hydratation.
 */
export function useDayPeriod(): DayPeriod {
  return useSyncExternalStore(noopSubscribe, currentPeriod, () => 'morning');
}
