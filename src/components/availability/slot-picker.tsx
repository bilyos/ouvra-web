'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { SlotsResponse } from '@/services/api/availability';

const ZONE = 'Africa/Douala';

const dayLabel = (iso: string, i: number) => {
  if (i === 0) return 'Aujourd’hui';
  if (i === 1) return 'Demain';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).replace('.', '');
};

const hour = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: ZONE }).replace(':00', ' h');

/**
 * Créneaux réellement libres du prestataire : un jour, puis une heure.
 * Les créneaux déjà pris restent visibles, barrés, pour montrer que l'agenda est vrai.
 */
export function SlotPicker({ data, value, onChange }: { data: SlotsResponse; value: string | null; onChange: (iso: string) => void }) {
  const firstOpen = Math.max(
    0,
    data.days.findIndex((d) => d.slots.some((s) => s.free))
  );
  const [dayIndex, setDayIndex] = useState(firstOpen);
  const day = data.days[dayIndex];
  const anyFree = data.days.some((d) => d.slots.some((s) => s.free));

  if (!anyFree) {
    return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-muted-foreground dark:border-gray-700">Aucun créneau libre cette semaine. Écrivez au prestataire pour convenir d’un moment.</p>;
  }

  return (
    <div>
      <div role="tablist" aria-label="Jour" className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {data.days.map((d, i) => {
          const free = d.slots.filter((s) => s.free).length;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={dayIndex === i}
              disabled={free === 0}
              onClick={() => setDayIndex(i)}
              className={cn(
                'flex min-w-[72px] shrink-0 flex-col items-center rounded-lg border px-2.5 py-2 text-sm transition-colors disabled:opacity-40',
                dayIndex === i ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
              )}
            >
              <span className="font-semibold capitalize">{dayLabel(d.date, i)}</span>
              <span className={cn('text-[12px]', dayIndex === i ? 'opacity-80' : 'text-muted-foreground')}>{d.slots.length === 0 ? 'fermé' : free === 0 ? 'complet' : `${free} libre${free > 1 ? 's' : ''}`}</span>
            </button>
          );
        })}
      </div>

      <div role="radiogroup" aria-label="Heure" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {day?.slots.length ? (
          day.slots.map((s) => (
            <button
              key={s.start}
              type="button"
              role="radio"
              aria-checked={value === s.start}
              disabled={!s.free}
              onClick={() => onChange(s.start)}
              className={cn(
                'h-10 rounded-lg border text-sm font-semibold tabular transition-colors',
                !s.free && 'cursor-not-allowed border-dashed text-muted-foreground line-through opacity-60',
                s.free && value === s.start && 'border-sun-500 bg-sun-400 text-gray-950',
                s.free && value !== s.start && 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
              )}
              title={s.free ? undefined : 'Déjà réservé'}
            >
              {hour(s.start)}
            </button>
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">Pas de créneau ce jour-là.</p>
        )}
      </div>
    </div>
  );
}
