import Link from 'next/link';
import { cn } from '@/utils/cn';

export const BRAND_NAME = 'Ouvra';

/** Écrou à six pans aux angles adoucis, percé au centre. */
const NUT =
  'M11.57 3.56Q16 1 20.43 3.56L24.56 5.94Q28.99 8.5 28.99 13.62L28.99 18.38Q28.99 23.5 24.56 26.06L20.43 28.44Q16 31 11.57 28.44L7.44 26.06Q3.01 23.5 3.01 18.38L3.01 13.62Q3.01 8.5 7.44 5.94Z' +
  'M16 9.6a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z';

/**
 * Le symbole : un écrou vu de face, qui se lit aussi comme le « o » d'Ouvra.
 * Le disque jaune au centre reprend le voyant du taxi libre.
 * `inverse` sert sur les fonds vert foncé (barre latérale, pied de page).
 */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-8 w-8 shrink-0', className)}>
      <path d={NUT} fillRule="evenodd" className={inverse ? 'fill-white' : 'fill-brand-700 dark:fill-brand-300'} />
      <circle cx="16" cy="16" r="4.1" className="fill-sun-400" />
    </svg>
  );
}

/** Mot-symbole en minuscules : plus accueillant, et le « o » rime avec l'écrou. */
export function Wordmark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <span className={cn('font-display text-[21px] font-extrabold leading-none tracking-[-0.045em]', inverse ? 'text-white' : 'text-foreground', className)}>
      ouvra
    </span>
  );
}

export function Logo({ className, href = '/', inverse = false }: { className?: string; href?: string; inverse?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 rounded-md', className)} aria-label={`${BRAND_NAME}, accueil`}>
      <LogoMark inverse={inverse} className="transition-transform duration-500 ease-out group-hover:rotate-[60deg] motion-reduce:transition-none" />
      <Wordmark inverse={inverse} />
    </Link>
  );
}
