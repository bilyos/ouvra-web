'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { availabilityApi, type AvailabilityRule } from '@/services/api/availability';
import { Section } from '@/components/dashboard/page-parts';
import { getApiErrorMessage } from '@/utils/api-error';
import { cn } from '@/utils/cn';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
// Toutes les demi-heures de 5 h à minuit
const TIMES = Array.from({ length: 39 }, (_, i) => {
  const m = 5 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});

type Day = { open: boolean; start: string; end: string };
const closed = (): Day => ({ open: false, start: '08:00', end: '18:00' });

const PRESETS: { label: string; days: Day[] }[] = [
  { label: 'Lun–Sam, 8 h–18 h', days: DAYS.map((_, i) => ({ open: i < 6, start: '08:00', end: '18:00' })) },
  { label: 'Tous les jours, 7 h–20 h', days: DAYS.map(() => ({ open: true, start: '07:00', end: '20:00' })) },
  { label: 'Semaine, 17 h–21 h', days: DAYS.map((_, i) => ({ open: i < 5, start: '17:00', end: '21:00' })) },
];

function fromRules(rules: AvailabilityRule[]): Day[] {
  return DAYS.map((_, i) => {
    const r = rules.filter((x) => x.dayOfWeek === i + 1);
    if (r.length === 0) return closed();
    // Une plage par jour dans cet éditeur : on prend la journée de la première à la dernière heure
    return { open: true, start: r[0].start, end: r[r.length - 1].end };
  });
}

const toRules = (days: Day[]): AvailabilityRule[] => days.flatMap((d, i) => (d.open ? [{ dayOfWeek: i + 1, start: d.start, end: d.end }] : []));

/** Horaires du prestataire : les clients ne voient que ces créneaux, moins ceux déjà réservés. */
export function ScheduleEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-availability'], queryFn: availabilityApi.mine });
  const [draft, setDraft] = useState<Day[] | null>(null);
  const [saved, setSaved] = useState(false);

  const current = data ? fromRules(data) : null;
  const days = draft ?? current ?? DAYS.map(closed);
  const dirty = draft != null && JSON.stringify(toRules(draft)) !== JSON.stringify(toRules(current ?? []));
  const invalid = days.findIndex((d) => d.open && d.start >= d.end);

  const save = useMutation({
    mutationFn: () => availabilityApi.replace(toRules(days)),
    onSuccess: (rules) => {
      queryClient.setQueryData(['my-availability'], rules);
      setDraft(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const update = (i: number, patch: Partial<Day>) => setDraft(days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const select = 'h-10 rounded-lg border border-border bg-card px-2.5 text-sm tabular outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15 disabled:opacity-40';

  return (
    <Section
      title="Vos horaires"
      description="Les clients choisissent parmi vos créneaux libres. Une intervention bloque 2 heures. Sans horaires, ils proposent librement une date."
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setDraft(p.days.map((d) => ({ ...d })))} className="h-8 rounded-full bg-muted px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground">
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => setDraft(DAYS.map(closed))} className="h-8 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground">
              Tout fermer
            </button>
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {days.map((d, i) => (
              <li key={DAYS[i]} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-2.5">
                <label className="flex w-32 cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input type="checkbox" checked={d.open} onChange={(e) => update(i, { open: e.target.checked })} className="h-4 w-4 accent-brand-700" />
                  {DAYS[i]}
                </label>
                {d.open ? (
                  <span className="flex items-center gap-2 text-sm">
                    <select aria-label={`${DAYS[i]}, début`} value={d.start} onChange={(e) => update(i, { start: e.target.value })} className={select}>
                      {TIMES.slice(0, -1).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground">à</span>
                    <select aria-label={`${DAYS[i]}, fin`} value={d.end} onChange={(e) => update(i, { end: e.target.value })} className={cn(select, d.start >= d.end && 'border-red-500')}>
                      {TIMES.slice(1).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Fermé</span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={!dirty || invalid >= 0 || save.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sun-400 px-5 text-sm font-bold text-gray-950 hover:bg-sun-300 disabled:opacity-50"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer les horaires
            </button>
            {dirty && (
              <button type="button" onClick={() => setDraft(null)} className="h-10 rounded-lg px-3 text-sm font-semibold hover:bg-muted">
                Annuler
              </button>
            )}
            {saved && !dirty && (
              <span className="inline-flex items-center gap-1.5 text-sm text-brand-700 dark:text-brand-300">
                <Check className="h-4 w-4" strokeWidth={3} />
                Enregistré
              </span>
            )}
            {invalid >= 0 && <span className="text-[13px] text-red-600 dark:text-red-300">{DAYS[invalid]} : la fin doit être après le début.</span>}
          </div>
          {save.isError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {getApiErrorMessage(save.error, 'Les horaires n’ont pas pu être enregistrés.')}
            </p>
          )}
        </>
      )}
    </Section>
  );
}
