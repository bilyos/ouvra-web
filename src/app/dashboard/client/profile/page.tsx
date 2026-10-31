'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Camera, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { mediaApi, userApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader, Section } from '@/components/dashboard/page-parts';
import { getApiErrorMessage } from '@/utils/api-error';
import { getInitials } from '@/utils/format';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Au moins 2 caractères.'),
  lastName: z.string().trim().min(2, 'Au moins 2 caractères.'),
  city: z.string().trim().min(2, 'Indiquez votre ville.'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Entrez votre mot de passe actuel.'),
    newPassword: z.string().min(8, 'Au moins 8 caractères.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Les deux mots de passe sont différents.', path: ['confirmPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[13px] text-red-600 dark:text-red-300">{message}</p> : null;
}

function Saved({ show, children }: { show: boolean; children: string }) {
  return (
    <span role="status" className={show ? 'inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-300' : 'sr-only'}>
      {show && <Check className="h-4 w-4" strokeWidth={3} />}
      {show ? children : ''}
    </span>
  );
}

const ROLE_LABEL = { CLIENT: 'Client', PROVIDER: 'Prestataire', ADMIN: 'Administrateur' } as const;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', city: user?.city ?? '' },
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const flash = (set: (v: boolean) => void) => {
    set(true);
    window.setTimeout(() => set(false), 3000);
  };

  const updateProfile = useMutation({
    mutationFn: userApi.update,
    onSuccess: (u) => {
      setUser(u);
      profileForm.reset({ firstName: u.firstName, lastName: u.lastName, city: u.city });
      flash(setProfileSaved);
    },
  });
  const changePassword = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      passwordForm.reset();
      flash(setPasswordSaved);
    },
  });
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => userApi.update({ avatarUrl: (await mediaApi.upload(file)).url }),
    onSuccess: (u) => setUser(u),
  });
  const deleteAccount = useMutation({
    mutationFn: userApi.deleteAccount,
    onSuccess: () => {
      logout();
      window.location.href = '/';
    },
  });

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-8">
      <PageHeader title="Mon profil" description="Ces informations sont visibles par les prestataires avec qui vous échangez." />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Identité */}
        <aside className="h-fit rounded-xl border border-border bg-card p-6 text-center lg:sticky lg:top-6">
          <div className="relative mx-auto h-28 w-28">
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display text-3xl font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
                <img loading="lazy" decoding="async" src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(fullName)
              )}
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-card bg-sun-400 text-gray-950 hover:bg-sun-300 disabled:opacity-70"
              aria-label="Changer la photo"
            >
              {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) uploadAvatar.mutate(f);
              }}
            />
          </div>
          {uploadAvatar.isError && <p className="mt-2 text-[13px] text-red-600 dark:text-red-300">La photo n’a pas pu être envoyée (8 Mo maximum).</p>}
          <p className="mt-4 font-display text-xl font-bold">{fullName}</p>
          <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]}</p>
          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-left text-sm">
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium tabular">{user.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all font-medium">{user.email}</dd>
            </div>
          </dl>
          <p className="mt-4 text-left text-[12px] text-muted-foreground">Pour changer de numéro ou d’email, écrivez au support : ils servent à vous identifier.</p>
        </aside>

        <div className="space-y-6">
          <Section title="Informations" description="Votre nom et votre ville apparaissent sur vos demandes.">
            <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" error={!!profileForm.formState.errors.firstName} {...profileForm.register('firstName')} />
                  <FieldError message={profileForm.formState.errors.firstName?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" error={!!profileForm.formState.errors.lastName} {...profileForm.register('lastName')} />
                  <FieldError message={profileForm.formState.errors.lastName?.message} />
                </div>
              </div>
              <div className="space-y-1.5 sm:max-w-sm">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" error={!!profileForm.formState.errors.city} {...profileForm.register('city')} />
                <FieldError message={profileForm.formState.errors.city?.message} />
              </div>
              {updateProfile.isError && <FieldError message={getApiErrorMessage(updateProfile.error, 'L’enregistrement n’a pas abouti.')} />}
              <div className="flex items-center gap-4 pt-1">
                <button
                  type="submit"
                  disabled={updateProfile.isPending || !profileForm.formState.isDirty}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950"
                >
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </button>
                <Saved show={profileSaved}>Enregistré</Saved>
              </div>
            </form>
          </Section>

          <Section id="password" className="scroll-mt-24" title="Mot de passe" description="Vous pouvez aussi vous connecter par SMS, sans mot de passe.">
            <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword }))} className="space-y-4" noValidate>
              <div className="space-y-1.5 sm:max-w-sm">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input id="currentPassword" type={showPwd ? 'text' : 'password'} autoComplete="current-password" className="pr-11" error={!!passwordForm.formState.errors.currentPassword} {...passwordForm.register('currentPassword')} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground" aria-label={showPwd ? 'Masquer' : 'Afficher'}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={passwordForm.formState.errors.currentPassword?.message} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" type={showPwd ? 'text' : 'password'} autoComplete="new-password" error={!!passwordForm.formState.errors.newPassword} {...passwordForm.register('newPassword')} />
                  <FieldError message={passwordForm.formState.errors.newPassword?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer</Label>
                  <Input id="confirmPassword" type={showPwd ? 'text' : 'password'} autoComplete="new-password" error={!!passwordForm.formState.errors.confirmPassword} {...passwordForm.register('confirmPassword')} />
                  <FieldError message={passwordForm.formState.errors.confirmPassword?.message} />
                </div>
              </div>
              {changePassword.isError && <FieldError message={getApiErrorMessage(changePassword.error, 'Mot de passe actuel incorrect.')} />}
              <div className="flex items-center gap-4 pt-1">
                <button type="submit" disabled={changePassword.isPending} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:bg-muted disabled:opacity-50">
                  {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Changer le mot de passe
                </button>
                <Saved show={passwordSaved}>Mot de passe changé</Saved>
              </div>
            </form>
          </Section>

          <section id="delete" className="scroll-mt-24 rounded-xl border border-red-200 p-5 dark:border-red-500/25">
            <h2 className="font-sans text-base font-semibold tracking-normal text-red-800 dark:text-red-200">Supprimer mon compte</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vos réservations, messages et favoris seront effacés. Cette action est définitive.</p>
            <button type="button" onClick={() => setDeleteOpen(true)} className="mt-4 h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10">
              Supprimer mon compte
            </button>
          </section>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement votre compte ?</DialogTitle>
            <DialogDescription>Tapez SUPPRIMER pour confirmer. Vous ne pourrez pas revenir en arrière.</DialogDescription>
          </DialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Confirmation" placeholder="SUPPRIMER" />
          {deleteAccount.isError && <FieldError message={getApiErrorMessage(deleteAccount.error, 'La suppression n’a pas abouti.')} />}
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setDeleteOpen(false)} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
              Annuler
            </button>
            <button
              type="button"
              onClick={() => deleteAccount.mutate()}
              disabled={confirmText.trim().toUpperCase() !== 'SUPPRIMER' || deleteAccount.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer définitivement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
