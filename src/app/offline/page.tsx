import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata = { title: 'Hors connexion' };

/** Affichée par le service worker quand une page n'est pas encore en cache et que le réseau manque. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-bold">Pas de connexion</h1>
      <p className="mt-3 max-w-sm text-[15px] text-muted-foreground">
        Cette page n’a pas encore été enregistrée sur votre téléphone. Vos réservations déjà ouvertes restent consultables.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard/client/bookings" className="inline-flex h-11 items-center justify-center rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 hover:bg-sun-300">
          Mes réservations
        </Link>
        <a href="" className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-[15px] font-semibold hover:bg-muted">
          Réessayer
        </a>
      </div>
    </main>
  );
}
