import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** En-tête commun des pages de l'espace : titre, phrase d'aide, actions à droite. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Bloc titré : bordure fine, pas d'ombre. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  id?: string;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section id={id} className={cn('rounded-xl border border-border bg-card', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Écran vide : dit ce qui apparaîtra ici et propose la prochaine action. */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-[15px] text-muted-foreground">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-6 inline-flex h-11 items-center rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 hover:bg-sun-300">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/** Rangée de chiffres séparés par des filets (pas de cartes identiques). */
export function Figures({ items }: { items: { label: string; value: ReactNode; muted?: boolean }[] }) {
  return (
    <dl
      className={cn(
        'grid divide-y divide-border rounded-xl border border-border bg-card sm:divide-x sm:divide-y-0',
        items.length === 2 && 'sm:grid-cols-2',
        items.length === 3 && 'sm:grid-cols-3',
        items.length >= 4 && 'grid-cols-2 sm:grid-cols-4 [&>*:nth-child(2)]:border-l [&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(2)]:border-l-0'
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="flex flex-col-reverse px-5 py-4">
          <dt className="mt-1 text-sm text-muted-foreground">{it.label}</dt>
          <dd className={cn('font-display text-[1.75rem] font-bold leading-tight tabular', it.muted && 'text-foreground/70')}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pastille de statut sobre : un point de couleur et un libellé. */
export function StatusDot({ tone, children }: { tone: 'green' | 'yellow' | 'red' | 'gray' | 'blue'; children: ReactNode }) {
  const dot = { green: 'bg-brand-500', yellow: 'bg-sun-500', red: 'bg-red-500', gray: 'bg-gray-400', blue: 'bg-blue-500' }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium">
      <span className={cn('h-2 w-2 rounded-full', dot)} aria-hidden="true" />
      {children}
    </span>
  );
}
