'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Camera, ChevronRight, Mic, Plus } from 'lucide-react';
import { requestApi } from '@/services/api';
import { REQUEST_STATUS, agoText, remainingText } from '@/components/requests/labels';
import { cn } from '@/utils/cn';
import type { JobRequestItem } from '@/types';

function Thumb({ r }: { r: JobRequestItem }) {
  const photo = r.media.find((m) => m.kind === 'PHOTO');
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.thumbnailUrl ?? photo.url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      {r.voiceUrl ? <Mic className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
    </span>
  );
}

function summary(r: JobRequestItem) {
  if (r.status === 'OPEN') {
    const left = remainingText(r.expiresAt);
    const quotes = r.quoteCount === 0 ? 'Aucun devis pour l’instant' : `${r.quoteCount} devis reçu${r.quoteCount > 1 ? 's' : ''}`;
    return left ? `${quotes}, ${left}` : quotes;
  }
  if (r.status === 'ASSIGNED') return 'Réservation en cours';
  if (r.status === 'EXPIRED') return 'Expirée sans choix, vous pouvez la relancer';
  return `Retirée, publiée ${agoText(r.createdAt)}`;
}

export default function MyRequestsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['requests', 'mine'], queryFn: requestApi.mine, refetchInterval: 30_000 });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes demandes</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Vos problèmes publiés et les devis reçus.</p>
        </div>
        <Link
          href="/dashboard/client/requests/new"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-sun-400 px-4 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-sun-300"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Montrer un problème
        </Link>
      </header>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="text-lg font-semibold">Une fuite, une panne, un meuble à monter ?</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
            Prenez une photo ou laissez une note vocale. Les prestataires du quartier vous répondent avec un prix.
          </p>
          <Link href="/dashboard/client/requests/new" className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand-800 px-5 text-[15px] font-semibold text-white hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950">
            Publier ma première demande
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {data.map((r) => {
            const s = REQUEST_STATUS[r.status];
            return (
              <li key={r.id}>
                <Link href={`/dashboard/client/requests/${r.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/60">
                  <Thumb r={r} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[16px] font-semibold">{r.title}</span>
                      <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold', s.tone)}>{s.label}</span>
                    </span>
                    <span className={cn('mt-1 block text-sm', r.status === 'OPEN' && r.quoteCount > 0 ? 'font-semibold text-brand-800 dark:text-brand-200' : 'text-muted-foreground')}>
                      {summary(r)}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
