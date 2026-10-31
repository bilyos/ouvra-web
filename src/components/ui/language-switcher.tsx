'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { cn } from '@/utils/cn';
import { setUserLocale } from '@/i18n/locale';
import { locales, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locales[(locales.indexOf(locale) + 1) % locales.length];
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={locale === "fr" ? "Passer en anglais" : "Switch to French"}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        isPending && 'opacity-50',
        className
      )}
    >
      <Languages className="h-[18px] w-[18px]" />
      <span className="text-[13px] font-semibold uppercase">{locale}</span>
    </button>
  );
}
