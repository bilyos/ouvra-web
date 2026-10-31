import { api } from './client';
import type {
  User,
  UpdateMeRequest,
  ChangePasswordRequest,
  MessageResponse,
} from '@/types';

export const userApi = {
  me: () =>
    api.get<User>('/me').then((r) => r.data),

  update: (data: UpdateMeRequest) =>
    api.put<User>('/me', data).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<MessageResponse>('/me/password', data).then((r) => r.data),

  deleteAccount: () =>
    api.delete('/me').then((r) => r.data),
};
