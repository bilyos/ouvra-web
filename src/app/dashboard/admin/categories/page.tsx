'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Baby,
  Camera,
  GraduationCap,
  Hammer,
  Heart,
  Loader2,
  Monitor,
  Paintbrush,
  PartyPopper,
  Pencil,
  Plus,
  Scissors,
  Search,
  Shield,
  SprayCan,
  Trash2,
  TreePine,
  Truck,
  UtensilsCrossed,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi, categoryApi } from '@/services/api';
import { EmptyState, PageHeader } from '@/components/dashboard/page-parts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/api-error';
import type { Category } from '@/types';

/** Icônes proposées à la création (le nom est stocké tel quel côté API). */
const ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'plumbing', label: 'Plomberie', icon: Wrench },
  { id: 'electrical', label: 'Électricité', icon: Zap },
  { id: 'cleaning', label: 'Nettoyage', icon: SprayCan },
  { id: 'content_cut', label: 'Coiffure', icon: Scissors },
  { id: 'build', label: 'Construction', icon: Hammer },
  { id: 'format_paint', label: 'Peinture', icon: Paintbrush },
  { id: 'restaurant', label: 'Cuisine', icon: UtensilsCrossed },
  { id: 'computer', label: 'Informatique', icon: Monitor },
  { id: 'checkroom', label: 'Couture', icon: Wind },
  { id: 'grass', label: 'Jardinage', icon: TreePine },
  { id: 'local_shipping', label: 'Déménagement', icon: Truck },
  { id: 'child_care', label: 'Garde d’enfants', icon: Baby },
  { id: 'school', label: 'Cours', icon: GraduationCap },
  { id: 'spa', label: 'Esthétique', icon: Heart },
  { id: 'camera', label: 'Photographie', icon: Camera },
  { id: 'celebration', label: 'Événementiel', icon: PartyPopper },
  { id: 'security', label: 'Sécurité', icon: Shield },
];
const ALIASES: Record<string, LucideIcon> = { wrench: Wrench, zap: Zap, hammer: Hammer, carpenter: Hammer, paintbrush: Paintbrush, sparkles: SprayCan };
const iconFor = (name: string | null | undefined): LucideIcon => (name && (ICONS.find((i) => i.id === name)?.icon ?? ALIASES[name])) || Wrench;

type Modal = { mode: 'create' } | { mode: 'edit'; category: Category; index: number } | { mode: 'delete'; category: Category } | null;

const input = 'h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15';

export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formOrder, setFormOrder] = useState(0);

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list() });

  const close = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setModal(null);
  };
  const create = useMutation({ mutationFn: adminApi.createCategory, onSuccess: close });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: { label?: string; icon?: string; sortOrder?: number } }) => adminApi.updateCategory(id, data), onSuccess: close });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteCategory(id), onSuccess: close });
  const saving = create.isPending || update.isPending || remove.isPending;
  const error = create.error ?? update.error ?? remove.error;

  const q = search.trim().toLowerCase();
  const filtered = categories.map((c, index) => ({ c, index })).filter(({ c }) => !q || c.label.toLowerCase().includes(q) || c.id.includes(q));

  const reset = () => [create, update, remove].forEach((m) => m.reset());
  const openCreate = () => {
    reset();
    setFormId('');
    setFormLabel('');
    setFormIcon(ICONS[0].id);
    setFormOrder(categories.length);
    setModal({ mode: 'create' });
  };
  const openEdit = (category: Category, index: number) => {
    reset();
    setFormId(category.id);
    setFormLabel(category.label);
    setFormIcon(category.icon || '');
    setFormOrder(index);
    setModal({ mode: 'edit', category, index });
  };

  const submit = () => {
    if (!modal) return;
    if (modal.mode === 'create') create.mutate({ id: formId, label: formLabel.trim(), icon: formIcon, sortOrder: formOrder });
    else if (modal.mode === 'edit')
      update.mutate({
        id: modal.category.id,
        // L'ordre n'est envoyé que s'il a changé, pour ne pas réordonner la liste par erreur
        data: { label: formLabel.trim(), icon: formIcon, ...(formOrder !== modal.index ? { sortOrder: formOrder } : {}) },
      });
    else remove.mutate(modal.category.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle', { count: categories.length })}
        actions={
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sun-400 px-4 text-sm font-bold text-gray-950 hover:bg-sun-300">
            <Plus className="h-4 w-4" />
            {t('new')}
          </button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          aria-label={t('searchPlaceholder')}
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map(({ c, index }) => {
            const Icon = iconFor(c.icon);
            return (
              <li key={c.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 text-right text-sm tabular text-muted-foreground">{index + 1}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.label}</span>
                  <span className="block truncate font-mono text-[12px] text-muted-foreground">{c.id}</span>
                </span>
                <button type="button" onClick={() => openEdit(c, index)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted" aria-label={`${t('edit')} ${c.label}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setModal({ mode: 'delete', category: c });
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                  aria-label={`${t('delete')} ${c.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!modal} onOpenChange={(o) => !o && !saving && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          {modal && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle>{modal.mode === 'create' ? t('modalCreate') : modal.mode === 'edit' ? t('modalEdit') : t('confirmDelete', { label: modal.category.label })}</DialogTitle>
                {modal.mode === 'delete' && <DialogDescription>{t('deleteHint')}</DialogDescription>}
              </DialogHeader>

              {modal.mode !== 'delete' && (
                <>
                  <div>
                    <label htmlFor="cat-label" className="mb-1.5 block text-sm font-semibold">
                      {t('nameLabel')}
                    </label>
                    <input
                      id="cat-label"
                      value={formLabel}
                      onChange={(e) => {
                        setFormLabel(e.target.value);
                        if (modal.mode === 'create')
                          setFormId(
                            e.target.value
                              .normalize('NFD')
                              .replace(/[̀-ͯ]/g, '')
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, '')
                          );
                      }}
                      placeholder={t('labelPlaceholder')}
                      className={input}
                      autoFocus
                    />
                  </div>

                  {modal.mode === 'create' && (
                    <div>
                      <label htmlFor="cat-id" className="mb-1.5 block text-sm font-semibold">
                        {t('idLabel')}
                      </label>
                      <input id="cat-id" value={formId} onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder={t('idPlaceholder')} className={cn(input, 'font-mono text-sm')} />
                      <p className="mt-1.5 text-[13px] text-muted-foreground">{t('idHint')}</p>
                    </div>
                  )}

                  <fieldset>
                    <legend className="mb-1.5 text-sm font-semibold">{t('iconLabel')}</legend>
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                      {ICONS.map((ic) => (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setFormIcon(ic.id)}
                          aria-pressed={formIcon === ic.id}
                          title={ic.label}
                          aria-label={ic.label}
                          className={cn(
                            'flex aspect-square items-center justify-center rounded-lg border transition-colors',
                            formIcon === ic.id ? 'border-brand-700 bg-brand-50 text-brand-800 ring-1 ring-brand-700 dark:border-brand-300 dark:bg-brand-900/60 dark:text-brand-200 dark:ring-brand-300' : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <ic.icon className="h-[18px] w-[18px]" />
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="cat-order" className="mb-1.5 block text-sm font-semibold">
                      {t('order')}
                    </label>
                    <input id="cat-order" type="number" min={0} value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} className={cn(input, 'w-28 tabular')} />
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {getApiErrorMessage(error, t('actionError'))}
                </p>
              )}

              <DialogFooter className="gap-2">
                <button type="button" onClick={() => setModal(null)} disabled={saving} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving || (modal.mode !== 'delete' && (!formLabel.trim() || (modal.mode === 'create' && !formId)))}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-50',
                    modal.mode === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-sun-400 font-bold text-gray-950 hover:bg-sun-300'
                  )}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modal.mode === 'create' ? t('create') : modal.mode === 'edit' ? t('save') : t('delete')}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
