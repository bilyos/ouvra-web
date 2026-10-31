'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { bookingApi, providerApi } from '@/services/api';
import { EmptyState, Figures, PageHeader, Section } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';
import { formatPrice, formatRating } from '@/utils/format';
import type { BookingItem } from '@/types';

const PROVIDER_SHARE = 0.9;
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const earned = (b: BookingItem) => b.status === 'COMPLETED' && b.escrowStatus !== 'REFUNDED';
const doneAt = (b: BookingItem) => new Date(b.completedAt ?? b.scheduledAt);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

export default function ProviderStatsPage() {
  const [range, setRange] = useState<6 | 12>(6);
  const { data: stats } = useQuery({ queryKey: ['provider-stats'], queryFn: providerApi.stats });
  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['bookings', 'received'], queryFn: bookingApi.received });

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: range }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (range - 1 - i), 1);
      const list = bookings.filter((b) => {
        if (!earned(b)) return false;
        const t = doneAt(b);
        return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
      });
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
        full: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        amount: list.reduce((s, b) => s + Math.round(b.price * PROVIDER_SHARE), 0),
        count: list.length,
      };
    });
  }, [bookings, range]);

  const answered = bookings.filter((b) => b.status !== 'PENDING');
  const accepted = bookings.filter((b) => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status));
  const completed = bookings.filter(earned);
  const finishedOrCancelled = bookings.filter((b) => b.status === 'COMPLETED' || (b.status === 'CANCELLED' && b.escrowStatus !== 'NONE'));
  const totalEarned = completed.reduce((s, b) => s + Math.round(b.price * PROVIDER_SHARE), 0);
  const average = completed.length > 0 ? Math.round(totalEarned / completed.length) : 0;
  const max = Math.max(1, ...months.map((m) => m.amount));

  const byDay = DAYS.map(() => 0);
  for (const b of accepted) byDay[(new Date(b.scheduledAt).getDay() + 6) % 7] += 1;
  const busiest = Math.max(...byDay);

  const serviceMap = new Map<string, { title: string; count: number; amount: number }>();
  for (const b of completed) {
    const k = b.title.trim().toLowerCase();
    const cur = serviceMap.get(k) ?? { title: b.title.trim(), count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += Math.round(b.price * PROVIDER_SHARE);
    serviceMap.set(k, cur);
  }
  const topServices = [...serviceMap.values()].sort((a, b) => b.count - a.count || b.amount - a.amount).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const acceptRate = pct(accepted.length, answered.length);
  const finishRate = pct(completed.length, finishedOrCancelled.length);

  return (
    <div className="space-y-8">
      <PageHeader title="Statistiques" description="Calculées à partir de vos réservations. Les montants sont ce que vous touchez, frais de service déduits." />

      {bookings.length === 0 ? (
        <EmptyState
          title="Pas encore de chiffres"
          description="Vos statistiques apparaîtront après vos premières demandes. Un profil complet avec des photos aide à les recevoir."
          actionLabel="Compléter mon profil"
          actionHref="/dashboard/provider/services"
        />
      ) : (
        <>
          <Figures
            items={[
              { label: 'gagnés au total', value: formatPrice(totalEarned) },
              { label: 'prestations terminées', value: completed.length },
              { label: 'en moyenne par prestation', value: formatPrice(average) },
              { label: `note moyenne, ${stats?.reviewCount ?? 0} avis`, value: stats?.reviewCount ? formatRating(stats.ratingAvg) : '–' },
            ]}
          />

          <Section
            title="Revenus par mois"
            action={
              <div className="flex rounded-lg bg-muted p-0.5 text-[13px] font-semibold" role="group" aria-label="Période">
                {([6, 12] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={cn('h-7 rounded-md px-2.5', range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {r} mois
                  </button>
                ))}
              </div>
            }
          >
            <ol className="flex h-56 items-end gap-1.5 sm:gap-3" aria-label="Revenus par mois">
              {months.map((m, i) => {
                const last = i === months.length - 1;
                return (
                  <li key={m.key} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className={cn('text-[11px] font-semibold tabular text-muted-foreground sm:text-xs', range === 12 && 'hidden sm:block', m.amount === 0 && 'opacity-0')}>
                      {m.amount >= 1000 ? `${Math.round(m.amount / 1000)}k` : m.amount}
                    </span>
                    <span
                      className={cn('w-full rounded-t-md transition-colors', last ? 'bg-sun-400' : 'bg-brand-700 group-hover:bg-brand-600 dark:bg-brand-400 dark:group-hover:bg-brand-300', m.amount === 0 && 'bg-muted dark:bg-muted')}
                      style={{ height: m.amount === 0 ? 3 : `${Math.max(4, (m.amount / max) * 100)}%` }}
                      title={`${m.full} : ${formatPrice(m.amount)}, ${m.count} prestation${m.count > 1 ? 's' : ''}`}
                    />
                    <span className={cn('text-xs capitalize text-muted-foreground', last && 'font-semibold text-foreground')}>{m.label}</span>
                    <span className="sr-only">
                      {m.full} : {formatPrice(m.amount)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Comment vous répondez">
              <dl className="space-y-5">
                {[
                  { label: 'Demandes acceptées', value: acceptRate, detail: `${accepted.length} sur ${answered.length} demandes traitées` },
                  { label: 'Prestations menées à bout', value: finishRate, detail: `${completed.length} sur ${finishedOrCancelled.length} prestations payées` },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex items-baseline justify-between">
                      <dt className="font-medium">{r.label}</dt>
                      <dd className="font-display text-xl font-bold tabular">{r.value == null ? '–' : `${r.value} %`}</dd>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-700 dark:bg-brand-400" style={{ width: `${r.value ?? 0}%` }} />
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">{r.detail}</p>
                  </div>
                ))}
                <p className="border-t border-border pt-4 text-[13px] text-muted-foreground">
                  {stats?.contacts ?? 0} client{(stats?.contacts ?? 0) > 1 ? 's vous ont' : ' vous a'} contacté par message.
                </p>
              </dl>
            </Section>

            <Section title="Vos jours les plus chargés">
              <ul className="space-y-2">
                {DAYS.map((d, i) => (
                  <li key={d} className="flex items-center gap-3 text-sm">
                    <span className="w-9 text-muted-foreground">{d}</span>
                    <span className="h-6 flex-1 overflow-hidden rounded bg-muted">
                      <span
                        className={cn('block h-full rounded', byDay[i] === busiest && busiest > 0 ? 'bg-sun-400' : 'bg-brand-700/70 dark:bg-brand-400/70')}
                        style={{ width: busiest > 0 ? `${(byDay[i] / busiest) * 100}%` : 0 }}
                      />
                    </span>
                    <span className="w-6 text-right font-semibold tabular">{byDay[i]}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {topServices.length > 0 && (
            <Section title="Ce que les clients vous demandent" bodyClassName="p-0">
              <table className="w-full text-sm">
                <thead className="text-left text-[13px] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 font-medium">Prestation</th>
                    <th className="px-5 py-2.5 text-right font-medium">Fois</th>
                    <th className="px-5 py-2.5 text-right font-medium">Gagné</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topServices.map((s) => (
                    <tr key={s.title}>
                      <td className="max-w-0 truncate px-5 py-3 font-medium">{s.title}</td>
                      <td className="px-5 py-3 text-right tabular">{s.count}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular">{formatPrice(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
