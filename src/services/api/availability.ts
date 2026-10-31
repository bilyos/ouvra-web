import { api } from './client';

/** Plage hebdomadaire : jour ISO (1 = lundi) et heures « HH:mm », heure du Cameroun. */
export interface AvailabilityRule {
  dayOfWeek: number;
  start: string;
  end: string;
}

export interface Slot {
  start: string;
  free: boolean;
}

export interface SlotsResponse {
  /** false : le prestataire n'a pas encore d'horaires, la date se choisit librement */
  hasSchedule: boolean;
  slotMinutes: number;
  days: { date: string; slots: Slot[] }[];
}

export const availabilityApi = {
  weekly: (providerId: string) => api.get<AvailabilityRule[]>(`/providers/${providerId}/availability`).then((r) => r.data),

  slots: (providerId: string, days = 7) => api.get<SlotsResponse>(`/providers/${providerId}/slots`, { params: { days } }).then((r) => r.data),

  mine: () => api.get<AvailabilityRule[]>('/me/provider-profile/availability').then((r) => r.data),

  replace: (rules: AvailabilityRule[]) => api.put<AvailabilityRule[]>('/me/provider-profile/availability', rules).then((r) => r.data),
};
