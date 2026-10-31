'use client';

import { cn } from '@/utils/cn';
import type { BookingItem } from '@/types';

export type BookingTab = 'active' | 'done' | 'closed';

/** En cours tant que l'argent n'est pas versé ou qu'un litige est ouvert. */
export function bookingTab(b: BookingItem): BookingTab {
  if (b.status === 'CANCELLED' || b.status === 'REJECTED') return 'closed';
  if (b.status === 'COMPLETED' && b.escrowStatus !== 'HELD' && b.escrowStatus !== 'DISPUTED') return 'done';
  return 'active';
}

const LABELS: Record<BookingTab, string> = { active: 'En cours', done: 'Terminées', closed: 'Annulées' };

export function BookingTabs({ value, onChange, bookings }: { value: BookingTab; onChange: (t: BookingTab) => void; bookings: BookingItem[] }) {
  const counts = bookings.reduce<Record<BookingTab, number>>(
    (acc, b) => {
      acc[bookingTab(b)] += 1;
      return acc;
    },
    { active: 0, done: 0, closed: 0 }
  );

  return (
    <div className="flex gap-1 border-b border-border" role="tablist">
      {(Object.keys(LABELS) as BookingTab[]).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={cn(
            'relative -mb-px flex h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors',
            value === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {LABELS[t]}
          <span className={cn('rounded-md px-1.5 text-[12px] tabular', value === t ? 'bg-sun-400 text-gray-950' : 'bg-muted')}>{counts[t]}</span>
          {value === t && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-foreground" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
