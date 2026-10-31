'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tLogin = useTranslations('auth.login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword({ email: data.email });
      setSentEmail(data.email);
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
            {t('successBody', { email: sentEmail })}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button asChild className="h-11 w-full">
            <Link href="/auth/reset-password">
              {t('enterCode')}
            </Link>
          </Button>
          <Button variant="ghost" asChild className="h-11 w-full">
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4" />
              {t('backToLogin')}
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
    >
      {/* Back link */}
      <Link
        href="/auth/login"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToLogin')}
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
    </motion.div>
  );
}
