'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';

const resetPasswordSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
  code: z.string().min(1, 'codeRequired').min(4, 'codeTooShort'),
  newPassword: z.string().min(1, 'passwordRequired').min(6, 'passwordTooShort'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tLogin = useTranslations('auth.login');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      code: '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        email: data.email,
        code: data.code,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(axiosError?.response?.data?.message || t('genericError'));
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-600/15">
          <CheckCircle2 className="h-8 w-8 text-brand-700 dark:text-brand-300" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            {t('successTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('successBody')}
          </p>
        </div>
        <Button
          className="h-11 w-full"
          onClick={() => router.push('/auth/login')}
        >
          {t('goToLogin')}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
    >
      {/* Back link */}
      <Link
        href="/auth/forgot-password"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <motion.div
            className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400"
          >
            {serverError}
          </motion.div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              className="pl-10"
              error={!!errors.email}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-[13px] text-red-600 dark:text-red-300">{tLogin(errors.email.message as string)}</p>
          )}
        </div>

        {/* Code */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">{t('code')}</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="code"
              placeholder={t('codePlaceholder')}
              className="pl-10"
              error={!!errors.code}
              {...register('code')}
            />
          </div>
          {errors.code && (
            <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.code.message as string)}</p>
          )}
        </div>

        {/* New password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">{t('password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className="pl-10 pr-10"
              error={!!errors.newPassword}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.newPassword.message as string)}</p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
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

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('rememberPassword')}{' '}
        <Link
          href="/auth/login"
          className="font-medium text-brand-700 hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-300"
        >
          {t('goToLogin')}
        </Link>
      </p>
    </motion.div>
  );
}
