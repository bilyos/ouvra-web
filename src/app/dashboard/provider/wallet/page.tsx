'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { walletApi } from '@/services/api/wallet';
import { useAuthStore } from '@/stores/auth-store';
import { EmptyState, PageHeader, Section, StatusDot } from '@/components/dashboard/page-parts';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import { normalizeCameroonPhone } from '@/utils/phone';
import { getApiErrorMessage } from '@/utils/api-error';
import type { PaymentMethod, WalletTransaction } from '@/types';

const MIN_WITHDRAW = 500;
const PROVIDER_SHARE = 0.9;

function localPhone(phone: string | undefined) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('237') ? d.slice(3) : d;
}

function txStatus(tx: WalletTransaction) {
  if (tx.status === 'PENDING') return <StatusDot tone="yellow">En cours</StatusDot>;
  if (tx.status === 'FAILED') return <StatusDot tone="red">Échoué</StatusDot>;
  return null;
}

function monthLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(() => localPhone(user?.phone));
  const [method, setMethod] = useState<PaymentMethod>('ORANGE_MONEY');

  const { data: wallet, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const { data: transactions = [], isLoading: txLoading } = useQuery({ queryKey: ['wallet', 'transactions'], queryFn: walletApi.transactions });
  const { data: bookings = [] } = useQuery({ queryKey: ['bookings', 'received'], queryFn: bookingApi.received });

  const balance = wallet?.balance ?? 0;
  // Argent payé par les clients mais encore bloqué jusqu'à la fin du travail
  const held = bookings.filter((b) => b.escrowStatus === 'HELD' || b.escrowStatus === 'DISPUTED');
  const heldAmount = held.reduce((s, b) => s + Math.round(b.price * PROVIDER_SHARE), 0);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED')
      .filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: WalletTransaction[] }[] = [];
    for (const tx of [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const label = monthLabel(tx.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(tx);
      else groups.push({ label, items: [tx] });
    }
    return groups;
  }, [transactions]);

  const parsedAmount = parseInt(amount, 10);
  const normalizedPhone = normalizeCameroonPhone(phone);
  const amountError =
    amount.trim() === ''
      ? null
      : isNaN(parsedAmount) || parsedAmount < MIN_WITHDRAW
        ? `Le minimum est de ${formatPrice(MIN_WITHDRAW)}.`
        : parsedAmount > balance
          ? 'C’est plus que votre solde disponible.'
          : null;
  const canWithdraw = !isNaN(parsedAmount) && !amountError && !!normalizedPhone;

  const withdraw = useMutation({
    mutationFn: () => walletApi.withdraw({ amount: parsedAmount, method, phoneNumber: normalizedPhone! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setAmount('');
      toast({ title: 'Retrait demandé', description: `${formatPrice(parsedAmount)} vers le ${phone}.` });
    },
    onError: (err: unknown) => {
      toast({ title: 'Retrait impossible', description: getApiErrorMessage(err, 'Vérifiez le montant et le numéro, puis réessayez.'), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Portefeuille" description="Ce que vous avez gagné, ce qui arrive, et vos retraits vers Mobile Money." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-xl bg-brand-900 p-6 text-white sm:p-7">
            <p className="text-sm text-brand-100/80">Disponible maintenant</p>
            <p className="mt-1 font-display text-4xl font-bold tabular sm:text-5xl">{formatPrice(balance)}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-sm">
              <div>
                <dt className="text-brand-100/70">En attente</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular">{formatPrice(heldAmount)}</dd>
                <dd className="text-[13px] text-brand-100/60">
                  {held.length === 0 ? 'Aucun paiement bloqué' : `${held.length} prestation${held.length > 1 ? 's' : ''} payée${held.length > 1 ? 's' : ''}, pas encore terminée${held.length > 1 ? 's' : ''}`}
                </dd>
              </div>
              <div>
                <dt className="text-brand-100/70">Gagné ce mois</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular">{formatPrice(thisMonth)}</dd>
              </div>
            </dl>
          </div>

          <Section title="Mouvements" bodyClassName="p-0">
            {txLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Aucun mouvement pour l’instant"
                  description="Quand un client vous donne son code de fin de travail, le montant arrive ici."
                />
              </div>
            ) : (
              grouped.map((g) => (
                <div key={g.label}>
                  <p className="border-b border-border bg-paper px-5 py-2 text-[13px] font-semibold text-muted-foreground">{g.label}</p>
                  <ul className="divide-y divide-border">
                    {g.items.map((tx) => (
                      <li key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{tx.description || (tx.type === 'CREDIT' ? 'Paiement reçu' : 'Retrait')}</p>
                          <p className="truncate text-[13px] text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {tx.type === 'DEBIT' && tx.phoneNumber ? `, vers ${tx.phoneNumber}` : ''}
                          </p>
                        </div>
                        {txStatus(tx)}
                        <span className={cn('w-32 text-right font-semibold tabular', tx.type === 'CREDIT' ? 'text-brand-700 dark:text-brand-300' : 'text-foreground')}>
                          {tx.type === 'CREDIT' ? '+' : '−'}
                          {formatPrice(tx.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </Section>
        </div>

        <Section title="Retirer" description="L’argent arrive sur votre compte Mobile Money." className="h-fit lg:sticky lg:top-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canWithdraw) withdraw.mutate();
            }}
            className="space-y-5"
          >
            <div role="radiogroup" aria-label="Opérateur" className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'ORANGE_MONEY', label: 'Orange Money', badge: 'OM', cls: 'bg-[#ff7900] text-white' },
                  { id: 'MTN_MOMO', label: 'MTN MoMo', badge: 'MTN', cls: 'bg-[#ffcc00] text-gray-950' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm font-semibold transition-colors',
                    method === m.id ? 'border-brand-700 ring-1 ring-brand-700 dark:border-brand-300 dark:ring-brand-300' : 'border-border hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-black', m.cls)}>{m.badge}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="withdraw-phone" className="mb-1.5 block text-sm font-semibold">
                Numéro
              </label>
              <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
                <span className="flex items-center border-r border-border bg-paper px-3 text-sm font-semibold text-foreground/80">+237</span>
                <input
                  id="withdraw-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                  placeholder="6 90 00 01 01"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[16px] tabular outline-none"
                />
              </div>
              {phone.trim() !== '' && !normalizedPhone && <p className="mt-1.5 text-[13px] text-red-600 dark:text-red-300">9 chiffres, commençant par 6.</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="withdraw-amount" className="text-sm font-semibold">
                  Montant
                </label>
                <button type="button" onClick={() => setAmount(String(balance))} disabled={balance < MIN_WITHDRAW} className="text-[13px] font-semibold text-brand-700 hover:underline disabled:opacity-40 dark:text-brand-300">
                  Tout retirer
                </button>
              </div>
              <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
                <input
                  id="withdraw-amount"
                  type="number"
                  inputMode="numeric"
                  min={MIN_WITHDRAW}
                  max={balance}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[16px] font-semibold tabular outline-none"
                />
                <span className="flex items-center border-l border-border bg-paper px-3 text-sm font-semibold text-muted-foreground">FCFA</span>
              </div>
              <p className={cn('mt-1.5 text-[13px]', amountError ? 'text-red-600 dark:text-red-300' : 'text-muted-foreground')}>
                {amountError ?? `Minimum ${formatPrice(MIN_WITHDRAW)}.`}
              </p>
            </div>

            <button
              type="submit"
              disabled={!canWithdraw || withdraw.isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sun-400 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-colors hover:bg-sun-300 disabled:opacity-50"
            >
              {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {canWithdraw ? `Retirer ${formatPrice(parsedAmount)}` : 'Retirer'}
            </button>
            {balance < MIN_WITHDRAW && <p className="text-center text-[13px] text-muted-foreground">Votre solde doit atteindre {formatPrice(MIN_WITHDRAW)} pour retirer.</p>}
          </form>
        </Section>
      </div>
    </div>
  );
}
