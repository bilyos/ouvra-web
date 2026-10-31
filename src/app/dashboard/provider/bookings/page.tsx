'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Zap,
  MapPin,
} from 'lucide-react';
import { bookingApi } from '@/services/api';
import { cn } from '@/utils/cn';
import { ProviderEscrowActions } from '@/components/bookings/provider-escrow-actions';
import { BookingTabs, bookingTab, type BookingTab } from '@/components/bookings/booking-tabs';
import { formatPrice, formatRelativeTime } from '@/utils/format';
import type { BookingStatus, BookingItem } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-400' },
  ACCEPTED: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-brand-100 text-brand-800 dark:bg-brand-600/15 dark:text-brand-300' },
  COMPLETED: { label: 'Terminée', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
  CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-muted-foreground dark:bg-gray-500/15' },
};

function UrgentBookingCard({ booking, onAccept, isPending }: {
  booking: BookingItem;
  onAccept: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      className="rounded-xl border-2 border-red-300 bg-red-50/50 p-5 dark:border-red-500/30 dark:bg-red-500/5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15">
            <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{booking.title}</h3>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Urgent
              </span>
            </div>
            <p className="text-sm text-gray-500">Client : {booking.clientName}</p>
            {booking.description && (
              <p className="mt-1 text-sm text-muted-foreground">{booking.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
              {booking.expiresAt && (
                <span className="text-red-500 font-medium">
                  Expire {formatRelativeTime(booking.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="text-lg font-bold text-foreground">{formatPrice(booking.price)}</p>
          <p className="text-xs text-gray-400">
            Vous recevrez {formatPrice(Math.round(booking.price * 0.9))}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-red-200 pt-4 dark:border-red-500/20">
        <button
          onClick={onAccept}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Accepter cette demande
        </button>
      </div>
    </motion.div>
  );
}

export default function ProviderBookingsPage() {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', 'received'],
    queryFn: bookingApi.received,
  });

  const { data: urgentBookings = [] } = useQuery({
    queryKey: ['bookings', 'urgent'],
    queryFn: bookingApi.urgent,
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => bookingApi.acceptUrgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const [tab, setTab] = useState<BookingTab>('active');
  const visibleBookings = (bookings ?? []).filter((b) => bookingTab(b) === tab);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Réservations</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">Acceptez les demandes, démarrez une fois payé, terminez avec le code du client.</p>
      </header>

      {/* Urgent Section */}
      {urgentBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-foreground">
              Demandes urgentes
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {urgentBookings.length}
              </span>
            </h2>
          </div>
          {urgentBookings.map((booking) => (
            <UrgentBookingCard
              key={booking.id}
              booking={booking}
              onAccept={() => acceptMutation.mutate(booking.id)}
              isPending={acceptMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Regular Bookings */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="h-20 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <>
        <BookingTabs value={tab} onChange={setTab} bookings={bookings} />
        <div className="space-y-4">
          {visibleBookings.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-[15px] text-muted-foreground dark:border-gray-700">Aucune réservation dans cette liste.</p>
          )}
          {visibleBookings.map((booking) => {
            const config = statusConfig[booking.status];
            const scheduledDate = new Date(booking.scheduledAt);

            return (
              <motion.div
                key={booking.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{booking.title}</h3>
                        {booking.urgent && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Client : {booking.clientName}</p>
                      {booking.description && (
                        <p className="mt-1 text-sm text-gray-400">{booking.description}</p>
                      )}
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

                  <div className="flex flex-col items-end gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', config.color)}>
                      {config.label}
                    </span>
                    <p className="text-lg font-bold text-foreground">{formatPrice(booking.price)}</p>
                    {booking.escrowStatus === 'HELD' && (
                      <span className="text-xs font-medium text-brand-700 dark:text-brand-300">Payé, en attente de fin de travail</span>
                    )}
                  </div>
                </div>

                {booking.status === 'PENDING' && !booking.urgent && (
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                    <button
                      onClick={() => statusMutation.mutate({ id: booking.id, status: 'ACCEPTED' })}
                      disabled={statusMutation.isPending}
                      className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accepter
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: booking.id, status: 'REJECTED' })}
                      disabled={statusMutation.isPending}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </button>
                  </div>
                )}

                <ProviderEscrowActions booking={booking} />
              </motion.div>
            );
          })}
        </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <CalendarCheck className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Aucune demande</h3>
          <p className="text-sm text-gray-500">Les demandes de vos clients apparaîtront ici</p>
        </div>
      )}
    </div>
  );
}
