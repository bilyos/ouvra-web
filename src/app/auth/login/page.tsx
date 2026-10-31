'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { PhoneLoginForm } from '@/components/auth/phone-login-form';
import type { AuthResponse } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(1, 'passwordRequired'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Le téléphone d'abord : c'est l'identifiant que tout le monde a au Cameroun
  const [mode, setMode] = useState<'phone' | 'email'>('phone');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const goToDashboard = (response: AuthResponse) => {
    const role = response.user.role;
    setRedirecting(true);
    // Retour à la page d'origine (ex. profil d'un prestataire) si elle est interne au site
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      router.push(next);
      return;
    }
    if (role === 'ADMIN') router.push('/dashboard/admin');
    else if (role === 'PROVIDER') router.push('/dashboard/provider');
    else router.push('/dashboard/client');
  };

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      goToDashboard(await login(data));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(axiosError?.response?.data?.message || t('error'));
    }
  };

  return (
    <div className="relative flex flex-col gap-8">
      {(isSubmitting || redirecting) && (
        <LoadingOverlay label={t('loading')} />
      )}

      <div>
        <h1 className="text-3xl font-bold">
          {t('title')}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label={t('title')}>
        {(['phone', 'email'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'phone' ? <Smartphone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            {m === 'phone' ? t('tabPhone') : t('tabEmail')}
          </button>
        ))}
      </div>

      {mode === 'phone' ? (
        <PhoneLoginForm onSuccess={goToDashboard} />
      ) : (
      <>
      <div>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {tAuth('google')}
        </button>
      </div>

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-4 text-xs text-muted-foreground">{tAuth('or')}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {serverError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            error={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.email.message as string)}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('password')}</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className="pr-10"
              error={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.password.message as string)}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
              rememberMe
                ? 'border-brand-600 bg-brand-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {rememberMe && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <label
            className="text-sm text-muted-foreground cursor-pointer select-none"
            onClick={() => setRememberMe(!rememberMe)}
          >
            {t('rememberMe')}
          </label>
        </div>

        <Button type="submit" className="h-11 w-full mt-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>
      </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/auth/register" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300">
          {t('register')}
        </Link>
      </p>
    </div>
  );
}
