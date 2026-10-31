import { api } from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
} from '@/types';

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post<MessageResponse>('/auth/logout', { refreshToken }).then((r) => r.data),

  /** Connexion par téléphone : envoie un code si le numéro a un compte (réponse identique sinon) */
  requestPhoneLogin: (phone: string) =>
    api.post<MessageResponse>('/auth/phone/request', { phone }).then((r) => r.data),

  verifyPhoneLogin: (phone: string, code: string) =>
    api.post<AuthResponse>('/auth/phone/verify', { phone, code }).then((r) => r.data),

  requestOtp: (phone: string) =>
    api.post<MessageResponse>('/auth/otp/request', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, code: string) =>
    api.post<MessageResponse>('/auth/otp/verify', { phone, code }).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<MessageResponse>('/auth/forgot', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<MessageResponse>('/auth/reset', data).then((r) => r.data),
};
