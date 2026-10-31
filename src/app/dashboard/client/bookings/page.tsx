'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Zap,
  MessageSquare,
  User,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { bookingApi, chatApi } from '@/services/api';
import { cn } from '@/utils/cn';
import { ClientEscrowPanel } from '@/components/bookings/client-escrow-panel';
import { BookingTrackerCompact } from '@/components/bookings/booking-tracker';
import { BookingTabs, bookingTab, type BookingTab } from '@/components/bookings/booking-tabs';
import { formatPrice, formatRelativeTime } from '@/utils/format';
import type { BookingStatus, BookingItem } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-400', icon: Clock },
  ACCEPTED: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: CheckCircle2 },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', icon: XCircle },
  IN_PROGRESS: { label: 'En cours', color: 'bg-brand-100 text-brand-800 dark:bg-brand-600/15 dark:text-brand-300', icon: Loader2 },
  COMPLETED: { label: 'Terminée', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', icon: CheckCircle2 },
  CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-muted-foreground dark:bg-gray-500/15', icon: XCircle },
};

function UrgentPendingCard({ booking }: { booking: BookingItem }) {
  return (
    <motion.div
      className="rounded-xl border-2 border-sun-300 bg-sun-50/50 p-5 dark:border-sun-500/30 dark:bg-sun-500/5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-100 dark:bg-sun-500/15">
          <Loader2 className="h-5 w-5 animate-spin text-sun-600 dark:text-sun-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{booking.title}</h3>
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Urgent
            </span>
          </div>
          <p className="text-sm text-sun-700 dark:text-sun-400">
            Recherche d&apos;un prestataire en cours...
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {booking.address && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {booking.address}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(booking.createdAt)}
        </span>
        <span className="font-semibold text-foreground">
          {formatPrice(booking.price)}
        </span>
        {booking.expiresAt && (
          <span className="text-sun-600 font-medium dark:text-sun-400">
            Expire {formatRelativeTime(booking.expiresAt)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function UrgentAcceptedCard({ booking, onContact, isContacting }: {
  booking: BookingItem;
  onContact: () => void;
  isContacting: boolean;
}) {
  return (
    <motion.div
      className="rounded-xl border-2 border-brand-300 bg-brand-50/50 p-5 dark:border-brand-500/30 dark:bg-brand-500/5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/15">
            <CheckCircle2 className="h-6 w-6 text-brand-600 dark:text-brand-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
              Prestataire trouvé !
            </p>
            <h3 className="text-lg font-bold text-foreground">{booking.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                {booking.providerAvatarUrl ? (
                  <img loading="lazy" decoding="async" src={booking.providerAvatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5 text-gray-500" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">
                {booking.providerName}
              </span>
              {booking.providerProfession && (
                <span className="text-xs text-gray-500">— {booking.providerProfession}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onContact}
            disabled={isContacting}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50"
          >
            {isContacting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Contacter
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClientBookingsPage() {
  const router = useRouter();
  const [contactingId, setContactingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: bookingApi.mine,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPendingUrgent = data?.some((b) => b.urgent && b.status === 'PENDING' && !b.providerId);
      return hasPendingUrgent ? 10000 : false;
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (booking: BookingItem) => {
      setContactingId(booking.id);
      const conversation = await chatApi.startConversation(booking.providerId!);
      const message = `Demande urgente : ${booking.title}\nAdresse : ${booking.address ?? 'non précisée'}\nBudget proposé : ${formatPrice(booking.price)}${booking.description ? `\nDétails : ${booking.description}` : ''}`;
      await chatApi.sendMessage(conversation.id, { text: message });
      return conversation.id;
    },
    onSuccess: (conversationId) => {
      setContactingId(null);
      router.push(`/dashboard/messages?conv=${conversationId}`);
    },
    onError: () => {
      setContactingId(null);
    },
  });

  const { urgentPending, urgentAccepted, regularBookings } = useMemo(() => {
    if (!bookings) return { urgentPending: [], urgentAccepted: [], regularBookings: [] };
    const up: BookingItem[] = [];
    const ua: BookingItem[] = [];
    const reg: BookingItem[] = [];
    for (const b of bookings) {
      if (b.urgent && b.status === 'PENDING' && !b.providerId) {
        up.push(b);
      } else if (b.urgent && b.status === 'ACCEPTED' && b.providerId) {
        ua.push(b);
      } else {
        reg.push(b);
      }
    }
    return { urgentPending: up, urgentAccepted: ua, regularBookings: reg };
  }, [bookings]);
  const [tab, setTab] = useState<BookingTab>('active');
  const visibleBookings = regularBookings.filter((b) => bookingTab(b) === tab);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes réservations</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Payez, suivez et confirmez vos interventions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/client/urgent"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            <Zap className="h-4 w-4" />
            Urgence
          </Link>
          <Link href="/search" className="inline-flex h-10 items-center rounded-lg bg-sun-400 px-4 text-sm font-bold text-gray-950 hover:bg-sun-300">
            Trouver un prestataire
          </Link>
        </div>
      </header>

      {/* Urgent pending — searching for provider */}
      <AnimatePresence>
        {urgentPending.length > 0 && (
          <div className="space-y-3">
            {urgentPending.map((booking) => (
              <UrgentPendingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Urgent accepted — provider found */}
      <AnimatePresence>
        {urgentAccepted.length > 0 && (
          <div className="space-y-3">
            {urgentAccepted.map((booking) => (
              <UrgentAcceptedCard
                key={booking.id}
                booking={booking}
                onContact={() => contactMutation.mutate(booking)}
                isContacting={contactingId === booking.id}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {regularBookings.length > 0 && <BookingTabs value={tab} onChange={setTab} bookings={regularBookings} />}

      {/* Regular bookings */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {visibleBookings.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-[15px] text-muted-foreground dark:border-gray-700">Aucune réservation dans cette liste.</p>
          )}
          {visibleBookings.map((booking) => {
            const config = statusConfig[booking.status];
            const StatusIcon = config.icon;
            const scheduledDate = new Date(booking.scheduledAt);

            return (
              <motion.div
                key={booking.id}
              >
                <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-brand-600/30 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-600/15">
                        <CalendarCheck className="h-6 w-6 text-brand-700 dark:text-brand-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            <Link href={`/dashboard/client/bookings/${booking.id}`} className="hover:underline">
                              {booking.title}
                            </Link>
                          </h3>
                          {booking.urgent && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {booking.providerName
                            ? `${booking.providerName}, ${booking.providerProfession}`
                            : 'Prestataire non assigné'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scheduledDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' à '}
                            {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {booking.address && <span>{booking.address}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', config.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{formatPrice(booking.price)}</p>
                      </div>
                    </div>
                  </div>
                  {bookingTab(booking) === 'active' && (
                    <Link href={`/dashboard/client/bookings/${booking.id}`} className="mt-4 block rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50">
                      <BookingTrackerCompact booking={booking} />
                      <span className="mt-1.5 inline-block text-[13px] font-semibold text-brand-700 dark:text-brand-300">Suivre la demande</span>
                    </Link>
                  )}
                  <ClientEscrowPanel booking={booking} />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700"
        >
          <CalendarCheck className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Aucune réservation</h3>
          <p className="mb-6 text-sm text-gray-500">Trouvez un prestataire et réservez son service</p>
          <Link href="/search">
            <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700">
              Rechercher un prestataire
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
