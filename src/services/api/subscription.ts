import { api } from './client';
import type { SubscriptionPlan, SubscriptionInfo } from '@/types';

export const subscriptionApi = {
  plans: () =>
    api.get<SubscriptionPlan[]>('/subscriptions/plans').then((r) => r.data),

  mine: () =>
    api.get<SubscriptionInfo | null>('/subscriptions/mine').then((r) => r.data),

  subscribe: (planSlug: string) =>
    api.post<SubscriptionInfo>('/subscriptions', { planSlug }).then((r) => r.data),
};
