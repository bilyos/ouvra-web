'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquareText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AuthResponse } from '@/types';

const RESEND_DELAY = 60;

/** « 690000101 » → « 6 90 00 01 01 », comme on le lit à voix haute. */
function formatLocal(digits: string) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 1), d.slice(1, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

/** Garde les 9 chiffres locaux, même si l'utilisateur colle « +237 6… » ou « 00237… ». */
function toLocalDigits(input: string) {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('00237')) d = d.slice(5);
  else if (d.startsWith('237') && d.length > 9) d = d.slice(3);
  return d.slice(0, 9);
}

export function PhoneLoginForm({ onSuccess }: { onSuccess: (response: AuthResponse) => void }) {
  const t = useTranslations('auth.login');
  const { loginWithPhone } = useAuth();
  const [digits, setDigits] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);

  const phone = `+237${digits}`;
  const phoneValid = /^[26]\d{8}$/.test(digits);
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  // Compte à rebours du renvoi
  useEffect(() => {
    if (step !== 'code' || secondsLeft === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [step, secondsLeft]);

  const sendCode = async () => {
    if (!phoneValid) {
      setError(t('phoneInvalid'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await authApi.requestPhoneLogin(phone);
      setDevCode(res.devCode ?? null);
      setStep('code');
      setCode('');
      setResendAt(Date.now() + RESEND_DELAY * 1000);
      setNow(Date.now());
      window.setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      setError(getApiErrorMessage(e, t('phoneInvalid')));
    } finally {
      setPending(false);
    }
  };

  const verify = async (value = code) => {
    if (!/^\d{6}$/.test(value)) {
      setError(t('codeInvalid'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      onSuccess(await loginWithPhone(phone, value));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Code invalide ou expiré.'));
      setPending(false);
    }
  };

  if (step === 'phone') {
    return (
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t('phone')}</Label>
          <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow] focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15 hover:border-gray-300 dark:hover:border-gray-700">
            <span className="flex items-center border-r border-border bg-paper px-3.5 text-[15px] font-semibold text-foreground/80" aria-hidden="true">
              +237
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="6 90 00 01 01"
              value={formatLocal(digits)}
              onChange={(e) => {
                setDigits(toLocalDigits(e.target.value));
                setError(null);
              }}
              aria-describedby="phone-hint"
              aria-invalid={!!error}
              className="min-w-0 flex-1 bg-transparent px-3.5 text-[17px] font-medium tracking-wide tabular outline-none placeholder:text-gray-400"
            />
          </div>
          <p id="phone-hint" className="text-[13px] text-muted-foreground">
            {t('phoneHint')}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <MessageSquareText />}
          {pending ? t('sending') : t('sendCode')}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      noValidate
    >
      <div>
        <p className="text-[15px] font-semibold">{t('codeSentTo', { phone: `+237 ${formatLocal(digits)}` })}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{t('codeSentHint')}</p>
      </div>

      {devCode && (
        <p className="rounded-lg border border-sun-200 bg-sun-50 px-3.5 py-2.5 text-[13px] text-sun-900 dark:border-sun-500/25 dark:bg-sun-500/10 dark:text-sun-100">
          {t('devCode', { code: devCode })}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp">{t('code')}</Label>
        <input
          ref={codeRef}
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(v);
            setError(null);
            // collé ou saisi automatiquement depuis le SMS : on valide aussitôt
            if (v.length === 6) verify(v);
          }}
          aria-invalid={!!error}
          className="h-14 w-full rounded-lg border border-border bg-card text-center font-display text-[28px] font-bold tracking-[0.5em] tabular outline-none transition-[border-color,box-shadow] placeholder:text-gray-300 focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15 dark:placeholder:text-gray-600"
        />
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || code.length !== 6}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? t('verifying') : t('verify')}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setError(null);
            setDevCode(null);
          }}
          className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('changeNumber')}
        </button>
        {secondsLeft > 0 ? (
          <span className="text-muted-foreground tabular">{t('resendIn', { seconds: secondsLeft })}</span>
        ) : (
          <button type="button" onClick={sendCode} disabled={pending} className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">
            {t('resend')}
          </button>
        )}
      </div>

      <p className="text-center text-[13px] text-muted-foreground">
        {t('noAccountPhone')}{' '}
        <Link href="/auth/register" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
          {t('register')}
        </Link>
      </p>
    </form>
  );
}
