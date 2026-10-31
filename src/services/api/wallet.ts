import { api } from './client';
import type { WalletInfo, WalletTransaction, WithdrawRequest } from '@/types';

export const walletApi = {
  get: () =>
    api.get<WalletInfo>('/wallet').then((r) => r.data),

  transactions: () =>
    api.get<WalletTransaction[]>('/wallet/transactions').then((r) => r.data),

  withdraw: (data: WithdrawRequest) =>
    api.post<WalletTransaction>('/wallet/withdraw', data).then((r) => r.data),
};
