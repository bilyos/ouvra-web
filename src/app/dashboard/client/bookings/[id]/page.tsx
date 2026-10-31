'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Loader2, MapPin, MessageSquare } from 'lucide-react';
import { bookingApi, chatApi } from '@/services/api';
import { BookingTracker } from '@/components/bookings/booking-tracker';
import { ClientEscrowPanel } from '@/components/bookings/client-escrow-panel';
import { EmptyState } from '@/components/dashboard/page-parts';
import { useLiveConnected } from '@/hooks/use-live';
import { formatPrice, getInitials } from '@/utils/format';

export default function BookingTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const live = useLiveConnected();

  // Les changements arrivent par la connexion temps réel ; sans elle, on recharge toutes les 20 s
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.detail(id),
    enabled: !!id,
    refetchInterval: live ? false : 20_000,
  });

  const contact = useMutation({
    mutationFn: (providerId: string) => chatApi.startConversation(providerId),
    onSuccess: (conv) => router.push(`/dashboard/messages?conv=${conv.id}`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!booking) {
    return <EmptyState title="Réservation introuvable" description="Elle a peut-être été supprimée." actionLabel="Mes réservations" actionHref="/dashboard/client/bookings" />;
  }

  const when = new Date(booking.scheduledAt);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/client/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Mes réservations
      </Link>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{booking.title}</h1>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {when.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {booking.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {booking.address}
              </span>
            )}
          </p>
        </div>
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground" aria-live="polite">
          <span className={live ? 'h-2 w-2 rounded-full bg-brand-500' : 'h-2 w-2 rounded-full bg-gray-400'} aria-hidden="true" />
          {live ? 'Mis à jour en direct' : 'Actualisé toutes les 20 secondes'}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-7" aria-label="Suivi">
          <BookingTracker booking={booking} />
          <ClientEscrowPanel booking={booking} />
        </section>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          {booking.providerId ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                  {booking.providerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
                    <img loading="lazy" decoding="async" src={booking.providerAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(booking.providerName ?? '?')
                  )}
                </span>
                <span className="min-w-0">
                  <Link href={`/providers/${booking.providerId}`} className="block truncate font-semibold hover:underline">
                    {booking.providerName}
                  </Link>
                  <span className="block truncate text-[13px] text-muted-foreground">{booking.providerProfession}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => contact.mutate(booking.providerId!)}
                disabled={contact.isPending}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted disabled:opacity-60"
              >
                {contact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Écrire
              </button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-muted-foreground dark:border-gray-700">Aucun prestataire n’a encore accepté.</p>
          )}
          <dl className="rounded-xl border border-border bg-card p-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Montant</dt>
              <dd className="font-semibold tabular">{formatPrice(booking.price)}</dd>
            </div>
            {booking.description && <p className="mt-3 border-t border-border pt-3 text-muted-foreground">{booking.description}</p>}
          </dl>
        </aside>
      </div>
    </div>
  );
}
